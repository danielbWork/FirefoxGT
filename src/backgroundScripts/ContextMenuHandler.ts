import {
  ADD_TAB_TO_GROUP_TAB_PARENT_ID,
  ADD_TO_GROUP_TAB_ID,
  CREATE_NEW_GROUP_TAB_ID,
  MOVE_TAB_FROM_GROUP_PARENT_ID,
  MOVE_TO_GROUP_TAB_ID,
  REMOVE_FROM_GROUP_TAB_ID,
  OPEN_LINK_IN_GROUP_TAB_ID,
  OPEN_LINK_IN_NEW_GROUP_TAB_ID,
  OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
  CREATE_NEW_GROUP_TAB_SEPARATOR_ID,
  REMOVE_FROM_GROUP_TAB_SEPARATOR_ID,
  OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID,
  GROUP_TAB_ACTIONS_PARENT_ID,
  EDIT_GROUP_TAB_NAME_ID,
  TOGGLE_GROUP_TAB_ID,
  EDIT_GROUP_TAB_ICON_PARENT_ID,
  RESTORE_DEFAULT_ICON_ID,
  RESTORE_DEFAULT_ICON_SEPARATOR_ID,
  SELECT_INNER_TAB_ICON_ID,
} from "../utils/Consts";
import { StorageHandler } from "../utils/Storage/StorageHandler";
import { GroupTab } from "../utils/GroupTab.js";
import { contextMenus, Menus, tabs, Tabs } from "webextension-polyfill";

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
    StorageHandler.instance.onRemoveTab.addListener(
      this.removeGroupTabFromContextMenu.bind(this)
    );
  }

  /**
   * Creates all the context menu items need for the app
   */
  private createContextMenuItems() {
    this.createMenuItem(ADD_TAB_TO_GROUP_TAB_PARENT_ID, "Add to group tab");

    this.createMenuItem(
      CREATE_NEW_GROUP_TAB_ID,
      "Create New",
      ADD_TAB_TO_GROUP_TAB_PARENT_ID
    );

    this.createMenuItem(
      CREATE_NEW_GROUP_TAB_SEPARATOR_ID,
      undefined,
      ADD_TAB_TO_GROUP_TAB_PARENT_ID
    );

    this.createMenuItem(MOVE_TAB_FROM_GROUP_PARENT_ID, "Move tab from group");

    this.createMenuItem(
      REMOVE_FROM_GROUP_TAB_ID,
      "Remove from group",
      MOVE_TAB_FROM_GROUP_PARENT_ID
    );

    this.createMenuItem(
      REMOVE_FROM_GROUP_TAB_SEPARATOR_ID,
      undefined,
      MOVE_TAB_FROM_GROUP_PARENT_ID
    );

    this.createMenuItem(
      OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
      "Open link tab in group tab",
      undefined,
      ["link"]
    );

    this.createMenuItem(
      OPEN_LINK_IN_NEW_GROUP_TAB_ID,
      "Create New",
      OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
      ["link"]
    );

    this.createMenuItem(
      OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID,
      undefined,
      OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
      ["link"]
    );

    this.createMenuItem(GROUP_TAB_ACTIONS_PARENT_ID, "Group Tab Actions");

    this.createMenuItem(
      TOGGLE_GROUP_TAB_ID,
      "Toggle Group tab",
      GROUP_TAB_ACTIONS_PARENT_ID
    );

    this.createMenuItem(
      EDIT_GROUP_TAB_NAME_ID,
      "Edit Group Tab Name",
      GROUP_TAB_ACTIONS_PARENT_ID
    );

    this.createMenuItem(
      EDIT_GROUP_TAB_ICON_PARENT_ID,
      "Edit Group Tab Icon",
      GROUP_TAB_ACTIONS_PARENT_ID
    );

    this.createMenuItem(
      RESTORE_DEFAULT_ICON_ID,
      "Restore to default icon",
      EDIT_GROUP_TAB_ICON_PARENT_ID
    );

    this.createMenuItem(
      RESTORE_DEFAULT_ICON_SEPARATOR_ID,
      undefined,
      EDIT_GROUP_TAB_ICON_PARENT_ID
    );

    this.loadAllGroupTabsItems();
  }

  /**
   * Loads all group tab based items and adds them to list
   */
  private async loadAllGroupTabsItems() {
    const groupTabIDs = await StorageHandler.instance.getAllGroupTabIDs();

    groupTabIDs.forEach(async (value) => {
      const groupTab = await StorageHandler.instance.getGroupTabByID(
        parseInt(value)
      );

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
   * @param contexts List of contexts this menu item will appear in default to ["tab"]
   */
  private createMenuItem(
    id: string,
    title?: string,
    parentId?: string,
    contexts: Menus.ContextType[] = ["tab"]
  ) {
    contextMenus.create({
      id,
      contexts,
      type: !title ? "separator" : undefined,
      parentId,
      title,
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
      ADD_TO_GROUP_TAB_ID + groupTab.id,
      groupTab.name,
      ADD_TAB_TO_GROUP_TAB_PARENT_ID
    );

    this.createMenuItem(
      MOVE_TO_GROUP_TAB_ID + groupTab.id,
      groupTab.name,
      MOVE_TAB_FROM_GROUP_PARENT_ID
    );

    this.createMenuItem(
      OPEN_LINK_IN_GROUP_TAB_ID + groupTab.id,
      groupTab.name,
      OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
      ["link"]
    );
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

    contextMenus.remove(ADD_TO_GROUP_TAB_ID + groupTab.id);
    contextMenus.remove(MOVE_TO_GROUP_TAB_ID + groupTab.id);
    contextMenus.remove(OPEN_LINK_IN_GROUP_TAB_ID + groupTab.id);
  }

  //#endregion

  //#region Open ContextMenu

  /**
   * Makes all menu items visible so we won't have to load all of them on show every time
   */
  private async resetGroupTabMenuItemsVisibility() {
    this.updateContextMenuItemVisibility(ADD_TAB_TO_GROUP_TAB_PARENT_ID, true);
    this.updateContextMenuItemVisibility(
      CREATE_NEW_GROUP_TAB_SEPARATOR_ID,
      true
    );

    this.updateContextMenuItemVisibility(MOVE_TAB_FROM_GROUP_PARENT_ID, true);
    this.updateContextMenuItemVisibility(
      REMOVE_FROM_GROUP_TAB_SEPARATOR_ID,
      true
    );

    // Reshow the hidden group item if needed
    if (this.hiddenMoveToItemID) {
      this.updateContextMenuItemVisibility(this.hiddenMoveToItemID, true);
      this.hiddenMoveToItemID = undefined;
    }

    // Link only needs to hide separator
    this.updateContextMenuItemVisibility(
      OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID,
      true
    );

    this.updateContextMenuItemVisibility(GROUP_TAB_ACTIONS_PARENT_ID, true);

    // Handle icon items to be removed when needed
    this.updateContextMenuItemVisibility(RESTORE_DEFAULT_ICON_ID, false);
    this.updateContextMenuItemVisibility(
      RESTORE_DEFAULT_ICON_SEPARATOR_ID,
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

    if (info.contexts.includes("link")) {
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
      await StorageHandler.instance.getGroupTabOrInnerTabByID(tab.id);

    const allGroupIDs = await StorageHandler.instance.getAllGroupTabIDs();

    // Boolean for convenience
    const isFromGroup = groupTab !== undefined;
    const isInnerTab = index !== undefined;

    const updateEvents = [];

    updateEvents.push(
      this.updateContextMenuItemVisibility(
        ADD_TAB_TO_GROUP_TAB_PARENT_ID,
        !isFromGroup
      )
    );

    // Only cares when add tab should be displayed
    if (!isFromGroup) {
      updateEvents.push(
        this.updateContextMenuItemVisibility(
          CREATE_NEW_GROUP_TAB_SEPARATOR_ID,
          allGroupIDs.length > 0
        )
      );
    }

    updateEvents.push(
      this.updateContextMenuItemVisibility(
        MOVE_TAB_FROM_GROUP_PARENT_ID,
        isFromGroup && isInnerTab
      )
    );

    // Only cares when move tab should be displayed
    if (isFromGroup && isInnerTab) {
      // Makes sure to display separator only when we have other group tabs to show
      updateEvents.push(
        this.updateContextMenuItemVisibility(
          REMOVE_FROM_GROUP_TAB_SEPARATOR_ID,
          allGroupIDs.length > 1
        )
      );

      this.hiddenMoveToItemID = MOVE_TO_GROUP_TAB_ID + groupTab.id;

      // Hide current tab from move
      updateEvents.push(
        this.updateContextMenuItemVisibility(this.hiddenMoveToItemID, false)
      );
    }

    // Only shows if group tab
    updateEvents.push(
      this.updateContextMenuItemVisibility(
        GROUP_TAB_ACTIONS_PARENT_ID,
        isFromGroup && !isInnerTab
      )
    );

    // Only cares when group tab actions should be displayed
    if (isFromGroup && !isInnerTab) {
      updateEvents.push(
        this.updateContextMenuItem(TOGGLE_GROUP_TAB_ID, {
          title: groupTab.isOpen ? "Close Group Tab" : "Open Group Tab",
        })
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
          contextMenus.create({
            id: SELECT_INNER_TAB_ICON_ID + innerID,
            title: info.title,
            icons: { "16": info.favIconUrl },
            contexts: ["tab"],
            parentId: EDIT_GROUP_TAB_ICON_PARENT_ID,
          })
        );
        this.iconItemIDs.push(SELECT_INNER_TAB_ICON_ID + innerID);
      }
    }

    // Displays rest if needed
    if (groupTab.icon) {
      updateEvents.push(
        this.updateContextMenuItemVisibility(RESTORE_DEFAULT_ICON_ID, true)
      );

      // Separator only if inner tab is included
      if (this.iconItemIDs.length > 0) {
        updateEvents.push(
          this.updateContextMenuItemVisibility(
            RESTORE_DEFAULT_ICON_SEPARATOR_ID,
            true
          )
        );
      }
    }

    // Only shows the edit parent if can change the icon in some way
    updateEvents.push(
      this.updateContextMenuItemVisibility(
        EDIT_GROUP_TAB_ICON_PARENT_ID,
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
    const allGroupIDs = await StorageHandler.instance.getAllGroupTabIDs();

    // Hides separator when needed
    await this.updateContextMenuItemVisibility(
      OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID,
      allGroupIDs.length > 0
    );
  }

  //#endregion
}
