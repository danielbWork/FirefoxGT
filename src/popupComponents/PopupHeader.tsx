import {
  AppBar,
  Avatar,
  Box,
  Icon,
  IconButton,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
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
    window.close();
  }, []);

  return (
    <Box alignItems="center" justifyContent="center">
      <AppBar position="static" sx={{ padding: 2 }}>
        <Toolbar sx={{ alignItems: "center" }}>
          <Avatar
            src={ICON_URL}
            sx={{ width: 48, height: 48, marginRight: 2 }}
          />

          <Typography
            variant="h4"
            sx={{
              flex: 1,
              paddingTop: 1,
            }}
          >
            FirefoxGT
          </Typography>

          <IconButton onClick={handleSettingsClick}>
            <SettingsIcon htmlColor={"rgba(255, 255, 255, 0.7)"} />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
};
