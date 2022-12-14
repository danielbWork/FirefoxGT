import {
  CREATE_NEW_GROUP_TAB_ID,
  GROUP_TAB_SESSION_KEY,
  GROUP_TAB_URL,
  OPEN_LINK_IN_GROUP_TAB_ID,
  OPEN_LINK_IN_NEW_GROUP_TAB_ID,
} from "../../utils/Consts";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import browser, {
  Tabs,
  Menus,
  tabs,
  bookmarks,
  sessions,
} from "webextension-polyfill";
import {
  checkMovedIntoGroupTab,
  createNotification,
  moveGroupTab,
} from "../../utils/Utils";
import { SessionsHandler } from "../SessionsHandler";
import { BackgroundDialogHandler } from "../BackgroundDialogHandler";

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
    if (typeof info.menuItemId !== "string") return;

    // Sends to appropriate create method
    if (info.menuItemId === CREATE_NEW_GROUP_TAB_ID) {
      this.addTabToGroupTab(tab!);
    }

    if (info.menuItemId === OPEN_LINK_IN_NEW_GROUP_TAB_ID) {
      this.openLinkInNewGroupTab(info);
    }

    if (info.menuItemId.startsWith(OPEN_LINK_IN_GROUP_TAB_ID)) {
      this.openLinkInGroupTab(info);
    }
  }

  /**
   *  Checks to see if tab was created inside a group tab area and adds it to the group
   * @param tab The tab that was added to ui
   */
  private async onCreateTab(tab: Tabs.Tab) {
    const sessionGroupTabInfo = await sessions.getTabValue(
      tab.id!,
      GROUP_TAB_SESSION_KEY
    );

    // Checks if group tab restored by user
    if (sessionGroupTabInfo) {
      await SessionsHandler.instance.handleRestoredGroupTab(
        tab,
        sessionGroupTabInfo
      );
      return;
    }

    const { groupTab } = StorageHandler.instance.getGroupTabOrInnerTabByID(
      tab.id
    );

    // Makes sure group tab was created properly with inner tabs after it
    if (groupTab) {
      await tabs.reload(groupTab.id);
      return;
    }

    let openInGroupTab, openInGroupTabInfo;

    // Checks to see if the tab was opened from an inner tab
    if (tab.openerTabId !== undefined) {
      const { groupTab: openerGroupTab } =
        StorageHandler.instance.getGroupTabOrInnerTabByID(tab.openerTabId);

      // Makes sure invalid value wasn't passed
      if (openerGroupTab) {
        openInGroupTab = openerGroupTab;

        openInGroupTabInfo = await tabs.get(openerGroupTab.id);
      }
    } else {
      // This checks mostly for reopened (ctrl shift t) tabs
      const { groupTab: openedGroupTab, groupTabInfo: openedGroupTabInfo } =
        await checkMovedIntoGroupTab(tab.index, tab.windowId!);

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
    const groupTabTitle = await this.handleEnterGroupTabName();

    // Incase something went wrong with input
    if (groupTabTitle && tab.id) {
      this.handleGroupTabCreation(groupTabTitle, [tab.id], tab.index);
    }
  }

  /**
   * Create a new group tab with a new inner tab from the link/bookmark
   *
   * @param info The info of the link/bookmark that was pressed
   */
  private async openLinkInNewGroupTab(info: Menus.OnClickData) {
    let url;

    // Gets the url value from where it's needed
    if (info.linkText) {
      url = info.linkUrl;
    } else if (info.bookmarkId) {
      const bookmark = (await bookmarks.get(info.bookmarkId))[0];

      url = bookmark.url;
    }

    const groupTabTitle = await this.handleEnterGroupTabName();

    // Incase something went wrong with input
    if (groupTabTitle) {
      try {
        const newTab = await tabs.create({
          url,
          active: false,
        });

        this.handleGroupTabCreation(groupTabTitle, [newTab.id!]);
      } catch (error: any) {
        console.log(error);

        createNotification("Create Failed", error.message || "Invalid url");
      }
    }
  }

  /**
   * Create a new tab with the inner link/bookmark with a inside the group tab
   *
   * @param info The info of the link/bookmark that was pressed
   */
  private async openLinkInGroupTab(info: Menus.OnClickData) {
    let url;

    // Gets the url value from were it's needed
    if (info.linkUrl) {
      url = info.linkUrl;
    } else if (info.bookmarkId) {
      const bookmark = (await bookmarks.get(info.bookmarkId))[0];
      url = bookmark.url;
    }

    // Removes warning
    if (typeof info.menuItemId !== "string") return;

    const groupTabID = parseInt(
      info.menuItemId.substring(OPEN_LINK_IN_GROUP_TAB_ID.length)
    );

    const groupTab = StorageHandler.instance.getGroupTabByID(groupTabID)!;

    const newTab = await tabs.create({
      url,
      active: false,
    });

    await StorageHandler.instance.addInnerTab(groupTab, newTab.id!);

    await moveGroupTab(groupTab, [newTab.id!]);
  }

  /**
   * Requests the group tab name from the user
   * @returns The group tab name or undefined if user chose or couldn't enter name
   */
  private async handleEnterGroupTabName(): Promise<string | undefined> {
    const defaultTitle = StorageHandler.instance.settings.defaultGroupTabName;

    // Checks to see if the user wants to skip entering a name
    if (!StorageHandler.instance.settings.showCreateGroupTabNameDialog.menu) {
      return defaultTitle;
    }

    const results =
      await BackgroundDialogHandler.instance.displayTextInputDialog(
        "Create Group Tab",
        "Please enter the Group tab's name",
        defaultTitle
      );

    return results;
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

    await StorageHandler.instance.addGroupTab(groupTab.id!, name, innerTabs);

    // Moves the inner tabs to make sure they are after group tab
    await moveGroupTab(groupTab.id!);
  }

  //#endregion
}
