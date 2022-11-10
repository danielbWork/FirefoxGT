import { Box, Link, Typography } from "@mui/material";
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

  return (
    <Box
      sx={{
        backgroundColor: "InfoBackground",
        width: "100%",
        height: 50,
        padding: 2,
        alignItems: "center",
        borderRadius: "16px",
      }}
    >
      <Link
        href="https://github.com/danielbWork/FirefoxGT"
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
