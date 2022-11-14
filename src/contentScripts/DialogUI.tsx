import React, { useCallback, useState, useMemo, useEffect } from "react";
import { useTextInputDialog } from "../utils/ui/dialogs/useTextInputDialog";
import { useDialogInfo } from "./useDialogInfo";
import { ContentMessageType } from "../utils/messages/ContentMessageType";
import { useChoiceDialog } from "../utils/ui/dialogs/useChoiceDialog";
import { useAlertDialog } from "../utils/ui/dialogs/useAlertDialog";
import { Box } from "@mui/material";

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

  const handleOnSubmit = useCallback((results?: any) => {
    onClose(results || true);
  }, []);
  const handleOnCancel = useCallback(() => {
    onClose(undefined);
  }, []);

  // TODO Handle leaving tab maybe add close dialog

  const { dialog: textInputDialog, openDialog: openTextInputDialog } =
    useTextInputDialog(
      data?.title || "",
      data?.message || "",
      handleOnSubmit,
      handleOnCancel
    );

  const { dialog: choiceDialog, openDialog: openChoiceDialog } =
    useChoiceDialog(
      data?.title || "",
      data?.message || "",
      handleOnSubmit,
      handleOnCancel
    );

  const { dialog: alertDialog, openDialog: openAlertDialog } = useAlertDialog(
    data?.title || "",
    data?.message || "",
    handleOnSubmit
  );

  // Notifies ui to open when needed
  useEffect(() => {
    switch (type) {
      case ContentMessageType.DISPLAY_TEXT_INPUT:
        setTimeout(() => {
          openTextInputDialog(data.defaultValue);
        }, 100);
        break;
      case ContentMessageType.DISPLAY_CHOICE:
        setTimeout(() => {
          openChoiceDialog();
        }, 100);
        break;
      case ContentMessageType.DISPLAY_ALERT:
        setTimeout(() => {
          openAlertDialog();
        }, 100);
        break;
      default:
        break;
    }
  }, [type, data]);

  return (
    <Box>
      {textInputDialog}
      {choiceDialog}
      {alertDialog}
    </Box>
  );
};
