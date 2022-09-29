import {
  removeTabFromStorage,
  storageNotifier,
} from "../../Storage/StorageHandler.js";
import { GroupTab } from "../GroupTab.js";

/**
 * Handles setup for group tab removing
 */
export function setupRemoveHandler() {
  browser.tabs.onRemoved.addListener(onRemoveTabFromScreen);
  storageNotifier.onRemoveTab.addListener(onRemoveTabFromStorage);
}

/**
 * Removes the group tab or inner tab from the storage
 *
 * @param {number} tabId The id of the tab we want to remove
 * @param {} removeInfo Info regarding deleting the tab
 */
async function onRemoveTabFromScreen(tabId, removeInfo) {
  await removeTabFromStorage(tabId);
  // TODO Handle showing the inner tabs/removing after this
}

/**
 * Handles showing inner tabs once group tab is removed
 *
 * TODO: in future have in setting page setting for doing this or deleting deleting
 *
 * @param {GroupTab} groupTab The group tab that was removed (or had an inner tab removed)
 * @param {number | undefined} innerTabID The id of the inner tab if this has a value function does nothing
 */
function onRemoveTabFromStorage(groupTab, innerTabID) {
  // Only cares when it's group tab
  if (innerTabID) return;

  if (groupTab.isOpen) {
    browser.notifications.create({
      type: "basic",
      iconUrl: "icons/icon.png",
      title: `Removed ${groupTab.name}`,
      message: "All inner tabs are currently available",
    });
  } else {
    browser.tabs.show(groupTab.innerTabs);

    browser.notifications.create({
      type: "basic",
      iconUrl: "icons/icon.png",
      title: `Removed ${groupTab.name}`,
      message: "Displaying all of its hidden tabs",
    });
  }
}
