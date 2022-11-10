import {
  Avatar,
  IconButton,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import React, { useCallback, useState } from "react";
import { useOnMount } from "../../utils/ui/useOnMount";
import { Tabs, tabs } from "webextension-polyfill";
import CloseIcon from "@mui/icons-material/Close";

type Props = {
  /**
   * Id of the tab that this item represents
   */
  tabID: number;

  /**
   * Callback to notify when inner tab should be removed
   */
  onRemoveInnerTab: (id: number) => void;

  /**
   * Callback to notify when inner tab should be removed
   */
  onTabClick: (id: number) => void;
};

/**
 * The ui for an inner tab
 */
export const InnerTabItem = ({
  tabID,
  onRemoveInnerTab,
  onTabClick,
}: Props) => {
  const [tab, setTab] = useState<Tabs.Tab>();

  useOnMount(() => {
    tabs.get(tabID).then((result) => {
      setTab(result);
    });
  });

  const handleRemoveFromGroup = useCallback(async () => {
    onRemoveInnerTab(tabID);
  }, [onRemoveInnerTab, tabID]);

  const handleOnTabCLick = useCallback(() => {
    onTabClick(tabID);
  }, [onTabClick, tabID]);

  console.log(tab?.favIconUrl);

  return (
    <ListItem dense divider>
      <ListItemIcon onClick={handleRemoveFromGroup}>
        <IconButton>
          <CloseIcon />
        </IconButton>
      </ListItemIcon>

      <ListItem
        onClick={handleOnTabCLick}
        sx={{ "&:hover": { color: "Highlight" } }}
      >
        <ListItemAvatar>
          <Avatar src={`${tab?.favIconUrl}`} sx={{ width: 24, height: 24 }} />
        </ListItemAvatar>

        <ListItemText primary={tab?.title} />
      </ListItem>
    </ListItem>
  );
};
