import { Stack, Typography } from "@mui/material";
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

  //TODO Fix this ui

  return (
    <Stack
      sx={{
        minWidth: 500,
        maxWidth: 500,
        minHeight: 600,
        padding: 2,
        paddingTop: 4,
      }}
      spacing={1}
    >
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
