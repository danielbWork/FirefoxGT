import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { ContextMenuHandler } from "../../backgroundScripts/ContextMenuHandler";
import { CreateTabHandler } from "../../backgroundScripts/TabHandlers/CreateTabHandler";
import { EditTabHandler } from "../../backgroundScripts/TabHandlers/EditTabHandler";
import { MoveTabHandler } from "../../backgroundScripts/TabHandlers/MoveTabHandler";
import { RemoveTabHandler } from "../../backgroundScripts/TabHandlers/RemoveTabHandler";
import browser from "webextension-polyfill";
import { OnTabClickHandler } from "../../backgroundScripts/TabHandlers/OnTabClickHandler";
import { BackgroundMessageHandler } from "../../backgroundScripts/BackgroundMessageHandler";
import { SessionsHandler } from "../../backgroundScripts/SessionsHandler";
import { BackgroundDialogHandler } from "../../backgroundScripts/BackgroundDialogHandler";

const loadHandlers = () => {
  console.log("Load");

  ContextMenuHandler.instance.setupContextMenuItems();
  SessionsHandler.instance.setupSessionsHandler();

  CreateTabHandler.instance.setupCreateHandler();
  OnTabClickHandler.instance.setupOnClickHandler();
  RemoveTabHandler.instance.setupRemoveHandler();
  MoveTabHandler.instance.setupMoveHandler();
  EditTabHandler.instance.setupEditHandler();
  BackgroundMessageHandler.instance.setupMessageHandler();
  BackgroundDialogHandler.instance.setupDialogHandler();
};

browser.runtime.onInstalled.addListener(async () => {
  await StorageHandler.instance.setupDefaultStorage();
  await StorageHandler.instance.loadStorage();

  loadHandlers();

  // TODO uncomment once not in dev
  // Called to make sure user can see dialogs from the start
  // browser.runtime.openOptionsPage();
});

browser.runtime.onStartup.addListener(async () => {
  await StorageHandler.instance.loadStorage();
  await SessionsHandler.instance.loadUpStartupData();
  loadHandlers();
});
