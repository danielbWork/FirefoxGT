import { Box, Divider, Stack, Typography } from "@mui/material";
import React from "react";
import { GroupTabList } from "./GroupTabList/GroupTabList";
import { PopupFooter } from "./PopupFooter";
import { PopupHeader } from "./PopupHeader";

/**
 * The base Popup element for the code
 */
export const Popup = () => {
  return (
    <Box
      display="flex"
      sx={{
        minWidth: 500,
        maxWidth: 500,
        minHeight: 600,
        maxHeight: 600,
        flexDirection: "column",
      }}
    >
      <PopupHeader />
      <GroupTabList />
      <Divider sx={{ backgroundColor: undefined, height: 2 }} />
      <PopupFooter />
    </Box>
  );
};
