import { setUpContextMenuItems } from "./backgroundScripts/ContextMenuHandler.js";
import { setupCreate } from "./backgroundScripts/GroupTabActions/CreateGroupTab.js";
import { setupGroupTabOnClick } from "./backgroundScripts/GroupTabActions/GroupTabOnClick.js";
import { setupMoveGroupTab } from "./backgroundScripts/GroupTabActions/MoveGroupTab.js";
import { setupRemove } from "./backgroundScripts/GroupTabActions/RemoveGroupTab.js";
import { setUpStorage } from "./backgroundScripts/StorageHandler.js";

browser.runtime.onInstalled.addListener(() => {
  setUpContextMenuItems();
  setUpStorage();
});

// FOR TESTING/DEVELOPMENT ONLY NOT PRODUCTION AT ALL!!!!!!!!!!!!!!!!!!!!!!!!!
setUpStorage();

setupCreate();
setupGroupTabOnClick();
setupRemove();
setupMoveGroupTab();
