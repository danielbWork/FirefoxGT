import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
} from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";

/**
 * Hook for handling user choice dialog,
 * this handles everything besides opening the dialog itself
 *
 * @param title Title of dialog
 * @param defaultMessage Default value for the dailogs message message
 * @param onSubmit Notifies when user chose to to do what the dialog requested
 * @param onCancel Notifies when user has decided to exit out of dialog without continuing
 * @returns The dialog to be displayed and openDialog which opens the dialog once called, open dialog can receive a new custom message if needed
 */
export const useChoiceDialog = (
  title: string,
  defaultMessage: string,
  onSubmit: () => void,
  onCancel?: () => void
) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState(defaultMessage);

  const handleCancel = useCallback(() => {
    setIsOpen(false);

    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const handleSubmit = useCallback(() => {
    setIsOpen(false);
    onSubmit();
  }, [onSubmit]);

  const dialog = useMemo(() => {
    return (
      <Dialog open={isOpen} onClose={handleCancel}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button onClick={handleSubmit}>Submit</Button>
        </DialogActions>
      </Dialog>
    );
  }, [isOpen, title, message, handleCancel, handleSubmit]);

  return {
    dialog,
    openDialog: (customMessage?: string) => {
      if (customMessage) {
        setMessage(customMessage);
      }

      setIsOpen(true);
    },
  };
};
