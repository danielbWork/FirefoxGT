import { InfoOutlined } from "@mui/icons-material";
import { Checkbox, FormControlLabel, Popover, Typography } from "@mui/material";
import React, { useCallback, useState } from "react";
import { Setting } from "../SettingTypes";

/**
 * The ui for a boolean setting
 */
export const BooleanSetting = ({
  title,
  value,
  updateSettingCallback,
  details,
  disabled = false,
}: Setting) => {
  const [anchor, setAnchor] = useState<HTMLElement>();

  const handlePopoverOpen = (event?: any) => {
    setAnchor(event?.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchor(undefined);
  };

  const handleOnSettingChange = useCallback(() => {
    updateSettingCallback(!value);
  }, [value, updateSettingCallback]);

  // TODO Fix text color when disabled
  return (
    <FormControlLabel
      sx={{ alignItems: "center" }}
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
        <Typography sx={{ verticalAlign: "middle", display: "inline-flex" }}>
          {title}
          {details && (
            <>
              <InfoOutlined
                fontSize="small"
                id="info-icon"
                aria-owns={
                  anchor !== undefined ? "mouse-over-popover" : undefined
                }
                aria-haspopup="true"
                onMouseEnter={handlePopoverOpen}
                onMouseLeave={handlePopoverClose}
                sx={{ marginLeft: 1 }}
              />

              <Popover
                id="mouse-over-popover"
                sx={{
                  pointerEvents: "none",
                }}
                open={anchor !== undefined}
                anchorOrigin={{
                  vertical: "bottom",
                  horizontal: "left",
                }}
                anchorEl={anchor}
                transformOrigin={{
                  vertical: "top",
                  horizontal: "left",
                }}
                onClose={handlePopoverClose}
                disableRestoreFocus
              >
                <Typography sx={{ padding: 1, maxWidth: 500 }}>
                  {details}
                </Typography>
              </Popover>
            </>
          )}
        </Typography>
      }
    />
  );
};
