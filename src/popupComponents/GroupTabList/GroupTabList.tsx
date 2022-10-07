import { Divider, List, Stack, Typography } from "@mui/material";
import React, { useState } from "react";
import { useOnMount } from "../../utils/ui/useOnMount";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { GroupTabItem } from "./GroupTabItem";

/**
 * Theist of group tabs displayed in the ui
 */
export const GroupTabList = () => {
  const [groupTabIDs, setGroupTabIDs] = useState<string[]>([]);

  useOnMount(() => {
    StorageHandler.instance.getAllGroupTabIDs().then((groupTabs) => {
      setGroupTabIDs(groupTabs);
    });
  });

  return (
    <List sx={{ width: "100%", height: "100%" }} dense>
      {groupTabIDs.map((value) => {
        return <GroupTabItem key={value} groupTabID={parseInt(value)} />;
      })}
    </List>
  );
};
