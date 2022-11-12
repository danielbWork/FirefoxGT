import { getActiveTab } from "../utils/Utils";
import browser, { tabs, scripting } from "webextension-polyfill";

/**
 *  Handles displaying dialogs in the ui
 */
export class DialogHandler {
  //#region Singleton

  private static _instance: DialogHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): DialogHandler {
    if (!DialogHandler._instance) {
      DialogHandler._instance = new DialogHandler();
    }

    return DialogHandler._instance;
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
    // TODO change to talk with content script
    const activeTab = await getActiveTab();

    const target = {
      tabId: activeTab.id!,
      allFrames: true,
    };

    const testResult = await scripting
      .executeScript({
        target,
        files: ["/src/webPages/contentScripts/textInputDialog.js"],
      })
      .catch((error) => {
        console.log(error);
      });

    console.log(testResult);

    // JS as that is how it gets bundled
    const result = await scripting
      .executeScript({
        target,

        files: ["/src/webPages/contentScripts/textInputDialog.js"],
      })
      .catch((error) => {
        console.log(error);
      });

    console.log(result);

    return "";
  }
}
