import { setupStorage } from "./components/Storage/StorageHandler.js";
import { ContextMenuHandler } from "./backgroundScripts/ContextMenuHandler";
import { CreateTabHandler } from "./backgroundScripts/TabHandlers/CreateTabHandler";
import { setupEditHandler } from "./backgroundScripts/TabHandlers/EditTabHandler.js";
import { setupMoveHandler } from "./backgroundScripts/TabHandlers/MoveTabHandler.js";
import { setupOnClickHandler } from "./backgroundScripts/TabHandlers/OnTabClickHandler.js";
import { setupRemoveHandler } from "./backgroundScripts/TabHandlers/RemoveTabHandler.js";
import browser from "webextension-polyfill";


browser.runtime.onInstalled.addListener(() => {
  ContextMenuHandler.getInstance().setupContextMenuItems();
  setupStorage();
});

// FOR TESTING/DEVELOPMENT ONLY NOT PRODUCTION AT ALL!!!!!!!!!!!!!!!!!!!!!!!!!
setupStorage();

CreateTabHandler.getInstance().setupCreateHandler();

setupOnClickHandler();
setupRemoveHandler();
setupMoveHandler();
setupEditHandler();
