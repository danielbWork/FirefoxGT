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
} from "../Consts.js";
import {
  getAllGroupTabIDs,
  getGroupTabByID,
  getGroupTabOrInnerTabByID,
  storageNotifier,
} from "../Storage/StorageHandler.js";
import { GroupTab } from "./GroupTab.js";

/**
 * The id of the move menu item that was hidden when menu was opened
 * because you can't move item to same group
 */
let hiddenMoveToItemID = undefined;

//#region Setup

/**
 * Handles setting up everything relating to context menus
 */
export function setupContextMenuItems() {
  createContextMenuItems();
  resetGroupTabMenuItemsVisibility();
  browser.contextMenus.onShown.addListener(handleShowGroupTabMenuItems);
  browser.contextMenus.onHidden.addListener(resetGroupTabMenuItemsVisibility);

  // TODO ON REMOVE

  // Notifier callbacks
  storageNotifier.onAddTab.addListener(addGroupTabToContextMenu);
  storageNotifier.onRemoveTab.addListener(removeGroupTabFromContextMenu);
}

/**
 * Creates all the context menu items need for the app
 */
function createContextMenuItems() {
  // TODO See if commands will be better once pop up is added
  browser.contextMenus.create({
    id: ADD_TAB_TO_GROUP_TAB_PARENT_ID,
    title: "Add to group tab",
    contexts: ["tab"],
  });

  browser.contextMenus.create({
    id: CREATE_NEW_GROUP_TAB_ID,
    title: "Create New",
    contexts: ["tab"],
    parentId: ADD_TAB_TO_GROUP_TAB_PARENT_ID,
  });

  browser.contextMenus.create({
    id: CREATE_NEW_GROUP_TAB_SEPARATOR_ID,
    type: "separator",
    contexts: ["tab"],
    parentId: ADD_TAB_TO_GROUP_TAB_PARENT_ID,
  });

  browser.contextMenus.create({
    id: MOVE_TAB_FROM_GROUP_PARENT_ID,
    title: "Move tab from group",
    contexts: ["tab"],
  });

  browser.contextMenus.create({
    id: REMOVE_FROM_GROUP_TAB_ID,
    title: "Remove from group",
    contexts: ["tab"],
    parentId: MOVE_TAB_FROM_GROUP_PARENT_ID,
  });

  browser.contextMenus.create({
    id: REMOVE_FROM_GROUP_TAB_SEPARATOR_ID,
    type: "separator",
    contexts: ["tab"],
    parentId: MOVE_TAB_FROM_GROUP_PARENT_ID,
  });

  browser.contextMenus.create({
    id: OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
    title: "Open link tab in group tab",
    contexts: ["link"],
  });

  browser.contextMenus.create({
    id: OPEN_LINK_IN_NEW_GROUP_TAB_ID,
    title: "Create New",
    contexts: ["link"],
    parentId: OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
  });

  browser.contextMenus.create({
    id: OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID,
    type: "separator",
    contexts: ["tab"],
    parentId: OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
  });

  loadAllGroupTabsItems();
}

/**
 * Loads all group tab based items and adds them to list
 */
async function loadAllGroupTabsItems() {
  const groupTabIDs = await getAllGroupTabIDs();

  groupTabIDs.forEach(async (value) => {
    const groupTab = getGroupTabByID(value);

    // Shouldn't ever be true but just in case
    if (!groupTab) return;
    addGroupTabToContextMenu(groupTab);
  });
}

//#endregion

//#region Util Functions

/**
 * Updates the context menu item's visibility
 * @param {string} itemID The id of the contextMenu Item
 * @param {boolean} isVisible Wether or not the contextMenu item should be visible
 */
async function updateContextMenuItemVisibility(itemID, isVisible) {
  await updateContextMenuItem(itemID, { visible: isVisible });
}

/**
 * Updates the context menu item
 * @param {string} itemID The id of the contextMenu Item
 * @param {*} updateInfo The info to update
 */
async function updateContextMenuItem(itemID, updateInfo) {
  await browser.contextMenus.update(itemID, updateInfo);
}

//#endregion

//#region GroupTab Items

/**
 * Updates context menu and adds the appropriate items based on group tabs
 * @param {GroupTab} groupTab The group tab that was added
 * @param {number | undefined} isInnerTabIndex The number marking if the update was for an inner tab (if so exists function)
 */
async function addGroupTabToContextMenu(groupTab, isInnerTabIndex) {
  if (isInnerTabIndex) return;

  browser.contextMenus.create({
    id: ADD_TO_GROUP_TAB_ID + groupTab.id,
    title: groupTab.name,
    contexts: ["tab"],
    visible: true,
    parentId: ADD_TAB_TO_GROUP_TAB_PARENT_ID,
  });

  browser.contextMenus.create({
    id: MOVE_TO_GROUP_TAB_ID + groupTab.id,
    title: groupTab.name,
    contexts: ["tab"],
    visible: true,
    parentId: MOVE_TAB_FROM_GROUP_PARENT_ID,
  });

  browser.contextMenus.create({
    id: OPEN_LINK_IN_GROUP_TAB_ID + groupTab.id,
    title: groupTab.name,
    contexts: ["link"],
    visible: true,
    parentId: OPEN_LINK_IN_GROUP_TAB_PARENT_ID,
  });
}

