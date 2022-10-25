import { InfoOutlined } from "@mui/icons-material";
import { Popover, Typography } from "@mui/material";
import React, { useState } from "react";

type Props = {
  info: string;
  disabled: boolean;
};

/**
 *  Info icon with popover which displays the text on hover
 */
export const InfoPopover = ({ info, disabled = false }: Props) => {
  const [anchor, setAnchor] = useState<HTMLElement>();

  const handlePopoverOpen = (event?: any) => {
    setAnchor(event?.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchor(undefined);
  };

  return (
    <>
      <InfoOutlined
        fontSize="small"
        id="info-icon"
        aria-owns={anchor !== undefined ? "mouse-over-popover" : undefined}
        aria-haspopup="true"
        onMouseEnter={handlePopoverOpen}
        onMouseLeave={handlePopoverClose}
        sx={{ marginLeft: 1 }}
        color={disabled ? "disabled" : "info"}
      />

      {!disabled && (
        <Popover
          id="mouse-over-popover"
          sx={{
            pointerEvents: "none",
          }}
          open={anchor !== undefined}
          anchorOrigin={{
            vertical: "bottom",
            horizontal: "left",
          }}
          anchorEl={anchor}
          transformOrigin={{
            vertical: "top",
            horizontal: "left",
          }}
          onClose={handlePopoverClose}
          disableRestoreFocus
        >
          <Typography sx={{ padding: 1, maxWidth: 500 }}>{info}</Typography>
        </Popover>
      )}
    </>
  );
};
