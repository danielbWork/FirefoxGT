import { getActiveTab } from "../utils/Utils";
import browser from "webextension-polyfill";
import { ContentMessageType } from "../utils/messages/ContentMessageType";

/**
 *  Handles displaying dialogs in the ui
 */
export class BackgroundDialogHandler {
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
  ): Promise<{ results: any }> {
    const activeTab = await getActiveTab();

    // TODO handle problem pages with popup

    // TODO maybe move to BackgroundHandler (defenitly have one method for all dialogs)
    const result = await browser.tabs.sendMessage(activeTab.id!, {
      type: ContentMessageType.DISPLAY_TEXT_INPUT,
      data: { title, message, defaultValue },
    });

    return result;
  }
}
