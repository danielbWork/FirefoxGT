import {
  EDIT_GROUP_TAB_NAME_ID,
  RESTORE_DEFAULT_ICON_ID,
  SELECT_INNER_TAB_ICON_ID,
  TOGGLE_GROUP_TAB_CLOSED_GROUP_MODE_ID,
} from "../../utils/Consts";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { GroupTab } from "../../utils/GroupTab.js";
import browser, { Tabs, Menus, tabs } from "webextension-polyfill";
import {
  createNotification,
  getActiveTab,
  moveGroupTab,
} from "../../utils/Utils";
import { BackgroundDialogHandler } from "../BackgroundDialogHandler";

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

    tabs.onUpdated.addListener(this.onPinTab.bind(this), {
      properties: ["pinned"],
    });
  }

  /**
   * Reacts to tab being pinned or not
   * @param tabId The id of the tab that was pinned
   * @param changeInfo Whether or not the tab was pinned
   * @param tabInfo The tab info
   */
  private async onPinTab(
    tabId: number,
    changeInfo: Tabs.OnUpdatedChangeInfoType,
    tabInfo: Tabs.Tab
  ) {
    const { groupTab, index } =
      StorageHandler.instance.getGroupTabOrInnerTabByID(tabId);

    // Don't care about other tabs
    if (!groupTab) return;

    // Removes inner tabs that were pinned
    if (index !== undefined) {
      await StorageHandler.instance.removeInnerTab(
        groupTab,
        groupTab.innerTabs[index]
      );

      createNotification(
        "Pinned Tab Removed",
        `Tab ${tabInfo.title} was removed from group ${groupTab.name} because it was pinned`
      );

      return;
    }

    // Moves all inner tabs to be next to group tab again accordingly
    if (!tabInfo.pinned) {
      // promises as async is sadly required here
      const promises = groupTab.innerTabs.map(async (id) => {
        const info = await tabs.get(id);

        return { id, index: info.index };
      });

      const tabsToOrder = await Promise.all(promises);

      // Sort to reorder in groupTab
      tabsToOrder.sort((tab1, tab2) => {
        return tab1.index - tab2.index;
      });

      // reset tabs to match there new order
      groupTab.innerTabs = tabsToOrder.map((value) => {
        return value.id;
      });

      await StorageHandler.instance.updateGroupTab(groupTab);

      moveGroupTab(groupTab);
    }
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
    const groupTab = StorageHandler.instance.getGroupTabByID(tab.id!)!;

    const results =
      await BackgroundDialogHandler.instance.displayTextInputDialog(
        "Edit Group Tab",
        "Please enter the Group tab's new name",
        groupTab.name
      );

    // Checks if user entered a value
    if (results) {
      await StorageHandler.instance.updateGroupTabName(groupTab!, results);
    }
  }

  /**
   * Updates the group tab icon
   * @param groupTabID The id of the group tab that we want to update
   * @param itemID The id of the item wth the icon we want to update to
   */
  private async updateGroupTabIcon(groupTabID: number, itemID: string) {
    let icon;

    const groupTab = StorageHandler.instance.getGroupTabByID(groupTabID);

    // Makes sure not resting
    if (itemID !== RESTORE_DEFAULT_ICON_ID) {
      const innerTabID = itemID.substring(SELECT_INNER_TAB_ICON_ID.length);

      const tab = await tabs.get(parseInt(innerTabID));

      icon = tab.favIconUrl;
    }

    await StorageHandler.instance.updateGroupTabIcon(groupTab!, icon);
  }

  /**
   * Updates the group tab's "mode"
   * @param tab The tab we toggle the state of
   */
  private async toggleClosedGroupMode(tab: Tabs.Tab) {
    const groupTab = StorageHandler.instance.getGroupTabByID(tab.id!)!;

    if (StorageHandler.instance.settings.showToggleClosedGroupModeDialog) {
      const results =
        await BackgroundDialogHandler.instance.displayChoiceDialog(
          "Closed Group Mode",
          groupTab.isClosedGroupMode
            ? "Are you sure you want to restore this to a normal group?"
            : "Are you sure you want to change this to a closed group?"
        );

      if (!results) return;
    }

    const activeTab = await getActiveTab();
    const { groupTab: activeGroup, index } =
      StorageHandler.instance.getGroupTabOrInnerTabByID(activeTab.id!);

    // Handles toggle changes
    if (groupTab.isClosedGroupMode) {
      groupTab.isOpen = activeGroup?.id === groupTab.id;
    }
    // Only need to update the group if it's also not active
    else if (activeGroup?.id !== groupTab.id) {
      await tabs.hide(groupTab.innerTabs);

      groupTab.isOpen = false;
    }

    StorageHandler.instance.toggleGroupTabClosedMode(groupTab);
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
    if (info.menuItemId === TOGGLE_GROUP_TAB_CLOSED_GROUP_MODE_ID) {
      this.toggleClosedGroupMode(tab);
    }

    if (info.menuItemId.startsWith(SELECT_INNER_TAB_ICON_ID)) {
      this.updateGroupTabIcon(tab.id!, info.menuItemId);
    }
  }
}
