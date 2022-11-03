import { GroupTab } from "../utils/GroupTab";
import { StorageHandler } from "../utils/Storage/StorageHandler";
import browser, { tabs, sessions, Tabs } from "webextension-polyfill";
import { GROUP_TAB_SESSION_KEY, INNER_TAB_SESSION_KEY } from "../utils/Consts";
import { findNewActiveTab } from "../utils/Utils";

/**
 * Class in charge of various tasks regarding session data
 */
export class SessionsHandler {
  //#region Singleton

  private static _instance: SessionsHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): SessionsHandler {
    if (!SessionsHandler._instance) {
      SessionsHandler._instance = new SessionsHandler();
    }

    return SessionsHandler._instance;
  }

  //#endregion

  setupSessionsHandler() {
    const storageHandler = StorageHandler.instance;

    storageHandler.onAddTab.addListener(this.onAddTab.bind(this));

    storageHandler.onRemoveTab.addListener(this.onRemoveTab.bind(this));

    storageHandler.onEditTab.addListener(this.onEditTab.bind(this));
  }

  //#region Listeners

  /**
   * Handles adding session data to group tab and inner tabs
   * @param groupTab The group tab that was either added or had an inner tab added
   * @param index The index of the added inner tab or undefined if a group tab was added
   */
  private async onAddTab(groupTab: GroupTab, index?: number) {
    // Checks if just group tab or inner tab as well
    if (index) {
      sessions.setTabValue(
        groupTab.innerTabs[index],
        INNER_TAB_SESSION_KEY,
        groupTab.id
      );
    } else {
      groupTab.innerTabs.forEach((id) => {
        sessions.setTabValue(id, INNER_TAB_SESSION_KEY, groupTab.id);
      });
    }

    this.onEditTab(groupTab);
  }

  /**
   * Handles deleting the group tab info from the inner tabs that were either deleted or had the group tab removed.
   *
   * Updating the group tab info is done elsewhere as it needs to be handled on the delete event it self
   *
   * @param groupTab The group tab that was either removed or had an inner tab removed
   * @param id The id of the inner tab that was removed from the group tab, undefined if the group tab was removed
   */
  private async onRemoveTab(groupTab: GroupTab, id?: number) {
    // Handles inner tab changes
    if (id) {
      sessions.removeTabValue(id, INNER_TAB_SESSION_KEY);
      this.onEditTab(groupTab);

      return;
    } else {
      // Clears the group tab info from the inner tabs as only other code can handle group tab session code
      groupTab.innerTabs.forEach((id) => {
        sessions.removeTabValue(id, INNER_TAB_SESSION_KEY);
      });
    }
  }

  /**
   * Updates the session info for the group tab
   * @param groupTab The group tab that had edits in it
   */
  private async onEditTab(groupTab: GroupTab) {
    sessions.setTabValue(groupTab.id, GROUP_TAB_SESSION_KEY, groupTab);
  }

  //#endregion

  /**
   * Loads the sessions data for when user starts up the browser
   */
  async loadUpStartupData() {
    const restoredTabs = await tabs.query({});

    const groupsSessionInfo: Record<
      number,
      { groupTab: GroupTab; groupTabInfo: Tabs.Tab; innerTabs: number[] }
    > = {};

    // Goes over the tabs and checks which are related to extension
    for (const tab of restoredTabs) {
      const groupTabData = await sessions.getTabValue(
        tab.id!,
        GROUP_TAB_SESSION_KEY
      );
      const innerTabData = await sessions.getTabValue(
        tab.id!,
        INNER_TAB_SESSION_KEY
      );

      if (groupTabData) {
        groupsSessionInfo[groupTabData.id] = {
          groupTab: groupTabData,
          groupTabInfo: tab,
          innerTabs: [],
        };
      }

      // Inner tabs will always be a after group tab in order so we can assume the the info was added
      if (innerTabData) {
        groupsSessionInfo[innerTabData].innerTabs.push(tab.id!);
      }
    }

    // Updates the session values
    Object.values(groupsSessionInfo).forEach(
      async ({ groupTab, groupTabInfo, innerTabs }) => {
        const restoredGroupTab =
          await StorageHandler.instance.updateGroupTabFromSession(
            groupTab.id,
            groupTabInfo.id!,
            groupTab.name,
            innerTabs,
            groupTab.icon,
            groupTab.isOpen
          );

        await sessions.setTabValue(
          restoredGroupTab.id,
          GROUP_TAB_SESSION_KEY,
          restoredGroupTab
        );

        restoredGroupTab.innerTabs.forEach((innerTabId) => {
          sessions.setTabValue(
            innerTabId,
            INNER_TAB_SESSION_KEY,
            restoredGroupTab.id
          );
        });

        // Keeps the inner tabs in the correct visibility
        restoredGroupTab.isOpen
          ? tabs.show(restoredGroupTab.innerTabs)
          : tabs.hide(restoredGroupTab.innerTabs);
      }
    );
  }

  /**
   * Handles fixing group tab info after the user restored the group tab was restored by user
   * @param groupTabInfo The group tab info
   * @param sessionGroupTab The session info for the reopened group tab
   */
  async handleRestoredGroupTab(
    groupTabInfo: Tabs.Tab,
    sessionGroupTab: GroupTab
  ) {
    const innerTabs: number[] = [];

    // Sorted by index
    const windowTabs = await tabs.query({ windowId: groupTabInfo.windowId });

    // Adds to innerTabs all the updated ids of the inner tabs
    for (
      let index = 0;
      index < windowTabs.length &&
      innerTabs.length !== sessionGroupTab.innerTabs.length;
      index++
    ) {
      const tab = windowTabs[index];

      // Checks for the session info we need
      const innerTabSessionInfo = await sessions.getTabValue(
        tab.id!,
        INNER_TAB_SESSION_KEY
      );

      if (innerTabSessionInfo === sessionGroupTab.id) {
        innerTabs.push(tab.id!);
      }
    }

    const restoredGroupTab =
      await StorageHandler.instance.updateGroupTabFromSession(
        sessionGroupTab.id,
        groupTabInfo.id!,
        sessionGroupTab.name,
        innerTabs,
        sessionGroupTab.icon,
        // Since it's empty should always be true
        true
      );

    // Resets the session data
    await sessions.setTabValue(
      restoredGroupTab.id,
      GROUP_TAB_SESSION_KEY,
      restoredGroupTab
    );

    innerTabs.forEach((innerTabId) => {
      sessions.setTabValue(
        innerTabId,
        INNER_TAB_SESSION_KEY,
        restoredGroupTab.id
      );
    });

    if (groupTabInfo.active) {
      await findNewActiveTab();
    }

    await tabs.reload(restoredGroupTab.id, {});
  }
}
