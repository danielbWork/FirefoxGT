import { createNotification } from "../utils/Utils";
import browser from "webextension-polyfill";
import { ContentMessageType } from "../utils/messages/ContentMessageType";
import { BackgroundMessageHandler } from "./BackgroundMessageHandler";

/**
 *  Handles displaying dialogs in the ui
 */
export class BackgroundDialogHandler {
  private notificationId?: string;

  //#region Singleton

  private static _instance: BackgroundDialogHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): BackgroundDialogHandler {
    if (!BackgroundDialogHandler._instance) {
      BackgroundDialogHandler._instance = new BackgroundDialogHandler();
    }

    return BackgroundDialogHandler._instance;
  }

  //#endregion

  setupDialogHandler() {
    browser.notifications.onClicked.addListener(
      this.onNotificationClick.bind(this)
    );
  }

  /**
   * Displays a text input dialog in the ui asking the user to fill information
   * @param title The title for the dialog
   * @param message The message passed by the dialog
   * @param defaultValue The default value of the text input
   * @returns The inputted text or undefined if user closed the dialog
   */
  async displayTextInputDialog(
    title: string,
    message: string,
    defaultValue: string
  ) {
    const results =
      await BackgroundMessageHandler.instance.sendContentScriptMessage(
        ContentMessageType.DISPLAY_TEXT_INPUT,
        { title, message, defaultValue }
      );

    if (!results) {
      this.problemTabNotification();
      return undefined;
    }

    return results.results;
  }

  /**
   * Displays a choice dialog in the ui asking the user to confirm if they want to do something
   * @param title The title for the dialog
   * @param message The message passed by the dialog
   * @returns The choice or undefined if user closed the dialog
   */
  async displayChoiceDialog(title: string, message: string) {
    const results =
      await BackgroundMessageHandler.instance.sendContentScriptMessage(
        ContentMessageType.DISPLAY_CHOICE,
        { title, message }
      );

    if (!results) {
      this.problemTabNotification();
      return undefined;
    }

    return results.results;
  }

  /**
   * Notifies user about not being able to display dialogs in certain screens
   */
  private async problemTabNotification() {
    this.notificationId = await createNotification(
      "Failed to show dialog",
      "Dialog can't be displayed in this webpage click this for more info"
    );
  }

  private async onNotificationClick(notificationId: string) {
    if (this.notificationId === notificationId) {
      console.log("hi");

      browser.tabs.create({
        url: "https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Content_scripts#sect1",
      });
      console.log("there");

      this.notificationId = undefined;
    }
  }
}
