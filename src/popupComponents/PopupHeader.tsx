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
    <Box
      alignItems="center"
      justifyContent="center"
      sx={{ borderRadius: "8px" }}
    >
      <AppBar position="static" sx={{ padding: 2, borderRadius: "8px" }}>
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
            <SettingsIcon htmlColor="darkgray" />
          </IconButton>
        </Toolbar>
      </AppBar>
    </Box>
  );
};
