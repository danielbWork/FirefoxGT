import { REMOVE_GROUP_TAB_ID } from "../Consts.js";
import { deleteGroupTab } from "../StorageHandler.js";

/**
 * Handles setup for group tab removing
 */
export function setupRemove() {
  browser.contextMenus.onClicked.addListener((info, tab) => {
    // Makes sure we only remove group tab when needed
    if (info.menuItemId !== REMOVE_GROUP_TAB_ID) {
      return;
    }

    //Assumes the tab given is a group tab since was called with context menu
    browser.tabs.remove(tab.id);
  });

  browser.tabs.onRemoved.addListener(removeGroupTab);
}

/**
 * Removes the group tab from the storage
 *
 * @param {number} tabId The id of the tab we want to remove
 * @param {} removeInfo Info regarding deleting the tab
 */
async function removeGroupTab(tabId, removeInfo) {
  await deleteGroupTab(tabId);
}
