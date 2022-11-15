import React from "react";
import ReactDOM from "react-dom/client";
import { CustomThemeProvider } from "../utils/ui/CustomThemeProvider";
import { ContentMessageType } from "../utils/messages/ContentMessageType";
import { ContentMessageHandler } from "./ContentMessageHandler";
import { DialogUI } from "./DialogUI";
import { OnDisplayDialogNotifier } from "./OnDisplayDialogNotifier";

/**
 * Used to handle actually displaying the dialogs
 */
export class ContentDialogHandler {
  readonly onDisplayDialogNotifier = new OnDisplayDialogNotifier();

  //#region Singleton

  private static _instance: ContentDialogHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): ContentDialogHandler {
    if (!ContentDialogHandler._instance) {
      ContentDialogHandler._instance = new ContentDialogHandler();
    }

    return ContentDialogHandler._instance;
  }

  //#endregion

  setupDialogHandler() {
    this.loadReact();
    window.onblur = this.onDialogLeave.bind(this);
  }

  /**
   * Handles user leaving the tab
   */
  private onDialogLeave() {
    this.onDialogClose(undefined);
  }

  /**
   * Displays the dialog on the screen with the given info
   * @param type The type of dialog we want to display
   * @param data The data for the dialog
   */
  displayDialog(type: ContentMessageType, data: any) {
    // Must load react into page to actually work
    this.onDisplayDialogNotifier.requestDialog(type, data);
  }

  /**
   * Closes the dialog and sends the result to the background page
   * @param results The results of the dialog if the dialog was closed expects undefined
   */
  private onDialogClose(results: any) {
    ContentMessageHandler.instance.sendResults(results);

    this.onDisplayDialogNotifier.requestDialog();
  }

  /**
   * Loads the the react info into the web page
   */
  private loadReact() {
    const body = document.body;

    const app = document.createElement("div");

    app.id = "firefoxGT-div";

    body.appendChild(app);

    const root = ReactDOM.createRoot(app);

    root.render(
      <React.StrictMode>
        <CustomThemeProvider scopeCSS>
          <DialogUI onClose={this.onDialogClose.bind(this)} />
        </CustomThemeProvider>
      </React.StrictMode>
    );
  }
}
