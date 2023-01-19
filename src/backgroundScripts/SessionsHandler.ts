import { GroupTab } from "../utils/GroupTab";
import { StorageHandler } from "../utils/Storage/StorageHandler";
import browser, { tabs, sessions, Tabs, runtime } from "webextension-polyfill";
import {
  GROUP_TAB_SESSION_KEY,
  GROUP_TAB_URL,
  INNER_TAB_SESSION_KEY,
} from "../utils/Consts";
import { createNotification, findNewActiveTab } from "../utils/Utils";
import { ContextMenuHandler } from "./ContextMenuHandler";

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
   * Handles update to extension, restoring all the removed group tabs
   */
  async handleUpdate() {
    const groupTabIds = await StorageHandler.instance.getAllGroupTabIDs();

    // No group tabs no problems
    if (!groupTabIds.length) return;

    // Adds 10 as buffer incase other tabs were removed at the same time
    const recentlyClosed = await sessions.getRecentlyClosed({
      maxResults: groupTabIds.length + 10,
    });

    recentlyClosed.forEach(async (session) => {
      // Only cares about tabs
      if (!session.tab) return;
      // Checks if group tab
      if (session.tab.url === runtime.getURL(GROUP_TAB_URL)) {
        sessions.restore(session.tab.sessionId);
      }
    });
  }

  /**
   * Loads the sessions data for when user starts up the browser
   */
  async loadStartupData() {
    createNotification(
      "Started Loading Group Tab",
      "Please wait until complete"
    );

    const restoredGroupTabs = await tabs.query({
      url: runtime.getURL(GROUP_TAB_URL),
    });

    // Goes over the tabs and checks which are related to extension
    for (const tab of restoredGroupTabs) {
      const groupTabData = await sessions.getTabValue(
        tab.id!,
        GROUP_TAB_SESSION_KEY
      );

      this.handleRestoredGroupTab(tab, groupTabData);
    }

    createNotification("Load Completed", "Finished loading group tabs");
  }

  /**
   * Handles fixing group tab info after the user restored the group tab
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
      let index = groupTabInfo.index + 1;
      index < windowTabs.length &&
      innerTabs.length !== sessionGroupTab.innerTabs.length;
      index++
    ) {
      const tab = windowTabs[index];

      // Skips group tabs
      if (tab.url === runtime.getURL(GROUP_TAB_URL)) continue;

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
        sessionGroupTab.isOpen,
        sessionGroupTab.isClosedGroupMode
      );

    // Resets the session data
    sessions.setTabValue(
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

    if (groupTabInfo.active && !restoredGroupTab.isClosedGroupMode) {
      findNewActiveTab();
    }

    // Fixes bug that causes the group tab not having context menu items
    ContextMenuHandler.instance.addGroupTabToContextMenu(restoredGroupTab);
  }
}
