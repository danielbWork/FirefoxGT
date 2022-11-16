import {
  Avatar,
  ImageListItem,
  ImageListItemBar,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ICON_URL } from "../../utils/Consts";
import browser, { tabs, Tabs } from "webextension-polyfill";

type Props = {
  /**
   * id of the tab
   */
  id: number;

  /**
   * Listener for when tab ui is clicked
   */
  onTabClickListener: (id: number) => void;
};

/**
 * Ui for an inner item in the group tab grid
 */
export const InnerTabGridItem = ({ id, onTabClickListener }: Props) => {
  const [tab, setTab] = useState<Tabs.Tab>();
  const [tabPicture, setTabPicture] = useState<string>();

  useEffect(() => {
    // Gets image of the actual tabs
    tabs
      .captureTab(id, {
        rect: {
          x: 0,
          y: 0,
          width: window.innerWidth,
          height: window.innerHeight,
        },
        scale: 1 / 3,
        resetScrollPosition: true,
      })
      .then(setTabPicture);

    tabs.get(id).then(setTab);
  }, [id]);

  const title = useMemo(() => {
    return tab?.title || tab?.url || "Loading...";
  }, [tab]);

  // Opens the tab
  const handleOnTabClick = useCallback(() => {
    onTabClickListener(id);
  }, []);

  return (
    <ImageListItem
      sx={{
        border: 1,
        borderRadius: "16px",
        "&:hover": { color: "Highlight" },
      }}
      onClick={handleOnTabClick}
    >
      {tabPicture ? (
        <img
          src={tabPicture}
          loading="lazy"
          title={title}
          alt={title}
          style={{ borderRadius: "18px" }}
        />
      ) : (
        <Skeleton
          width={window.innerWidth / 4}
          height={window.innerHeight / 4}
        />
      )}

      <ImageListItemBar
        title={
          <Typography
            variant="body2"
            textAlign="center"
            component="div"
            sx={{
              verticalAlign: "middle",
              display: "inline-flex",
              borderRadius: "16px",
              alignContent: "center",
              alignItems: "center",
            }}
          >
            <Avatar
              src={tab?.favIconUrl || browser.runtime.getURL(ICON_URL)}
              sx={{ width: 24, height: 24, marginRight: 2 }}
            />
            {title}
          </Typography>
        }
        subtitle={tab?.url}
        position="top"
        sx={{
          borderTopRightRadius: "18px",
          borderTopLeftRadius: "18px",
          alignItems: "center",
        }}
      />
    </ImageListItem>
  );
};
