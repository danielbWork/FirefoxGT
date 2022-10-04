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
} from "../components/Consts.js";
import {
  getAllGroupTabIDs,
  getGroupTabByID,
  getGroupTabOrInnerTabByID,
  storageNotifier,
} from "../components/Storage/StorageHandler.js";
import { GroupTab } from "../components/GroupTab.js";
import {contextMenus, Menus, Tabs} from "webextension-polyfill";

/**
 * Handles Creating and managing the context menu items
 */
export class ContextMenuHandler {

  /**
 * The id of the move menu item that was hidden when menu was opened
 * because you can't move item to same group
 */
  private hiddenMoveToItemID?: string = undefined;

  //#region Singleton

  private static instance : ContextMenuHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static getInstance(): ContextMenuHandler {
    if (!ContextMenuHandler.instance) {
        ContextMenuHandler.instance = new ContextMenuHandler();
    }

    return ContextMenuHandler.instance;
}

  //#endregion

  //#region Setup

/**
 * Handles setting up everything relating to context menus
 */
setupContextMenuItems() {
  this.createContextMenuItems();
  this.resetGroupTabMenuItemsVisibility();
  
  contextMenus.onShown.addListener(this.handleShowGroupTabMenuItems.bind(this));
  contextMenus.onHidden.addListener(this.resetGroupTabMenuItemsVisibility.bind(this));

  // TODO ON REMOVE

  // Notifier callbacks
  storageNotifier.onAddTab.addListener(this.addGroupTabToContextMenu.bind(this));
  storageNotifier.onRemoveTab.addListener(this.removeGroupTabFromContextMenu.bind(this));
}

/**
 * Creates all the context menu items need for the app
 */
private createContextMenuItems() {
  // TODO See if commands will be better once pop up is added
  contextMenus.create({
    id: ADD_TAB_TO_GROUP_TAB_PARENT_ID,
    title: "Add to group tab",
    contexts: ["tab"],
  });

  contextMenus.create({
    id: CREATE_NEW_GROUP_TAB_ID,
    title: "Create New",
    contexts: ["tab"],
    parentId: ADD_TAB_TO_GROUP_TAB_PARENT_ID,
  });

  contextMenus.create({
    id: CREATE_NEW_GROUP_TAB_SEPARATOR_ID,
    type: "separator",
    contexts: ["tab"],
    parentId: ADD_TAB_TO_GROUP_TAB_PARENT_ID,
  });

  contextMenus.create({
    id: MOVE_TAB_FROM_GROUP_PARENT_ID,
    title: "Move tab from group",
    contexts: ["tab"],
  });

  contextMenus.create({
    id: REMOVE_FROM_GROUP_TAB_ID,
    title: "Remove from group",
    contexts: ["tab"],
    parentId: MOVE_TAB_FROM_GROUP_PARENT_ID,
  });

  contextMenus.create({
    id: REMOVE_FROM_GROUP_TAB_SEPARATOR_ID,
    type: "separator",
    contexts: ["tab"],
    parentId: MOVE_TAB_FROM_GROUP_PARENT_ID,
  });

  contextMenus.create({
    id: OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
    title: "Open link tab in group tab",
    contexts: ["link"],
  });

  contextMenus.create({
    id: OPEN_LINK_IN_NEW_GROUP_TAB_ID,
    title: "Create New",
    contexts: ["link"],
    parentId: OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
  });

  contextMenus.create({
    id: OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID,
    type: "separator",
    contexts: ["link"],
    parentId: OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
  });

  contextMenus.create({
    id: GROUP_TAB_ACTIONS_PARENT_ID,
    title: "Group Tab Actions",
    contexts: ["tab"],
  });

  contextMenus.create({
    id: TOGGLE_GROUP_TAB_ID,
    title: "Toggle Group tab",
    contexts: ["tab"],
    parentId: GROUP_TAB_ACTIONS_PARENT_ID,
  });

  contextMenus.create({
    id: EDIT_GROUP_TAB_NAME_ID,
    title: "Edit Group Tab Name",
    contexts: ["tab"],
    parentId: GROUP_TAB_ACTIONS_PARENT_ID,
  });

  this.loadAllGroupTabsItems();
}

/**
 * Loads all group tab based items and adds them to list
 */
private async loadAllGroupTabsItems() {
  const groupTabIDs = await getAllGroupTabIDs();

  groupTabIDs.forEach(async (value) => {
    const groupTab = getGroupTabByID(parseInt(value));

    // Shouldn't ever be true but just in case
    if (!groupTab) return;
    this.addGroupTabToContextMenu(groupTab);
  });
}

//#endregion

//#region Util privates

/**
 * Updates the context menu item's visibility
 * @param itemID The id of the contextMenu Item
 * @param isVisible Wether or not the contextMenu item should be visible
 */
private async updateContextMenuItemVisibility(itemID: string | number, isVisible: boolean) {
  await this.updateContextMenuItem(itemID, { visible: isVisible });
}

/**
 * Updates the context menu item
 * @param itemID The id of the contextMenu Item
 * @param updateInfo The info to update
 */
private async updateContextMenuItem(itemID: string | number, updateInfo: Menus.UpdateUpdatePropertiesType) {
  await contextMenus.update(itemID, updateInfo);
}

//#endregion

//#region GroupTab Items

/**
 * Updates context menu and adds the appropriate items based on group tabs
 * @param groupTab The group tab that was added
 * @param isInnerTabIndex The number marking if the update was for an inner tab (if so exists private)
 */
private async addGroupTabToContextMenu(groupTab: GroupTab, isInnerTabIndex?: number) {
  if (isInnerTabIndex) return;

  contextMenus.create({
    id: ADD_TO_GROUP_TAB_ID + groupTab.id,
    title: groupTab.name,
    contexts: ["tab"],
    visible: true,
    parentId: ADD_TAB_TO_GROUP_TAB_PARENT_ID,
  });

  contextMenus.create({
    id: MOVE_TO_GROUP_TAB_ID + groupTab.id,
    title: groupTab.name,
    contexts: ["tab"],
    visible: true,
    parentId: MOVE_TAB_FROM_GROUP_PARENT_ID,
  });

  contextMenus.create({
    id: OPEN_LINK_IN_GROUP_TAB_ID + groupTab.id,
    title: groupTab.name,
    contexts: ["link"],
    visible: true,
    parentId: OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
  });
}

/**
 * Updates context menu and removes the appropriate items based on group tabs
 * @param groupTab The group tab that was remove
 * @param innerTabID The id marking if the update was for an inner tab (if so exists private)
 */
private async removeGroupTabFromContextMenu(groupTab: GroupTab, innerTabID?: number) {
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
  this.updateContextMenuItemVisibility(CREATE_NEW_GROUP_TAB_SEPARATOR_ID, true);

  this.updateContextMenuItemVisibility(MOVE_TAB_FROM_GROUP_PARENT_ID, true);
  this.updateContextMenuItemVisibility(REMOVE_FROM_GROUP_TAB_SEPARATOR_ID, true);

  // Reshow the hidden group item if needed
  if (this.hiddenMoveToItemID) {
    this.updateContextMenuItemVisibility(this.hiddenMoveToItemID, true);
    this.hiddenMoveToItemID = undefined;
  }

  // Link only needs to hide separator
  this.updateContextMenuItemVisibility(OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID, true);

  this.updateContextMenuItemVisibility(GROUP_TAB_ACTIONS_PARENT_ID, true);
}

/**
 * Updates the visibility of the appropriate context menus
 *
 * @param info The info about the the context menu click
 * @param tab The tab the user pressed
 */
private async handleShowGroupTabMenuItems(info: Menus.OnShownInfoType, tab: Tabs.Tab) {
  
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
  const { groupTab, index } = await getGroupTabOrInnerTabByID(tab.id);


  const allGroupIDs = await getAllGroupTabIDs();

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
  }

  // Waits for all updates to finish
  await Promise.all(updateEvents);
}

/**
 * Handles showing right items for link's context menu
 * @param info The info about the the context menu click
 * @param tab The tab the user is in
 */
private async handleLinkClick(info: Menus.OnShownInfoType, tab: Tabs.Tab) {
  const allGroupIDs = await getAllGroupTabIDs();

  // Hides separator when needed
  await this.updateContextMenuItemVisibility(
    OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID,
    allGroupIDs.length > 0
  );
}

//#endregion


}


