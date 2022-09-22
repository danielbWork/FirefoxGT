import { setUpContextMenuItems } from "./backgroundScripts/ContextMenuHandler.js";
import { setUpStorage } from "./backgroundScripts/StorageHandler.js";
import { setupCreateHandler } from "./backgroundScripts/TabHandlers/CreateTabHandler.js";
import { setupMoveHandler } from "./backgroundScripts/TabHandlers/MoveTabHandler.js";
import { setupOnClickHandler } from "./backgroundScripts/TabHandlers/OnTabClickHandler.js";
import { setupRemoveHandler } from "./backgroundScripts/TabHandlers/RemoveTabHandler.js";

browser.runtime.onInstalled.addListener(() => {
  setUpContextMenuItems();
  setUpStorage();
});

// FOR TESTING/DEVELOPMENT ONLY NOT PRODUCTION AT ALL!!!!!!!!!!!!!!!!!!!!!!!!!
setUpStorage();

setupCreateHandler();
setupOnClickHandler();
setupRemoveHandler();
setupMoveHandler();
