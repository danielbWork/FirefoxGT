import { removeTabFromStorage } from "../../Storage/StorageHandler.js";

/**
 * Handles setup for group tab removing
 */
export function setupRemoveHandler() {
  browser.tabs.onRemoved.addListener(removeGroupTab);
}

/**
 * Removes the group tab from the storage
 *
 * @param {number} tabId The id of the tab we want to remove
 * @param {} removeInfo Info regarding deleting the tab
 */
async function removeGroupTab(tabId, removeInfo) {
  await removeTabFromStorage(tabId);
  // TODO Handle showing the inner tabs/removing after this
}
