import { InfoOutlined } from "@mui/icons-material";
import { Checkbox, FormControlLabel, Popover, Typography } from "@mui/material";
import React, { useCallback, useState } from "react";
import { SettingProps } from "../SettingsProps";
import { InfoPopover } from "../../utils/ui/InfoPopover";

/**
 * The ui for a boolean setting
 */
export const BooleanSetting = ({
  title,
  value,
  updateSettingCallback,
  details,
  disabled = false,
}: SettingProps) => {
  const handleOnSettingChange = useCallback(() => {
    updateSettingCallback(!value);
  }, [value, updateSettingCallback]);

  return (
    <FormControlLabel
      sx={{ alignItems: "center", width: "100%" }}
      disabled={disabled}
      control={
        <Checkbox
          onChange={handleOnSettingChange}
          checked={value}
          disabled={disabled}
          sx={{ marginRight: 2 }}
        />
      }
      label={
        <Typography
          color={disabled ? "GrayText" : undefined}
          sx={{ verticalAlign: "middle", display: "inline-box" }}
        >
          {title}
          {details && <InfoPopover info={details} disabled={disabled} />}
        </Typography>
      }
    />
  );
};
