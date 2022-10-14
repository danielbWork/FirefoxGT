import { StorageHandler } from "./utils/Storage/StorageHandler";
import { ContextMenuHandler } from "./backgroundScripts/ContextMenuHandler";
import { CreateTabHandler } from "./backgroundScripts/TabHandlers/CreateTabHandler";
import { EditTabHandler } from "./backgroundScripts/TabHandlers/EditTabHandler";
import { MoveTabHandler } from "./backgroundScripts/TabHandlers/MoveTabHandler";
import { RemoveTabHandler } from "./backgroundScripts/TabHandlers/RemoveTabHandler";
import browser from "webextension-polyfill";
import { OnTabClickHandler } from "./backgroundScripts/TabHandlers/OnTabClickHandler";
import { BackgroundMessageHandler } from "./backgroundScripts/BackgroundMessageHandler";

browser.runtime.onInstalled.addListener(() => {
  ContextMenuHandler.instance.setupContextMenuItems();
  StorageHandler.instance.setupDefaultStorage();
});

StorageHandler.instance.loadStorage();

CreateTabHandler.instance.setupCreateHandler();
OnTabClickHandler.instance.setupOnClickHandler();
RemoveTabHandler.instance.setupRemoveHandler();
MoveTabHandler.instance.setupMoveHandler();
EditTabHandler.instance.setupEditHandler();
BackgroundMessageHandler.instance.setupMessageHandler();
