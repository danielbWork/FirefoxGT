import { InfoOutlined } from "@mui/icons-material";
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Popover,
  Typography,
} from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";
import { SettingProps, SettingType } from "../SettingsProps";
import { InfoPopover } from "../../utils/ui/InfoPopover";
import { BooleanSetting } from "./BooleanSetting";

/**
 * The ui for a boolean setting
 */
export const MultiBooleanSetting = ({
  title,
  value,
  updateSettingCallback,
  details,
  disabled = false,
  childSettings,
}: SettingProps) => {
  // Updates all of the sub settings to match
  const handleOnSettingChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const newValue: any = {};

      Object.keys(value).forEach((key) => {
        newValue[key] = event.target.checked;
      });

      updateSettingCallback(newValue);
    },
    [value, updateSettingCallback]
  );

  const isIndeterminate = useMemo(() => {
    if (!childSettings) return false;

    // Checks to see if any of the values is different then others
    for (let index = 0; index < childSettings.length - 1; index++) {
      const currentChildCodeName = childSettings[index].fieldName;
      const nextChildCodeName = childSettings[index + 1].fieldName;

      if (value[currentChildCodeName] !== value[nextChildCodeName]) return true;
    }

    return false;
  }, [childSettings]);

  // Creates the real callback to be used for updating settings value of the setting with the given name
  const handleCreateUpdateSettingCallback = useCallback(
    (name: string) => {
      return (newInnerValue: any) => {
        const newValue = { ...value };

        newValue[name] = newInnerValue;

        updateSettingCallback(newValue);
      };
    },
    [value]
  );

  return (
    <Box>
      <FormControlLabel
        sx={{ alignItems: "center" }}
        disabled={disabled}
        control={
          <Checkbox
            onChange={handleOnSettingChange}
            checked={
              !isIndeterminate &&
              childSettings &&
              value[childSettings[0].fieldName]
            }
            disabled={disabled}
            indeterminate={isIndeterminate}
            sx={{ marginRight: 2 }}
          />
        }
        label={
          <Typography
            sx={{
              verticalAlign: "middle",
              display: "inline-flex",
            }}
          >
            {title}
            {details && <InfoPopover info={details} disabled={disabled} />}
          </Typography>
        }
      />
      <Box sx={{ display: "flex", flexDirection: "column", marginLeft: 6 }}>
        {childSettings?.map((setting) => {
          return (
            <BooleanSetting
              key={setting.fieldName}
              title={setting.title}
              type={SettingType.BOOLEAN}
              value={value[setting.fieldName]}
              updateSettingCallback={handleCreateUpdateSettingCallback(
                setting.fieldName
              )}
              disabled={disabled}
            />
          );
        })}
      </Box>
    </Box>
  );
};
