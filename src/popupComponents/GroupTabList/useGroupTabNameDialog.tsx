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
 * Hook for handling group tab name dialog,
 * this handles everything besides opening the dialog itself
 *
 * @param title Title of dialog
 * @param message Text about the dialog name
 * @param defaultName The default name to display in the input field
 * @param onSubmit Notifies when user submitted a name
 * @returns The dialog to be displayed and openDialog which opens the dialog and allows to put a default value for TextField
 */
export const useGroupTabNameDialog = (
  title: string,
  message: string,
  onSubmit: (name: string) => void
) => {
  const [isOpen, setIsOpen] = useState(false);

  const [value, setValue] = useState("");

  const handleCancel = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleSubmit = useCallback(() => {
    setIsOpen(false);
    onSubmit(value);
  }, [value]);

  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      setValue(event.target.value);
    },
    []
  );

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
            label="Group Tab Name"
            fullWidth
            variant="outlined"
            value={value}
            error={value.trim() === ""}
            helperText={value.trim() === "" ? "Invalid group name" : undefined}
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
    openDialog: (defaultValue = "Group Tab") => {
      setValue(defaultValue);
      setIsOpen(true);
    },
  };
};
