import { Avatar, Icon, IconButton, Stack, Typography } from "@mui/material";
import React, { useCallback } from "react";
import { ICON_URL } from "../utils/Consts";
import SettingsIcon from "@mui/icons-material/Settings";
import browser from "webextension-polyfill";
/**
 * Header for popup
 */
export const PopupHeader = () => {
  const handleSettingsClick = useCallback(() => {
    browser.runtime.openOptionsPage();
  }, []);

  return (
    <Stack
      sx={{ padding: 2 }}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
    >
      <Avatar src={ICON_URL} sx={{ width: 48, height: 48 }} />

      <Typography variant="h4" color="InfoText" align="center">
        Group Tabs
      </Typography>

      <IconButton onClick={handleSettingsClick}>
        <SettingsIcon />
      </IconButton>
    </Stack>
  );
};
