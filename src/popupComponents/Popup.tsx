import { Stack, Typography } from "@mui/material";
import Box from "@mui/material/Box";
import React from "react";
import { GroupTabList } from "./GroupTabList/GroupTabList";

/**
 * The base Popup element for the code
 */
export const Popup = () => {
  /*
  TODO
    -Header
      Title?
      settings button?
    - GroupTabList
      grouptabs
      add button
      custom display for no group tabs
    -Footer?

  */

  return (
    <Stack style={{ minWidth: 400, minHeight: 500, padding: 8 }} spacing={1}>
      <Typography variant="h4" color="InfoText" align="center">
        Group Tabs Header
      </Typography>

      <GroupTabList />

      <Typography
        variant="h4"
        color="InfoText"
        align="center"
        sx={{ position: "fixed", bottom: 0, width: "100%" }}
      >
        Group Tabs Footer
      </Typography>
    </Stack>
  );
};