/**
 * Updates context menu and removes the appropriate items based on group tabs
 * @param {GroupTab} groupTab The group tab that was remove
 * @param {number| undefined} innerTabID The id marking if the update was for an inner tab (if so exists function)
 */
async function removeGroupTabFromContextMenu(groupTab, innerTabID) {
  if (innerTabID) return;

  browser.contextMenus.remove(ADD_TO_GROUP_TAB_ID + groupTab.id);
  browser.contextMenus.remove(MOVE_TO_GROUP_TAB_ID + groupTab.id);
  browser.contextMenus.remove(OPEN_LINK_IN_GROUP_TAB_ID + groupTab.id);
}

//#endregion

//#region Open ContextMenu

/**
 * Makes all menu items visible so we won't have to load all of them on show every time
 */
async function resetGroupTabMenuItemsVisibility() {
  updateContextMenuItemVisibility(ADD_TAB_TO_GROUP_TAB_PARENT_ID, true);
  updateContextMenuItemVisibility(CREATE_NEW_GROUP_TAB_SEPARATOR_ID, true);

  updateContextMenuItemVisibility(MOVE_TAB_FROM_GROUP_PARENT_ID, true);
  updateContextMenuItemVisibility(REMOVE_FROM_GROUP_TAB_SEPARATOR_ID, true);

  // Reshow the hidden group item if needed
  if (hiddenMoveToItemID) {
    updateContextMenuItemVisibility(hiddenMoveToItemID, true);
    hiddenMoveToItemID = undefined;
  }

  // Link only needs to hide separator
  updateContextMenuItemVisibility(OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID, true);
}

/**
 * Updates the visibility of the appropriate context menus
 *
 * @param {*} info The info about the the context menu click
 * @param {Tab} tab The tab the user pressed
 */
async function handleShowGroupTabMenuItems(info, tab) {
  if (info.contexts.includes("tab")) {
    await handleTabClick(info, tab);
  }

  if (info.contexts.includes("link")) {
    await handleLinkClick(info, tab);
  }

  browser.contextMenus.refresh();
}

/**
 * Handles showing right items for tab's context menu
 * @param {*} info The info about the the context menu click
 * @param {Tab} tab The tab the user pressed
 */
async function handleTabClick(info, tab) {
  // Gets info on the pressed tab
  const { groupTab, index } = await getGroupTabOrInnerTabByID(tab.id);

  const allGroupIDs = await getAllGroupTabIDs();

  // Boolean for convenience
  const isFromGroup = groupTab !== undefined;
  const isInnerTab = index !== undefined;

  const updateEvents = [];

  updateEvents.push(
    updateContextMenuItemVisibility(
      ADD_TAB_TO_GROUP_TAB_PARENT_ID,
      !isFromGroup
    )
  );

  // Only cares when add tab should be displayed
  if (!isFromGroup) {
    updateEvents.push(
      updateContextMenuItemVisibility(
        CREATE_NEW_GROUP_TAB_SEPARATOR_ID,
        allGroupIDs.length > 0
      )
    );
  }

  updateEvents.push(
    updateContextMenuItemVisibility(
      MOVE_TAB_FROM_GROUP_PARENT_ID,
      isFromGroup && isInnerTab
    )
  );

  // Only cares when move tab should be displayed
  if (isFromGroup && isInnerTab) {
    // Makes sure to display separator only when we have other group tabs to show
    updateEvents.push(
      updateContextMenuItemVisibility(
        REMOVE_FROM_GROUP_TAB_SEPARATOR_ID,
        allGroupIDs.length > 1
      )
    );

    hiddenMoveToItemID = MOVE_TO_GROUP_TAB_ID + groupTab.id;

    // Hide current tab from move
    updateEvents.push(
      updateContextMenuItemVisibility(hiddenMoveToItemID, false)
    );
  }

  // Waits for all updates to finish
  await Promise.all(updateEvents);
}

/**
 * Handles showing right items for link's context menu
 * @param {*} info The info about the the context menu click
 * @param {Tab} tab The tab the user is in
 */
async function handleLinkClick(info, tab) {
  const allGroupIDs = await getAllGroupTabIDs();

  // Hides separator when needed
  await updateContextMenuItemVisibility(
    OPEN_LINK_IN_GROUP_TAB_SEPARATOR_ID,
    allGroupIDs.length > 0
  );
}

//#endregion
