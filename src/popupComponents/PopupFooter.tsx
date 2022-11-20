import { Box, Link, useTheme } from "@mui/material";
import React, { useCallback } from "react";

/**
 * Footer for popup
 */
export const PopupFooter = () => {
  // Closes the popup once link is open
  const handleOnLinkClick = useCallback(() => {
    // Timeout as without it link is opened in new window
    setTimeout(() => {
      window.close();
    }, 100);
  }, []);

  const theme = useTheme();

  return (
    <Box
      sx={{
        backgroundColor: theme.palette.action.disabledBackground,
        width: "100%",
        height: 50,
        padding: 2,
        alignItems: "center",
      }}
    >
      <Link
        href="https://addons.mozilla.org/en-US/firefox/addon/browsergt/"
        variant="body1"
        align="left"
        onClick={handleOnLinkClick}
        sx={{ width: "100%" }}
      >
        Click here for more info
      </Link>
    </Box>
  );
};
