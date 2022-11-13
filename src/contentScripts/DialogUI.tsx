import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useTextInputDialog } from "../utils/ui/dialogs/useTextInputDialog";
import { CustomThemeProvider } from "../utils/ui/CustomThemeProvider";
import { ContentDialogHandler } from "./ContentDialogHandler";
import { useDialogInfo } from "./useDialogInfo";
import { ContentMessageType } from "../utils/messages/ContentMessageType";

type Props = {
  /**
   * Callback for when a dialog closes either by submit or dismiss
   */
  onClose: (results: any) => {};
};

/**
 * The actual dialog ui for the content page
 */
export const DialogUI = ({ onClose }: Props) => {
  const { type, data } = useDialogInfo();

  const handleOnSubmit = useCallback((results: any) => {
    onClose(results);
  }, []);
  const handleOnCancel = useCallback(() => {
    onClose(undefined);
  }, []);

  // TODO do this with the other dialogs and add close dialog to them for leaving the tab
  const { dialog: textInputDialog, openDialog: openTextInputDialog } =
    useTextInputDialog(
      data?.title || "",
      data?.message || "",
      handleOnSubmit,
      handleOnCancel
    );

  // Notifies ui to open when needed
  useEffect(() => {
    switch (type) {
      case ContentMessageType.DISPLAY_TEXT_INPUT:
        setTimeout(() => {
          openTextInputDialog(data.defaultValue);
        }, 100);
        break;

      default:
        break;
    }
  }, [type, data]);

  // TODO Fix ui in stackoverflow
  return (
    <CustomThemeProvider includeCSS={false}>
      {textInputDialog}
    </CustomThemeProvider>
  );
};
