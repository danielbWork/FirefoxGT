import { setupCreate } from "./backgroundScripts/GroupTabActions/CreateGroupTab.js";
import { setupGroupTabOnClick } from "./backgroundScripts/GroupTabActions/GroupTabOnClick.js";
import { setUpStorage } from "./backgroundScripts/StorageManager.js";

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

// FOR TESTING/DEVELOPMENT ONLY NOT PRODUCTION AT ALL!!!!!!!!!!!!!!!!!!!!!!!!!
setUpStorage();

setupCreate();
setupGroupTabOnClick();
