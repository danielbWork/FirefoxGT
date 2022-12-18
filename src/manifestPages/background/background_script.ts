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
import { delay } from "../../utils/Utils";

let isLoaded = false;
let isStartup = false;
let isInstall = false;

const loadHandlers = () => {
  console.log("Load");

  if (!isLoaded) {
    ContextMenuHandler.instance.setupContextMenuItems();
    SessionsHandler.instance.setupSessionsHandler();

    CreateTabHandler.instance.setupCreateHandler();
    OnTabClickHandler.instance.setupOnClickHandler();
    RemoveTabHandler.instance.setupRemoveHandler();
    MoveTabHandler.instance.setupMoveHandler();
    EditTabHandler.instance.setupEditHandler();
    BackgroundMessageHandler.instance.setupMessageHandler();
    BackgroundDialogHandler.instance.setupDialogHandler();
  }

  isLoaded = true;
};

browser.runtime.onInstalled.addListener(async () => {
  console.log("Install");
  isInstall = true;
  await StorageHandler.instance.setupDefaultStorage();
  await StorageHandler.instance.loadStorage();

  loadHandlers();

  // Called to make sure user can see dialogs from the start
  browser.runtime.openOptionsPage();
  StorageHandler.instance.isStartup = false;
});

browser.runtime.onStartup.addListener(async () => {
  console.log("startup");
  isStartup = true;
  await StorageHandler.instance.loadStorage();
  await SessionsHandler.instance.loadStartupData();
  loadHandlers();
  StorageHandler.instance.isStartup = false;
});

loadHandlers();

setTimeout(async () => {
  // Checks to see if the extension was updated
  if (!isStartup && !isInstall) {
    console.log("Update");

    await StorageHandler.instance.loadStorage();
    SessionsHandler.instance.handleUpdate();

    // Delay so startup flag won't be removed immediately
    await delay(500);
  }

  StorageHandler.instance.isStartup = false;
}, 500);
