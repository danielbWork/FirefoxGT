import { Box, Typography } from "@mui/material";
import React from "react";

/**
 * Footer for popup
 */
export const PopupFooter = () => {
  return (
    <Box
      sx={{
        backgroundColor: "darkgrey",
        width: "100%",
        height: 50,
        padding: 2,
        alignItems: "center",
      }}
    >
      <Typography
        variant="body1"
        color="InfoText"
        align="left"
        sx={{ width: "100%" }}
      >
        See More Here:
      </Typography>
    </Box>
  );
};
