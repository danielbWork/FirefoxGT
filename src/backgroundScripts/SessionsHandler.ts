import { GroupTab } from "../utils/GroupTab";
import { StorageHandler } from "../utils/Storage/StorageHandler";
import browser, { sessions } from "webextension-polyfill";
import { GROUP_TAB_SESSION_KEY, INNER_TAB_SESSION_KEY } from "../utils/Consts";

/**
 * Class in charge of adding session info to group tabs and inner tabs
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
}
