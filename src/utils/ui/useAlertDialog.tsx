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
 * @returns The dialog to be displayed and openDialog which opens the dialog once called
 */
export const useAlertDialog = (title: string, message: string) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const dialog = useMemo(() => {
    return (
      <Dialog open={isOpen} onClose={handleClose}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
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
  };
};
