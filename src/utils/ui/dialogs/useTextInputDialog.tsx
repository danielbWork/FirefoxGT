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
 * Hook for handling text input dialog,
 * this handles everything besides opening the dialog itself
 *
 * @param title Title of dialog
 * @param message Text about the dialog input
 * @param onSubmit Notifies when user submitted input
 * @param onCancel Notifies when user has decided to exit out of dialog
 * @returns The dialog to be displayed and openDialog which opens the dialog and allows to put a default input value for TextField
 */
export const useTextInputDialog = (
  title: string,
  message: string,
  onSubmit: (name: string) => void,
  onCancel?: () => void
) => {
  const [isOpen, setIsOpen] = useState(false);

  const [value, setValue] = useState("");

  const handleCancel = useCallback(() => {
    setIsOpen(false);

    if (onCancel) {
      onCancel();
    }
  }, [onCancel]);

  const handleSubmit = useCallback(() => {
    setIsOpen(false);
    onSubmit(value);
  }, [onSubmit, value]);

  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setValue(event.target.value);
    },
    []
  );

  const inputRef = React.useRef<any>();

  const dialog = useMemo(() => {
    return (
      <Dialog open={isOpen}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          <DialogContentText>{message}</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            type="text"
            hiddenLabel
            label={title}
            fullWidth
            inputRef={inputRef}
            variant="outlined"
            value={value}
            error={value.trim() === ""}
            helperText={value.trim() === "" ? "Invalid input" : undefined}
            onChange={handleOnChange}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancel}>Cancel</Button>
          <Button disabled={value.trim() === ""} onClick={handleSubmit}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>
    );
  }, [
    isOpen,
    title,
    message,
    value,
    handleOnChange,
    handleCancel,
    handleSubmit,
  ]);

  return {
    dialog,
    openDialog: (defaultValue = "") => {
      setValue(defaultValue);
      setIsOpen(true);

      // Timeout is needed to let dialog open up and then focus
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    },
  };
};
