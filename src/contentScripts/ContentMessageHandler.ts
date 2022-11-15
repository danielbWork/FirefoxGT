import browser, { Runtime } from "webextension-polyfill";
import { ContentDialogHandler } from "./ContentDialogHandler";

/**
 * Handler for receiving messages from background page
 */
export class ContentMessageHandler {
  /**
   * The response sent back to the background
   */
  private response?: (result: any) => void = undefined;

  //#region Singleton

  private static _instance: ContentMessageHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): ContentMessageHandler {
    if (!ContentMessageHandler._instance) {
      ContentMessageHandler._instance = new ContentMessageHandler();
    }

    return ContentMessageHandler._instance;
  }

  //#endregion

  setup() {
    browser.runtime.onMessage.addListener(this.handleOnMessage.bind(this));
  }

  /**
   * Sends the result to the background to handle with
   * @param results The result sent to the background
   */
  async sendResults(results: any) {
    if (this.response) {
      this.response({ results });
      this.response = undefined;
    }
  }

  /**
   * Reacts to the message sent from the pop up
   * @param message The message from the popup
   * @param sender Unused
   */
  private handleOnMessage(
    message: any,
    sender: Runtime.MessageSender
    // sendResponse: (result: any) => void
  ) {
    const data = message?.data;
    const type = message?.type;

    // Makes sure value is valid
    if (!data || !type) return;

    ContentDialogHandler.instance.displayDialog(type, data);

    // Doesn't use this method as polyfill doesn't support sendResponse
    // this.response = sendResponse;
    // // To notify code about planned response
    // return true;

    // This promise is received by the background
    return new Promise((resolve) => {
      this.response = resolve;
    });
  }
}
