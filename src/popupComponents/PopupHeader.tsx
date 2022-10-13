import { Avatar, Icon, IconButton, Stack, Typography } from "@mui/material";
import React from "react";
import { ICON_URL } from "../utils/Consts";
import SettingsIcon from "@mui/icons-material/Settings";
/**
 * Header for popup
 */
export const PopupHeader = () => {
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

      <IconButton>
        <SettingsIcon />
      </IconButton>
    </Stack>
  );
};
