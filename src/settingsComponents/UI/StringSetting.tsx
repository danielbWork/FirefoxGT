import { Box, Stack, TextField, Typography } from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";
import { InfoPopover } from "../../utils/ui/InfoPopover";
import { SettingProps } from "../SettingsProps";

/**
 * The Setting for a string value
 */
export const StringSetting = ({
  title,
  value,
  updateSettingCallback,
  details,
  disabled = false,
}: SettingProps) => {
  const isValueInvalid = useMemo(() => {
    return value.trim() === "";
  }, [value]);

  // Handles user input
  const handleOnChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
      updateSettingCallback(
        event.target.value,
        event.target.value.trim() === ""
      );
    },
    []
  );

  return (
    <Stack
      sx={{ width: "100%" }}
      direction="row"
      justifyContent="space-between"
      alignItems="center"
    >
      <Typography
        color={disabled ? "GrayText" : undefined}
        sx={{ verticalAlign: "middle", display: "inline-flex" }}
      >
        {title}
        {details && <InfoPopover info={details} disabled={disabled} />}
      </Typography>
      <TextField
        disabled={disabled}
        variant="outlined"
        value={value}
        onChange={handleOnChange}
        sx={{ marginLeft: 10 }}
        size="small"
        error={isValueInvalid}
        label={isValueInvalid ? "Value can't be empty" : title}
      />
    </Stack>
  );
};
