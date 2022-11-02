import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { GroupTab } from "../../utils/GroupTab.js";
import browser, { Menus, sessions, Tabs, tabs } from "webextension-polyfill";
import { createNotification, delay, moveGroupTab } from "../../utils/Utils";
import {
  GROUP_TAB_SESSION_KEY,
  GROUP_TAB_URL,
  REMOVE_FROM_GROUP_TAB_ID,
} from "../../utils/Consts";

/**
 * Handles tabs and group tabs being removed
 */
export class RemoveTabHandler {
  //#region Singleton

  private static _instance: RemoveTabHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): RemoveTabHandler {
    if (!RemoveTabHandler._instance) {
      RemoveTabHandler._instance = new RemoveTabHandler();
    }

    return RemoveTabHandler._instance;
  }

  //#endregion

  /**
   * Handles setup for group tab removing
   */
  setupRemoveHandler() {
    tabs.onRemoved.addListener(this.onRemoveTabFromScreen.bind(this));
    StorageHandler.instance.onRemoveTab.addListener(
      this.onRemoveTabFromStorage.bind(this)
    );

    browser.contextMenus.onClicked.addListener(
      this.onRemoveContextMenuItem.bind(this)
    );
  }

  /**
   * Removes the tabs based on which item was clicked
   * @param info The info regarding the tab that was pressed
   * @param tab The tab that the user wants to move
   */
  private async onRemoveContextMenuItem(
    info: Menus.OnClickData,
    tab?: Tabs.Tab
  ) {
    if (info.menuItemId === REMOVE_FROM_GROUP_TAB_ID && tab) {
      const { groupTab } = StorageHandler.instance.getGroupTabOrInnerTabByID(
        tab.id
      );

      let results;

      // Checks if request from dialog is needed
      if (StorageHandler.instance.settings.showRemoveFromGroupTabDialog.menu) {
        const confirmText = `Are you sure you want remove tab ${tab.title?.replaceAll(
          '"',
          '\\"'
        )} from group ${groupTab?.name.replaceAll('"', '\\"')}?`;

        results = await tabs.executeScript({
          code: `confirm("${confirmText}");`,
        });
      } else {
        results = [true];
      }

      if (results[0]) {
        await this.removeTabFromGroupMenuClick(groupTab!, tab.id!);
      }
    }
  }

  /**
   * Removes the inner tab from the group and puts it outside the group
   * @param groupTab The group tab that contains the inner tab
   * @param id The id of the inner tab we want to remove from the group tab
   */
  private async removeTabFromGroupMenuClick(groupTab: GroupTab, id: number) {
    await StorageHandler.instance.removeInnerTab(groupTab, id);

    // Gets groupTab now after it's value was updated
    const updatedGroupTab = StorageHandler.instance.getGroupTabByID(
      groupTab.id
    )!;

    // Makes sure that move keeps the order of the group and put removed tab outside of it
    await moveGroupTab(updatedGroupTab, [id]);
  }

  /**
   * Removes the group tab or inner tab from the storage
   *
   * @param tabId The id of the tab we want to remove
   * @param removeInfo Info regarding deleting the tab
   */
  private async onRemoveTabFromScreen(
    tabId: number,
    removeInfo: Tabs.OnRemovedRemoveInfoType
  ) {
    // Removes the group tab from history only when necessary
    if (
      !removeInfo.isWindowClosing &&
      StorageHandler.instance.settings.removeGroupTabFromMemory
    ) {
      const groupTab = await StorageHandler.instance.getGroupTabByID(tabId);

      // Removes the group tab completely from history
      if (groupTab) {
        browser.history.deleteUrl({ url: GROUP_TAB_URL });

        this.removeLatestGroupTabFromSessionHistory().catch((error) => {
          console.log(error);
        });
      }
    }

    await StorageHandler.instance.removeTabFromStorage(tabId);
  }

  /**
   * Handles the inner tab being removed
   *
   * @param groupTab The group tab that had an inner tab removed
   * @param innerTabID The id of the inner tab that was removed
   */
  private async onRemoveInnerTab(groupTab: GroupTab, innerTabID: number) {
    // Checks if the group tab is empty and has no inner tabs and makes sure it's visible
    if (!groupTab.innerTabs.length && !groupTab.isOpen) {
      StorageHandler.instance.toggleGroupTabVisibility(groupTab);
    }
    // Makes sure to show the inner tab if needed
    tabs.show(innerTabID);
  }

  /**
   * Handles the group tab being removed
   *
   * TODO: in future have in setting page setting for doing this or deleting tabs
   *
   * @param groupTab The group tab that was removed
   */
  private async onRemoveGroupTab(groupTab: GroupTab) {
    const settings = StorageHandler.instance.settings;

    // Checks for empty group tab
    if (!groupTab.innerTabs.length) {
      createNotification(`Removed ${groupTab.name}`, "Group tab was removed");
    } else {
      let deleteInnerTabs = false;

      // Based on settings decides what to do with the tab
      switch (settings.removeInnerTabOfDeletedGroupTab) {
        case "always":
          deleteInnerTabs = true;
          break;
        case "dialog":
          const confirmText = `Do you also want to remove the inner tabs of ${groupTab.name.replaceAll(
            '"',
            '\\"'
          )}?`;

          const results = await tabs.executeScript({
            code: `confirm("${confirmText}");`,
          });

          deleteInnerTabs = results[0] === true;
          break;

        case "never":
          deleteInnerTabs = false;
          break;

        default:
          break;
      }

      if (deleteInnerTabs) {
        tabs.remove(groupTab.innerTabs);
        createNotification(
          `Removed ${groupTab.name}`,
          "All of it's inner tabs were removed as well"
        );
      } else {
        if (groupTab.isOpen) {
          createNotification(
            `Removed ${groupTab.name}`,
            "All inner tabs are currently available"
          );
        } else {
          tabs.show(groupTab.innerTabs);

          createNotification(
            `Removed ${groupTab.name}`,
            "Displaying all of its hidden tabs"
          );
        }
      }
    }
  }

  /**
   * Removes the group tab's actual tab from the session history
   * so it won't be restored something like ctrl+shift+t
   */
  private async removeLatestGroupTabFromSessionHistory() {
    // Uses delay as the tab doesn't immediately show in session list
    await delay(500);

    const deletedSessions = await sessions.getRecentlyClosed();

    // Finds the session the group tab was deleted in
    const deletedGroupTabSession = deletedSessions.find((session) => {
      const tab = session.tab;

      // Checks if the sessions tab has the group tab url as sadly
      return tab && tab.url?.includes(GROUP_TAB_URL);
    });

    let sessionTab = deletedGroupTabSession?.tab;

    // Just to make sure and remove warning
    if (sessionTab) {
      sessions.forgetClosedTab(sessionTab.windowId!, sessionTab.sessionId!);
    }
  }

  /**
   * Handles showing inner tabs once group tab is removed
   *
   * TODO: in future have in setting page setting for doing this or deleting tabs
   *
   * @param groupTab The group tab that was removed (or had an inner tab removed)
   * @param innerTabID The id of the inner tab if this was the value that was removed
   */
  private async onRemoveTabFromStorage(
    groupTab: GroupTab,
    innerTabID?: number
  ) {
    if (innerTabID !== undefined) {
      this.onRemoveInnerTab(groupTab, innerTabID);
    } else {
      this.onRemoveGroupTab(groupTab);
    }
  }
}
