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
 * Hook for handling user alert dialog,
 * this handles everything besides opening the dialog itself
 *
 * @param title Title of dialog
 * @param message Text to alert user of
 * @param onClose Optional callback that is notified when user closes the alert
 * @returns The dialog to be displayed, openDialog which opens the dialog once called and closeDialog which closes the dialog once called
 */
export const useAlertDialog = (
  title: string,
  message: string,
  onClose?: () => void
) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);

    if (onClose) {
      onClose();
    }
  }, []);

  const dialog = useMemo(() => {
    return (
      <Dialog open={isOpen} onClose={handleClose}>
        <DialogTitle component={"div"}>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText component={"div"}>{message}</DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} autoFocus>
            Close
          </Button>
        </DialogActions>
      </Dialog>
    );
  }, [isOpen, title, message, handleClose]);

  return {
    dialog,
    openDialog: () => {
      setIsOpen(true);
    },
    closeDialog: () => {
      setIsOpen(false);
    },
  };
};
