import * as Consts from "../utils/Consts";
import { StorageHandler } from "../utils/Storage/StorageHandler";
import { GroupTab } from "../utils/GroupTab.js";
import { contextMenus, Menus, tabs, Tabs } from "webextension-polyfill";

const OPEN_LINK_IN_TEXT = "Open link tab in group tab";
const OPEN_BOOKMARK_IN_TEXT = "Open bookmark tab in group tab";

/**
 * Handles Creating and managing the context menu items
 */
export class ContextMenuHandler {
  /**
   * The id of the move menu item that was hidden when menu was opened
   * because you can't move item to same group
   */
  private hiddenMoveToItemID?: string = undefined;

  /**
   * The icon item ids that were displayed for a group tab to select a custom icon
   */
  private iconItemIDs: string[] = [];

  //#region Singleton

  private static _instance: ContextMenuHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): ContextMenuHandler {
    if (!ContextMenuHandler._instance) {
      ContextMenuHandler._instance = new ContextMenuHandler();
    }

    return ContextMenuHandler._instance;
  }

  //#endregion

  //#region Setup

  /**
   * Handles setting up everything relating to context menus
   */
  setupContextMenuItems() {
    this.createContextMenuItems();
    this.resetGroupTabMenuItemsVisibility();

    contextMenus.onShown.addListener(
      this.handleShowGroupTabMenuItems.bind(this)
    );
    contextMenus.onHidden.addListener(
      this.resetGroupTabMenuItemsVisibility.bind(this)
    );

    // Notifier callbacks
    StorageHandler.instance.onAddTab.addListener(
      this.addGroupTabToContextMenu.bind(this)
    );

    StorageHandler.instance.onEditTab.addListener(
      this.onGroupTabEdit.bind(this)
    );

    StorageHandler.instance.onRemoveTab.addListener(
      this.removeGroupTabFromContextMenu.bind(this)
    );
  }

  /**
   * Creates all the context menu items need for the app
   */
  private createContextMenuItems() {
    this.createMenuItem(
      Consts.ADD_TAB_TO_GROUP_TAB_PARENT_ID,
      "Add to group tab"
    );

    this.createMenuItem(
      Consts.CREATE_NEW_GROUP_TAB_ID,
      "Create New",
      Consts.ADD_TAB_TO_GROUP_TAB_PARENT_ID
    );

    this.createMenuItem(
      Consts.CREATE_NEW_GROUP_TAB_SEPARATOR_ID,
      undefined,
      Consts.ADD_TAB_TO_GROUP_TAB_PARENT_ID
    );

    this.createMenuItem(
      Consts.MOVE_TAB_FROM_GROUP_PARENT_ID,
      "Move tab from group"
    );

    this.createMenuItem(
      Consts.REMOVE_FROM_GROUP_TAB_ID,
      "Remove from group",
      Consts.MOVE_TAB_FROM_GROUP_PARENT_ID
    );

    this.createMenuItem(
      Consts.REMOVE_FROM_GROUP_TAB_SEPARATOR_ID,
      undefined,
      Consts.MOVE_TAB_FROM_GROUP_PARENT_ID
    );

    this.createMenuItem(
      Consts.OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
      OPEN_LINK_IN_TEXT,
      undefined,
      undefined,
      ["link", "bookmark"]
    );

    this.createMenuItem(
      Consts.OPEN_LINK_IN_NEW_GROUP_TAB_ID,
      "Create New",
      Consts.OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
      undefined,
      ["link", "bookmark"]
    );

    this.createMenuItem(
      Consts.OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID,
      undefined,
      Consts.OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
      undefined,
      ["link", "bookmark"]
    );

    this.createMenuItem(
      Consts.GROUP_TAB_ACTIONS_PARENT_ID,
      "Group Tab Actions"
    );

    this.createMenuItem(
      Consts.TOGGLE_GROUP_TAB_ID,
      "Toggle Group tab",
      Consts.GROUP_TAB_ACTIONS_PARENT_ID
    );

    this.createMenuItem(
      Consts.EDIT_GROUP_TAB_NAME_ID,
      "Edit Group Tab Name",
      Consts.GROUP_TAB_ACTIONS_PARENT_ID
    );

    this.createMenuItem(
      Consts.EDIT_GROUP_TAB_ICON_PARENT_ID,
      "Edit Group Tab Icon",
      Consts.GROUP_TAB_ACTIONS_PARENT_ID
    );

    this.createMenuItem(
      Consts.RESTORE_DEFAULT_ICON_ID,
      "Restore to default icon",
      Consts.EDIT_GROUP_TAB_ICON_PARENT_ID
    );

    this.createMenuItem(
      Consts.RESTORE_DEFAULT_ICON_SEPARATOR_ID,
      undefined,
      Consts.EDIT_GROUP_TAB_ICON_PARENT_ID
    );

    this.createMenuItem(
      Consts.TOGGLE_GROUP_TAB_CLOSED_GROUP_MODE_ID,
      "Toggle Group tab mode",
      Consts.GROUP_TAB_ACTIONS_PARENT_ID
    );

    this.createMenuItem(
      Consts.ENTER_GROUP_TAB_ID,
      "Enter group tab",
      Consts.GROUP_TAB_ACTIONS_PARENT_ID
    );

    this.loadAllGroupTabsItems();
  }

  /**
   * Loads all group tab based items and adds them to list
   */
  private loadAllGroupTabsItems() {
    const groupTabIDs = StorageHandler.instance.getAllGroupTabIDs();

    groupTabIDs.forEach((value) => {
      const groupTab = StorageHandler.instance.getGroupTabByID(parseInt(value));

      this.addGroupTabToContextMenu(groupTab!);
    });
  }

  //#endregion

  //#region Util

  /**
   * Utility for creating menu items
   * @param id The id of the menu item
   * @param title The text to be displayed in the item
   * @param parentId Id of the parent item
   * @param icon Icon for the context menu item
   * @param contexts List of contexts this menu item will appear in default to ["tab"]
   */
  private createMenuItem(
    id: string,
    title?: string,
    parentId?: string,
    icon?: string,
    contexts: Menus.ContextType[] = ["tab"]
  ) {
    let icons;

    if (icon) {
      icons = { "16": icon };
    }

    contextMenus.create({
      id,
      contexts,
      type: !title ? "separator" : undefined,
      parentId,
      title,
      icons,
    });
  }

  /**
   * Updates the context menu item's visibility
   * @param itemID The id of the contextMenu Item
   * @param isVisible Wether or not the contextMenu item should be visible
   */
  private async updateContextMenuItemVisibility(
    itemID: string | number,
    isVisible: boolean
  ) {
    await this.updateContextMenuItem(itemID, { visible: isVisible });
  }

  /**
   * Updates the context menu item
   * @param itemID The id of the contextMenu Item
   * @param updateInfo The info to update
   */
  private async updateContextMenuItem(
    itemID: string | number,
    updateInfo: Menus.UpdateUpdatePropertiesType
  ) {
    await contextMenus.update(itemID, updateInfo);
  }

  //#endregion

  //#region GroupTab Items

  /**
   * Updates context menu and adds the appropriate items based on group tabs
   * @param groupTab The group tab that was added
   * @param index The number marking if the update was for an inner tab (if so exists)
   */
  private async addGroupTabToContextMenu(groupTab: GroupTab, index?: number) {
    if (index) return;

    this.createMenuItem(
      Consts.ADD_TO_GROUP_TAB_ID + groupTab.id,
      groupTab.name,
      Consts.ADD_TAB_TO_GROUP_TAB_PARENT_ID,
      groupTab.icon || Consts.ICON_URL
    );

    this.createMenuItem(
      Consts.MOVE_TO_GROUP_TAB_ID + groupTab.id,
      groupTab.name,
      Consts.MOVE_TAB_FROM_GROUP_PARENT_ID,
      groupTab.icon || Consts.ICON_URL
    );

    this.createMenuItem(
      Consts.OPEN_LINK_IN_GROUP_TAB_ID + groupTab.id,
      groupTab.name,
      Consts.OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
      groupTab.icon || Consts.ICON_URL,
      ["link", "bookmark"]
    );
  }

  /**
   * Updates context menu and edit all menu items relating to group tab
   * @param groupTab The group tab that was edited
   */
  private async onGroupTabEdit(groupTab: GroupTab) {
    this.updateContextMenuItem(Consts.ADD_TO_GROUP_TAB_ID + groupTab.id, {
      title: groupTab.name,
      icons: { "16": groupTab.icon || Consts.ICON_URL },
    });

    this.updateContextMenuItem(Consts.MOVE_TO_GROUP_TAB_ID + groupTab.id, {
      title: groupTab.name,
      icons: { "16": groupTab.icon || Consts.ICON_URL },
    });

    this.updateContextMenuItem(Consts.OPEN_LINK_IN_GROUP_TAB_ID + groupTab.id, {
      title: groupTab.name,
      icons: { "16": groupTab.icon || Consts.ICON_URL },
    });
  }

  /**
   * Updates context menu and removes the appropriate items based on group tabs
   * @param groupTab The group tab that was remove
   * @param innerTabID The id marking if the update was for an inner tab (if so exists private)
   */
  private async removeGroupTabFromContextMenu(
    groupTab: GroupTab,
    innerTabID?: number
  ) {
    if (innerTabID) return;

    contextMenus.remove(Consts.ADD_TO_GROUP_TAB_ID + groupTab.id);
    contextMenus.remove(Consts.MOVE_TO_GROUP_TAB_ID + groupTab.id);
    contextMenus.remove(Consts.OPEN_LINK_IN_GROUP_TAB_ID + groupTab.id);
  }

  //#endregion

  //#region Open ContextMenu

  /**
   * Makes all menu items visible so we won't have to load all of them on show every time
   */
  private async resetGroupTabMenuItemsVisibility() {
    this.updateContextMenuItemVisibility(
      Consts.ADD_TAB_TO_GROUP_TAB_PARENT_ID,
      true
    );
    this.updateContextMenuItemVisibility(
      Consts.CREATE_NEW_GROUP_TAB_SEPARATOR_ID,
      true
    );

    this.updateContextMenuItemVisibility(
      Consts.MOVE_TAB_FROM_GROUP_PARENT_ID,
      true
    );
    this.updateContextMenuItemVisibility(
      Consts.REMOVE_FROM_GROUP_TAB_SEPARATOR_ID,
      true
    );

    // Reshow the hidden group item if needed
    if (this.hiddenMoveToItemID) {
      this.updateContextMenuItemVisibility(this.hiddenMoveToItemID, true);
      this.hiddenMoveToItemID = undefined;
    }

    // Link only needs to hide separator
    this.updateContextMenuItemVisibility(
      Consts.OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID,
      true
    );

    this.updateContextMenuItemVisibility(
      Consts.GROUP_TAB_ACTIONS_PARENT_ID,
      true
    );

    // Handle icon items to be removed when needed
    this.updateContextMenuItemVisibility(Consts.RESTORE_DEFAULT_ICON_ID, false);
    this.updateContextMenuItemVisibility(
      Consts.RESTORE_DEFAULT_ICON_SEPARATOR_ID,
      false
    );

    // Resets the items since they only belong to one group tab
    this.iconItemIDs.forEach((id) => {
      contextMenus.remove(id);
    });
    this.iconItemIDs = [];
  }

  /**
   * Updates the visibility of the appropriate context menus
   *
   * @param info The info about the the context menu click
   * @param tab The tab the user pressed
   */
  private async handleShowGroupTabMenuItems(
    info: Menus.OnShownInfoType,
    tab: Tabs.Tab
  ) {
    if (info.contexts.includes("tab")) {
      await this.handleTabClick(info, tab);
    }

    if (info.contexts.includes("link") || info.contexts.includes("bookmark")) {
      await this.handleLinkClick(info, tab);
    }

    contextMenus.refresh();
  }

  /**
   * Handles showing right items for tab's context menu
   * @param info The info about the the context menu click
   * @param tab The tab the user pressed
   */
  private async handleTabClick(info: Menus.OnShownInfoType, tab: Tabs.Tab) {
    // Gets info on the pressed tab
    const { groupTab, index } =
      StorageHandler.instance.getGroupTabOrInnerTabByID(tab.id);

    const allGroupIDs = StorageHandler.instance.getAllGroupTabIDs();

    // Boolean for convenience
    const isFromGroup = groupTab !== undefined;
    const isInnerTab = index !== undefined;

    const updateEvents = [];

    updateEvents.push(
      this.updateContextMenuItemVisibility(
        Consts.ADD_TAB_TO_GROUP_TAB_PARENT_ID,
        !isFromGroup && !tab.pinned
      )
    );

    // Only cares when add tab should be displayed
    if (!isFromGroup) {
      updateEvents.push(
        this.updateContextMenuItemVisibility(
          Consts.CREATE_NEW_GROUP_TAB_SEPARATOR_ID,
          allGroupIDs.length > 0
        )
      );
    }

    updateEvents.push(
      this.updateContextMenuItemVisibility(
        Consts.MOVE_TAB_FROM_GROUP_PARENT_ID,
        isFromGroup && isInnerTab
      )
    );

    // Only cares when move tab should be displayed
    if (isFromGroup && isInnerTab) {
      // Makes sure to display separator only when we have other group tabs to show
      updateEvents.push(
        this.updateContextMenuItemVisibility(
          Consts.REMOVE_FROM_GROUP_TAB_SEPARATOR_ID,
          allGroupIDs.length > 1
        )
      );

      this.hiddenMoveToItemID = Consts.MOVE_TO_GROUP_TAB_ID + groupTab.id;

      // Hide current tab from move
      updateEvents.push(
        this.updateContextMenuItemVisibility(this.hiddenMoveToItemID, false)
      );
    }

    // Only shows if group tab
    updateEvents.push(
      this.updateContextMenuItemVisibility(
        Consts.GROUP_TAB_ACTIONS_PARENT_ID,
        isFromGroup && !isInnerTab
      )
    );

    // Only cares when group tab actions should be displayed
    if (isFromGroup && !isInnerTab) {
      // Makes sure the toggle option only shows if the group tab has inner tabs
      updateEvents.push(
        this.updateContextMenuItem(Consts.TOGGLE_GROUP_TAB_ID, {
          title: groupTab.isOpen ? "Close Group Tab" : "Open Group Tab",
          visible: !groupTab.isClosedGroupMode && groupTab.innerTabs.length > 0,
        })
      );

      updateEvents.push(
        this.updateContextMenuItem(
          Consts.TOGGLE_GROUP_TAB_CLOSED_GROUP_MODE_ID,
          {
            title: groupTab.isClosedGroupMode
              ? "Return to normal group"
              : "Change to closed group",
          }
        )
      );

      updateEvents.push(
        this.updateContextMenuItemVisibility(
          Consts.ENTER_GROUP_TAB_ID,
          !groupTab.isClosedGroupMode && !tab.active
        )
      );

      updateEvents.push(this.handleAddGroupIconItems(groupTab));
    }

    // Waits for all updates to finish
    await Promise.all(updateEvents);
  }

  /**
   * Updates the context menu to include the icon from the inner tabs
   * @param groupTab The group tab which icons choice needs to be showed
   */
  private async handleAddGroupIconItems(groupTab: GroupTab) {
    const updateEvents = [];

    for (const innerID of groupTab.innerTabs) {
      const info = await tabs.get(innerID);

      // Must have icon otherwise pointless
      if (info.favIconUrl) {
        updateEvents.push(
          this.createMenuItem(
            Consts.SELECT_INNER_TAB_ICON_ID + innerID,
            info.title,
            Consts.EDIT_GROUP_TAB_ICON_PARENT_ID,
            info.favIconUrl
          )
        );
        this.iconItemIDs.push(Consts.SELECT_INNER_TAB_ICON_ID + innerID);
      }
    }

    // Displays rest if needed
    if (groupTab.icon) {
      updateEvents.push(
        this.updateContextMenuItemVisibility(
          Consts.RESTORE_DEFAULT_ICON_ID,
          true
        )
      );

      // Separator only if inner tab is included
      if (this.iconItemIDs.length > 0) {
        updateEvents.push(
          this.updateContextMenuItemVisibility(
            Consts.RESTORE_DEFAULT_ICON_SEPARATOR_ID,
            true
          )
        );
      }
    }

    // Only shows the edit parent if can change the icon in some way
    updateEvents.push(
      this.updateContextMenuItemVisibility(
        Consts.EDIT_GROUP_TAB_ICON_PARENT_ID,
        groupTab.icon !== undefined || this.iconItemIDs.length > 0
      )
    );

    // Waits for all updates to finish
    await Promise.all(updateEvents);
  }

  /**
   * Handles showing right items for link's context menu
   * @param info The info about the the context menu click
   * @param tab The tab the user is in
   */
  private async handleLinkClick(info: Menus.OnShownInfoType, tab: Tabs.Tab) {
    const allGroupIDs = StorageHandler.instance.getAllGroupTabIDs();

    // Hides separator when needed
    await this.updateContextMenuItemVisibility(
      Consts.OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID,
      allGroupIDs.length > 0
    );

    // Updates the title if using link or bookmark
    await this.updateContextMenuItem(Consts.OPEN_LINK_IN_GROUP_TAB_PARENT_ID, {
      title: info.contexts.includes("link")
        ? OPEN_LINK_IN_TEXT
        : OPEN_BOOKMARK_IN_TEXT,
    });
  }

  //#endregion
}
