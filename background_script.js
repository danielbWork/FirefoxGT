import { setupContextMenuItems } from "./backgroundScripts/ContextMenuHandler.js";
import { setupCreateHandler } from "./backgroundScripts/TabHandlers/CreateTabHandler.js";
import { setupEditHandler } from "./backgroundScripts/TabHandlers/EditTabHandler.js";
import { setupMoveHandler } from "./backgroundScripts/TabHandlers/MoveTabHandler.js";
import { setupOnClickHandler } from "./backgroundScripts/TabHandlers/OnTabClickHandler.js";
import { setupRemoveHandler } from "./backgroundScripts/TabHandlers/RemoveTabHandler.js";
import { setupStorage } from "./Storage/StorageHandler.js";

browser.runtime.onInstalled.addListener(() => {
  setupContextMenuItems();
  setupStorage();
});

// FOR TESTING/DEVELOPMENT ONLY NOT PRODUCTION AT ALL!!!!!!!!!!!!!!!!!!!!!!!!!
setupStorage();

setupCreateHandler();
setupOnClickHandler();
setupRemoveHandler();
setupMoveHandler();
setupEditHandler();
