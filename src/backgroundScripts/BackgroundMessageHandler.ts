import { GroupTab } from "../utils/GroupTab";
import { BackgroundMessageType } from "../utils/messages/BackgroundMessageType";
import { StorageHandler } from "../utils/Storage/StorageHandler";
import browser, { Runtime, tabs } from "webextension-polyfill";
import { Settings } from "utils/Storage/Settings";
import { ContentMessageType } from "utils/messages/ContentMessageType";
import { getActiveTab } from "../utils/Utils";

/**
 * Handles receiving messages from popup
 */
export class BackgroundMessageHandler {
  //#region Singleton

  private static _instance: BackgroundMessageHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): BackgroundMessageHandler {
    if (!BackgroundMessageHandler._instance) {
      BackgroundMessageHandler._instance = new BackgroundMessageHandler();
    }

    return BackgroundMessageHandler._instance;
  }

  //#endregion

  setupMessageHandler() {
    browser.runtime.onMessage.addListener(this.onMessageReceive.bind(this));
  }

  //#region Receive

  /**
   * Reacts to the message sent from the pop up
   * @param message The message from the popup
   * @param sender Unused
   */
  private async onMessageReceive(message: any, sender: Runtime.MessageSender) {
    const data = message?.data;

    await StorageHandler.instance.loadGroupTabs();

    switch (message?.type) {
      case BackgroundMessageType.ADD_TAB:
        this.onAddGroupTab(data.groupTab, data.index);
        break;

      case BackgroundMessageType.REMOVE_TAB:
        this.onRemoveGroupTab(data.groupTab, data.id);
        break;

      case BackgroundMessageType.EDIT_TAB:
        this.onEditGroupTab(data.groupTab);
        break;
      case BackgroundMessageType.UPDATE_SETTINGS:
        this.onUpdateSettings(data.settings);
        break;

      default:
        break;
    }
  }

  /**
   * Handles the user removing a group tab or one of it's inner tabs
   * @param groupTab The group tab that was either added or had an inner tab added
   * @param index The index of the inner tab that was add (if it was added)
   */
  private onAddGroupTab(groupTab: GroupTab, index?: number) {
    // Notifies about tabs being removed
    if (index === undefined) {
      StorageHandler.instance.onAddTab.addedGroupTab(groupTab);
    } else {
      StorageHandler.instance.onAddTab.addedInnerTab(groupTab, index);
    }
  }

  /**
   * Handles the user removing a group tab or one of it's inner tabs
   * @param groupTab The group tab that was either removed or had inner tab removed
   * @param id The id of the inner tab that was removed (if it was removed)
   */
  private onRemoveGroupTab(groupTab: GroupTab, id?: number) {
    // Notifies about tabs being removed
    if (id === undefined) {
      StorageHandler.instance.onRemoveTab.removedGroupTab(groupTab);
    } else {
      StorageHandler.instance.onRemoveTab.removedInnerTab(groupTab, id);
    }
  }

  /**
   * Handles the user editing the group tab
   * @param groupTab The group tab that was edited
   */
  private async onEditGroupTab(groupTab: GroupTab) {
    // opening change needed here as no other listener requires this
    if (groupTab.isOpen) {
      await tabs.show(groupTab.innerTabs);
    } else {
      await tabs.hide(groupTab.innerTabs);
    }

    // Notifies about changed group tab
    StorageHandler.instance.onEditTab.editedGroupTab(groupTab);
  }

  /**
   * Handles the user updating the settings
   * @param newSettings The new settings from the user
   */
  private async onUpdateSettings(newSettings: Settings) {
    const storageHandler = StorageHandler.instance;

    // Refreshes the group tabs since there names need to be updated
    if (
      newSettings.innerTabCountInName !==
      storageHandler.settings.innerTabCountInName
    ) {
      for (const stringId of await storageHandler.getAllGroupTabIDs()) {
        tabs.reload(parseInt(stringId));
      }
    }

    // Update settings in storage
    storageHandler.applyNewSettings(newSettings);
  }
  //#endregion

  //#region Send

  /**
   * Sends the message to the active content script
   * @param type The type of message to be sent
   * @param data The data to be sent
   * @returns The send promise for the result if needed
   */
  async sendContentScriptMessage(type: ContentMessageType, data: any) {
    const activeTab = await getActiveTab();

    const result = browser.tabs.sendMessage(activeTab.id!, {
      type,
      data,
    });

    return result;
  }

  //#endregion
}
