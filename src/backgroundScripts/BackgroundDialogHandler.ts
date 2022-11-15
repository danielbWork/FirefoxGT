import { ContentMessageType } from "../utils/messages/ContentMessageType";
import { BackgroundMessageHandler } from "./BackgroundMessageHandler";

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
  ) {
    const result =
      await BackgroundMessageHandler.instance.sendContentScriptMessage(
        ContentMessageType.DISPLAY_TEXT_INPUT,
        { title, message, defaultValue }
      );

    // TODO handle problem pages with popup

    return result.results;
  }

  /**
   * Displays a choice dialog in the ui asking the user to confirm if they want to do something
   * @param title The title for the dialog
   * @param message The message passed by the dialog
   * @returns The choice or undefined if user closed the dialog
   */
  async displayChoiceDialog(title: string, message: string) {
    const result =
      await BackgroundMessageHandler.instance.sendContentScriptMessage(
        ContentMessageType.DISPLAY_CHOICE,
        { title, message }
      );

    // TODO handle problem pages with popup

    return result.results;
  }
}
