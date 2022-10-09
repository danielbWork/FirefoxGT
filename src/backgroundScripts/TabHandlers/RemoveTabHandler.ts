import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { GroupTab } from "../../utils/GroupTab.js";
import browser, {
  Tabs,
  Menus,
  tabs,
  notifications,
} from "webextension-polyfill";

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
    await StorageHandler.instance.removeTabFromStorage(tabId);
  }

  /**
   * Handles showing inner tabs once group tab is removed
   *
   * TODO: in future have in setting page setting for doing this or deleting tabs
   *
   * @param groupTab The group tab that was removed (or had an inner tab removed)
   * @param innerTabID The id of the inner tab if this has a value function does nothing
   */
  private onRemoveTabFromStorage(groupTab: GroupTab, innerTabID?: number) {
    // Only cares when it's group tab
    if (innerTabID !== undefined) return;

    if (groupTab.isOpen) {
      notifications.create({
        type: "basic",
        iconUrl: "icons/icon.png",
        title: `Removed ${groupTab.name}`,
        message: "All inner tabs are currently available",
      });
    } else {
      tabs.show(groupTab.innerTabs);

      notifications.create({
        type: "basic",
        iconUrl: "icons/icon.png",
        title: `Removed ${groupTab.name}`,
        message: "Displaying all of its hidden tabs",
      });
    }
  }
}
