import { InfoOutlined } from "@mui/icons-material";
import {
  Checkbox,
  FormControl,
  FormControlLabel,
  MenuItem,
  Popover,
  Select,
  SelectChangeEvent,
  Stack,
  Typography,
} from "@mui/material";
import React, { useCallback, useState } from "react";
import { SettingProps } from "../SettingsProps";
import { InfoPopover } from "../../utils/ui/InfoPopover";

/**
 * The ui for a multiple choice string setting
 */
export const MultipleChoiceStringsSetting = ({
  title,
  value,
  updateSettingCallback,
  details,
  disabled = false,
  choices,
}: SettingProps) => {
  const handleOnSettingChange = useCallback(
    (event: SelectChangeEvent) => {
      updateSettingCallback(event.target.value as string);
    },
    [value, updateSettingCallback]
  );

  return (
    <Stack
      direction="row"
      justifyContent="flex-start"
      spacing={5}
      alignItems="center"
    >
      <Typography
        color={disabled ? "GrayText" : undefined}
        sx={{ verticalAlign: "middle", display: "inline-flex" }}
      >
        {title}
        {details && <InfoPopover info={details} disabled={disabled} />}
      </Typography>
      <FormControl sx={{ minWidth: 350 }} size="small">
        <Select
          onChange={handleOnSettingChange}
          value={value}
          disabled={disabled}
        >
          {choices?.map((choice) => {
            return (
              <MenuItem key={choice.value} value={choice.value}>
                {choice.title}
              </MenuItem>
            );
          })}
        </Select>
      </FormControl>
    </Stack>
  );
};
