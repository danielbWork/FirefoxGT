import { GroupTab } from "../utils/GroupTab";
import { MessageType } from "../utils/MessageType";
import { StorageHandler } from "../utils/Storage/StorageHandler";
import browser, { Runtime, tabs } from "webextension-polyfill";

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

  /**
   * Reacts to the message sent from the pop up
   * @param message The message from the popup
   * @param sender Unused
   */
  private onMessageReceive(message: any, sender: Runtime.MessageSender) {
    console.log(message);
    console.log(sender);

    const data = message?.data;

    switch (message.type) {
      case MessageType.ADD_TAB:
        this.onAddGroupTab(data.groupTab, data.index);
        break;

      case MessageType.REMOVE_TAB:
        this.onRemoveGroupTab(data.groupTab, data.id);
        break;

      case MessageType.EDIT_TAB:
        this.onEditGroupTab(data.groupTab);
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
      // TODO move inner tab from group tab
    }
  }

  /**
   * Handles the user editing the group tab
   * @param groupTab The group tab that was edited
   */
  private async onEditGroupTab(groupTab: GroupTab) {
    //TODO Handle current tab
    // opening change needed here as no other listener requires this
    if (groupTab.isOpen) {
      await tabs.show(groupTab.innerTabs);
    } else {
      await tabs.hide(groupTab.innerTabs);
    }

    // Notifies about changed group tab
    StorageHandler.instance.onEditTab.editedGroupTab(groupTab);
  }
}
