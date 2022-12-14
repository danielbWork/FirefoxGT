import { BackgroundMessageType } from "../messages/BackgroundMessageType";
import { GroupTab } from "../GroupTab";
import { StorageHandler } from "../Storage/StorageHandler";
import browser from "webextension-polyfill";

/**
 * Handles messaging the background regarding script events
 */
export class UIMessageHandler {
  //#region Singleton

  private static _instance: UIMessageHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): UIMessageHandler {
    if (!UIMessageHandler._instance) {
      UIMessageHandler._instance = new UIMessageHandler();
    }

    return UIMessageHandler._instance;
  }

  //#endregion

  setupMessageHandler() {
    StorageHandler.instance.onAddTab.addListener(
      this.onAddTabMessage.bind(this)
    );
    StorageHandler.instance.onRemoveTab.addListener(
      this.onRemoveTabMessage.bind(this)
    );
    StorageHandler.instance.onEditTab.addListener(
      this.onEditTabMessage.bind(this)
    );
  }

  /**
   * Sends the message to the background page
   * @param type The type of message sent to the background
   * @param data The data about the message
   */
  sendMessage(type: BackgroundMessageType, data: any) {
    try {
      browser.runtime.sendMessage({ type, data });
    } catch (error) {
      console.error("sendMessage error: ", error);
      return null;
    }
  }

  /**
   * Notifies the background page about an added tab
   * @param groupTab The group tab that was added or was given a new inner tab
   * @param index the index of the inner tab if it was added
   */
  private onAddTabMessage(
    groupTab: GroupTab,
    index?: number | undefined
  ): void {
    this.sendMessage(BackgroundMessageType.ADD_TAB, { groupTab, index });
  }

  /**
   * Notifies the background page about a removed tab
   * @param groupTab The group tab that was removed or had one of it's inner tabs removed
   * @param id the id of the inner tab if it was removed
   */
  private onRemoveTabMessage(
    groupTab: GroupTab,
    id?: number | undefined
  ): void {
    this.sendMessage(BackgroundMessageType.REMOVE_TAB, { groupTab, id });
  }

  /**
   * Notifies the background page about aan edited tab
   * @param groupTab The group tab that was edited
   */
  private onEditTabMessage(groupTab: GroupTab): void {
    this.sendMessage(BackgroundMessageType.EDIT_TAB, { groupTab });
  }
}
