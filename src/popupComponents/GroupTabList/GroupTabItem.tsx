import React, { useState } from "react";
import { GroupTab } from "../../utils/GroupTab";
import { useOnMount } from "../../utils/ui/useOnMount";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { ListItem, ListItemText } from "@mui/material";

type Props = {
  /**
   * Id of the group tab that this item represents
   */
  groupTabID: number;
};

/**
 * Represents a group tab in the list
 */
export const GroupTabItem = ({ groupTabID }: Props) => {
  const [groupTab, setGroupTab] = useState<GroupTab>();

  // Only calls once since should be the same group tab
  useOnMount(() => {
    StorageHandler.instance
      .getGroupTabByID(groupTabID)
      .then((loadedGroupTab) => {
        setGroupTab(loadedGroupTab);
      });
  });

  return (
    <ListItem divider>
      <ListItemText
        primary={
          groupTab
            ? `${groupTab.name} (${groupTab.innerTabs.length})`
            : "Group Tab"
        }
        secondary={groupTab && (groupTab.isOpen ? "Opened" : "Closed")}
        secondaryTypographyProps={
          groupTab && { color: groupTab.isOpen ? "green" : "red" }
        }
      />
    </ListItem>
  );
};
