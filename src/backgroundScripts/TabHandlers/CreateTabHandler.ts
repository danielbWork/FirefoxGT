import {
  CREATE_NEW_GROUP_TAB_ID,
  GROUP_TAB_URL,
  OPEN_LINK_IN_GROUP_TAB_ID,
  OPEN_LINK_IN_NEW_GROUP_TAB_ID,
} from "../../utils/Consts";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import browser, { Tabs, Menus, tabs } from "webextension-polyfill";
import { checkMovedIntoGroupTab } from "../../utils/Utils";

/**
 * Handles group tab creation and other tab creation
 */
export class CreateTabHandler {
  //#region Singleton

  private static _instance: CreateTabHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): CreateTabHandler {
    if (!CreateTabHandler._instance) {
      CreateTabHandler._instance = new CreateTabHandler();
    }

    return CreateTabHandler._instance;
  }

  //#endregion

  /**
   * Handles setup for group tab creation
   */
  setupCreateHandler() {
    browser.contextMenus.onClicked.addListener(
      this.onCreateGroupTabMenuClick.bind(this)
    );

    tabs.onCreated.addListener(this.onCreateTab.bind(this));
  }

  //#region Listeners

  /**
   * Creates a group tab with the given tab as it's inner tab
   * @param info The info regarding the tab that was pressed
   * @param tab The tab that the user added to the group
   */
  private async onCreateGroupTabMenuClick(
    info: Menus.OnClickData,
    tab?: Tabs.Tab
  ) {
    // Only cares if we receive a tab
    if (!tab || typeof info.menuItemId !== "string") return;

    // Sends to appropriate create method
    if (info.menuItemId === CREATE_NEW_GROUP_TAB_ID) {
      this.addTabToGroupTab(tab);
    }

    if (info.menuItemId === OPEN_LINK_IN_NEW_GROUP_TAB_ID) {
      this.openLinkInNewGroupTab(info.linkUrl!, info.linkText!, tab.index);
    }

    if (info.menuItemId.startsWith(OPEN_LINK_IN_GROUP_TAB_ID)) {
      this.openLinkInGroupTab(
        info.linkUrl!,
        parseInt(info.menuItemId.substring(OPEN_LINK_IN_GROUP_TAB_ID.length))
      );
    }
  }

  /**
   *  Checks to see if tab was created inside a group tab area and adds it to the group
   * @param tab The tab that was added to ui
   */
  private async onCreateTab(tab: Tabs.Tab) {
    const { groupTab } =
      await StorageHandler.instance.getGroupTabOrInnerTabByID(tab.id);

    // Only cares about reloading the group tab if needed
    if (groupTab) {
      await tabs.reload(groupTab.id);
      return;
    }

    let openInGroupTab, openInGroupTabInfo;

    // Checks to see if the tab was opened from an inner tab
    if (tab.openerTabId !== undefined) {
      const { groupTab: openerGroupTab } =
        await StorageHandler.instance.getGroupTabOrInnerTabByID(
          tab.openerTabId
        );

      // Makes sure invalid value wasn't passed
      if (openerGroupTab) {
        openInGroupTab = openerGroupTab;

        openInGroupTabInfo = await tabs.get(openerGroupTab.id);
      }
    } else {
      // This checks mostly for reopened (ctrl shift t) tabs
      const { groupTab: openedGroupTab, groupTabInfo: openedGroupTabInfo } =
        await checkMovedIntoGroupTab(tab.index);

      openInGroupTab = openedGroupTab;
      openInGroupTabInfo = openedGroupTabInfo;
    }

    // If inside a group in any way compliantly adds it
    if (openInGroupTab && openInGroupTabInfo) {
      const index = tab.index - openInGroupTabInfo.index - 1;

      StorageHandler.instance.addInnerTab(openInGroupTab, tab.id!, index);

      await tabs.reload(openInGroupTab.id);
    }
  }

  //#endregion

  //#region Create Group Tab

  /**
   * Creates a new group tab with the given tab as it's inner tab
   * @param tab The tab that we add to group tab
   */
  private async addTabToGroupTab(tab: Tabs.Tab) {
    const groupTabTitle = await this.handleEnterGroupTabName(tab.title);

    // Incase something went wrong with input
    if (groupTabTitle && tab.id) {
      this.handleGroupTabCreation(groupTabTitle, [tab.id], tab.index);
    }
  }

  /**
   * Create a new group tab with a new inner tab from the link
   *
   * @param linkUrl The url of link of the to be inner tab
   * @param linkText The text of the link we want to open
   * @param index The location we want to put the group at
   */
  private async openLinkInNewGroupTab(
    linkUrl: string,
    linkText: string,
    index: number
  ) {
    const groupTabTitle = await this.handleEnterGroupTabName(linkText);

    // Incase something went wrong with input
    if (groupTabTitle) {
      const newTab = await tabs.create({
        url: linkUrl,
        index: index + 1,
        active: false,
      });

      this.handleGroupTabCreation(groupTabTitle, [newTab.id!], index + 1);
    }
  }

  /**
   * Create a new tab with the inner link with a inside the group tab
   *
   * @param linkUrl The url of link of the to be inner tab
   * @param groupTabID id of the group tab we want to add the tab to
   */
  private async openLinkInGroupTab(linkUrl: string, groupTabID: number) {
    const groupTabInfo = await tabs.get(groupTabID);
    const groupTab = (await StorageHandler.instance.getGroupTabByID(
      groupTabID
    ))!;

    const newTab = await tabs.create({
      url: linkUrl,
      index: groupTabInfo.index + groupTab.innerTabs.length,
      active: false,
    });

    await StorageHandler.instance.addInnerTab(groupTab, newTab.id!);

    tabs.move([groupTabID, ...groupTab.innerTabs, newTab.id!], {
      index: groupTabInfo.index,
    });
  }

  /**
   * Requests the group tab name from the user
   * @param defaultTitle The default title for the group tab, defaults to "Group Tab"
   * @returns The group tab name or undefined if user chose or couldn't enter name
   */
  private async handleEnterGroupTabName(
    defaultTitle = "Group Tab"
  ): Promise<string | undefined> {
    const createPrompt = `prompt("Please enter the Group tab's name", "${defaultTitle}");`;

    const results = await tabs.executeScript({ code: createPrompt });

    // TODO Use pop up instead
    // Checks if user is in special tab
    if (!results || results[0] === undefined) {
      browser.notifications.create({
        type: "basic",
        // TODO Add Icon
        title: "Create Failed",
        message:
          "Can't create in this tab as it is blocked by firefox, please move to another tab and try again",
      });

      return;
    }

    // Checks if user chose to exit dialog
    if (results[0] === null) {
      return;
    }

    // Makes sure to block empty names
    if (results[0].trim() === "") {
      browser.notifications.create({
        type: "basic",
        // TODO Add Icon
        title: "Create Failed",
        message: "Can't create group tab with empty name",
      });

      return;
    }

    return results[0];
  }

  /**
   *  Handles the actual creation of the group tab
   * @param name The name of the group tab defaults to "Group tab"
   * @param innerTabs The id's of the inner tabs or just an empty array if nothing is passed
   * @param index The index to put the group tab if nothing is passed then end of window
   */
  private async handleGroupTabCreation(
    name = "Group tab",
    innerTabs: number[] = [],
    index?: number
  ) {
    // Creates the group tab with the relevant info
    const groupTab = await tabs.create({
      url: GROUP_TAB_URL,
      index,
      active: false,
    });

    try {
      await StorageHandler.instance.addGroupTab(groupTab.id!, name, innerTabs);
    } catch (error) {
      console.log({ error });
    }
  }

  //#endregion
}
