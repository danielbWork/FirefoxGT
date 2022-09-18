import { setupCreate } from "./background_scripts/CreateGroupTab.js";
import { setupGroupTabOnClick } from "./background_scripts/GroupTabOnClick.js";
import { setUpStorage } from "./background_scripts/StorageManager.js";

/**
 * Adds the context menu item for adding a group tabs
 */
function createContextMenuItems() {
  browser.contextMenus.create({
    id: "add-group-tab",
    title: "Put this tab in new group tab",
    contexts: ["tab"],
  });
}

browser.runtime.onInstalled.addListener(() => {
  createContextMenuItems();
  setUpStorage();
});

setupCreate();
setupGroupTabOnClick();