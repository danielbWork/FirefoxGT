import React, { useCallback, useState } from "react";
import ReactDOM from "react-dom/client";
import { BaseEventNotifier } from "utils/BaseEventNotifier";
import { ContentMessageType } from "../utils/messages/ContentMessageType";
import { ContentMessageHandler } from "./ContentMessageHandler";
import { DialogUI } from "./DialogUI";
import { OnDisplayDialogNotifier } from "./OnDisplayDialogNotifier";

/**
 * Used to handle actually displaying the dialogs
 */
export class ContentDialogHandler {
  private isLoaded = false;

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

  /**
   * Displays the dialog on the screen with the given info
   * @param type The type of dialog we want to display
   * @param data The data for the dialog
   */
  async displayDialog(type: ContentMessageType, data: any) {
    // Must load react into page to actually work
    if (!this.isLoaded) await this.loadReact();

    setTimeout(() => {
      this.onDisplayDialogNotifier.requestDialog(type, data);
    }, 500);
  }

  /**
   * Closes the dialog and sends the result to the background page
   * @param results The results of the dialog if the dialog was closed expects undefined
   */
  async onDialogClose(results: any) {
    await ContentMessageHandler.instance.sendResults(results);

    this.onDisplayDialogNotifier.requestDialog();
  }

  /**
   * Loads the the react info into the web page
   */
  private async loadReact() {
    const body = document.body;

    const app = document.createElement("div");

    app.id = "firefoxGT-div";

    body.appendChild(app);

    const root = ReactDOM.createRoot(app);

    root.render(
      <React.StrictMode>
        <DialogUI onClose={this.onDialogClose.bind(this)} />
      </React.StrictMode>
    );

    this.isLoaded = true;
  }
}