import {
  ADD_GROUP_TAB_ID,
  PARENT_CONTEXT_MENU,
  REMOVE_GROUP_TAB_ID,
} from "../Consts.js";
import { getGroupTabByID } from "./StorageHandler.js";

/**
 * Handles setting up everything relating to context menus
 */
export function setUpContextMenuItems() {
  createContextMenuItems();
  browser.contextMenus.onShown.addListener(handleGroupTabMenuItem);
}

/**
 * Creates all the context menu items need for the app
 */
function createContextMenuItems() {
  browser.contextMenus.create({
    id: PARENT_CONTEXT_MENU,
    title: "Firefox group tab",
    contexts: ["tab"],
  });

  browser.contextMenus.create({
    id: ADD_GROUP_TAB_ID,
    title: "Put this tab in new group tab",
    contexts: ["tab"],
    parentId: PARENT_CONTEXT_MENU,
  });

  browser.contextMenus.create({
    id: REMOVE_GROUP_TAB_ID,
    title: "Removes this group tab",
    contexts: ["tab"],
    visible: false,
    parentId: PARENT_CONTEXT_MENU,
  });
}

/**
 * Checks to see if tab is group tab and updates the visibility of the appropriate context menus
 *
 * @param {*} info The info about the the context menu click
 * @param {Tab} tab The tab the user pressed, important if group tab
 */
async function handleGroupTabMenuItem(info, tab) {
  const groupTab = await getGroupTabByID(tab.id);

  // Updates based on if group tab or not
  browser.contextMenus.update(REMOVE_GROUP_TAB_ID, {
    visible: groupTab !== undefined,
  });

  browser.contextMenus.refresh();
}
