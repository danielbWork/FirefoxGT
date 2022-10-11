import {
  EDIT_GROUP_TAB_NAME_ID,
  RESTORE_DEFAULT_ICON_ID,
  SELECT_INNER_TAB_ICON_ID,
} from "../../utils/Consts";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { GroupTab } from "../../utils/GroupTab.js";
import browser, {
  Tabs,
  Menus,
  tabs,
  notifications,
} from "webextension-polyfill";

/**
 * Handles editing group tabs, as well as editing events such as inner tab changes
 */
export class EditTabHandler {
  //#region Singleton

  private static _instance: EditTabHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): EditTabHandler {
    if (!EditTabHandler._instance) {
      EditTabHandler._instance = new EditTabHandler();
    }

    return EditTabHandler._instance;
  }

  //#endregion

  setupEditHandler() {
    StorageHandler.instance.onEditTab.addListener(
      this.onGroupTabEdit.bind(this)
    );
    StorageHandler.instance.onAddTab.addListener(
      this.onInnerTabEdit.bind(this)
    );
    StorageHandler.instance.onRemoveTab.addListener(
      this.onInnerTabEdit.bind(this)
    );

    browser.contextMenus.onClicked.addListener(
      this.handleContextMenuEdit.bind(this)
    );
  }

  /**
   * Handles updating group tab info in ui
   * @param groupTab The group tab that we want to update
   */
  private async onGroupTabEdit(groupTab: GroupTab) {
    await tabs.reload(groupTab.id);
  }

  /**
   * Checks if the inner tab was added/removed from the group tab and updates it accordingly
   * @param groupTab The group tab that was edited
   * @param indexOrInnerTabID index or id of the inner tab that was updated
   */
  private async onInnerTabEdit(groupTab: GroupTab, indexOrInnerTabID?: number) {
    // Does this check because 0 is false
    if (indexOrInnerTabID !== undefined) {
      await this.onGroupTabEdit(groupTab);
    }
  }

  /**
   * Handles renaming the group tab
   * @param info The info regarding the tab that was pressed
   * @param tab The group tab that the user wants to rename
   */
  private async onEditNameMenuClick(info: Menus.OnClickData, tab: Tabs.Tab) {
    const groupTab = await StorageHandler.instance.getGroupTabByID(tab.id!);

    const editPrompt = `prompt("Please enter the Group tab's new name", "${groupTab?.name}");`;

    const results = await tabs.executeScript({ code: editPrompt });

    // TODO Use pop up instead
    // Checks if user is in special tab
    if (!results || results[0] === undefined) {
      notifications.create({
        type: "basic",
        // TODO Add Icon
        title: "Create Failed",
        message:
          "Can't edit in this tab as it is blocked by firefox, please move to another tab and try again",
      });

      return;
    }

    // Checks if user chose to exit dialog
    if (results[0] === null) {
      return;
    }

    // Makes sure to block empty names
    if (results[0].trim() === "") {
      notifications.create({
        type: "basic",
        // TODO Add Icon
        title: "Create Failed",
        message: "Can't create group tab with empty name",
      });

      return;
    }

    await StorageHandler.instance.updateGroupTabName(groupTab!, results[0]);
  }

  /**
   * Updates the group tab icon
   * @param groupTabID The id of the group tab that we want to update
   * @param itemID The id of the item wth the icon we want to update to
   */
  private async updateGroupTabIcon(groupTabID: number, itemID: string) {
    let icon;

    const groupTab = await StorageHandler.instance.getGroupTabByID(groupTabID);

    // Makes sure not resting
    if (itemID !== RESTORE_DEFAULT_ICON_ID) {
      const innerTabID = itemID.substring(SELECT_INNER_TAB_ICON_ID.length);

      const tab = await tabs.get(parseInt(innerTabID));

      icon = tab.favIconUrl;
    }

    await StorageHandler.instance.updateGroupTabIcon(groupTab!, icon);
  }

  /**
   * Handles changes to group tab from the context menus
   * @param info The info regarding the tab that was pressed
   * @param tab The group tab that the user wants to rename
   */
  private handleContextMenuEdit(info: Menus.OnClickData, tab?: Tabs.Tab) {
    if (!tab || typeof info.menuItemId !== "string") return;

    if (info.menuItemId === EDIT_GROUP_TAB_NAME_ID) {
      this.onEditNameMenuClick(info, tab);
    }
    if (info.menuItemId === RESTORE_DEFAULT_ICON_ID) {
      this.updateGroupTabIcon(tab.id!, RESTORE_DEFAULT_ICON_ID);
    }

    if (info.menuItemId.startsWith(SELECT_INNER_TAB_ICON_ID)) {
      this.updateGroupTabIcon(tab.id!, info.menuItemId);
    }
  }
}
