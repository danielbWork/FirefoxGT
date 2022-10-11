import { Button, Divider, List, Stack, Typography } from "@mui/material";
import React, { useCallback, useState } from "react";
import { useOnMount } from "../../utils/ui/useOnMount";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { GroupTabItem } from "./GroupTabItem";
import browser, { tabs } from "webextension-polyfill";
import { useGroupTabNameDialog } from "./useGroupTabNameDialog";
import { GROUP_TAB_URL } from "../../utils/Consts";

/**
 * The list of group tabs displayed in the ui
 */
export const GroupTabList = () => {
  const [groupTabIDs, setGroupTabIDs] = useState<string[]>([]);

  const handleLoadGroupTabs = useCallback(async () => {
    const groupTabsIDs = await StorageHandler.instance.getAllGroupTabIDs();

    setGroupTabIDs(groupTabsIDs);
  }, []);

  useOnMount(() => {
    handleLoadGroupTabs();
  });

  const handleRemoveGroupTab = useCallback(async (groupTabId: number) => {
    await browser.tabs.remove(groupTabId);
    await StorageHandler.instance.removeTabFromStorage(groupTabId);
    handleLoadGroupTabs();
  }, []);

  const handleAddGroupTab = useCallback(async (name: string) => {
    const groupTab = await tabs.create({
      url: GROUP_TAB_URL,
      active: false,
    });

    await StorageHandler.instance.addGroupTab(groupTab.id!, name);

    handleLoadGroupTabs();
  }, []);

  const { dialog, openDialog } = useGroupTabNameDialog(
    "Add Group Tab",
    "Please enter the Group tab's name",
    handleAddGroupTab
  );

  //TODO Fix this ui

  return (
    <Stack
      justifyContent="space-around"
      alignItems="center"
      sx={{ width: "100%", height: "100%" }}
    >
      {dialog}
      <List dense sx={{ width: "100%", height: "90%" }}>
        {groupTabIDs.map((value) => {
          return (
            <GroupTabItem
              key={value}
              groupTabID={parseInt(value)}
              onRemoveGroupTab={handleRemoveGroupTab}
            />
          );
        })}
      </List>
      <Button
        onClick={() => {
          //TODO fix me
          openDialog();
        }}
        variant="contained"
        sx={{ width: "50%" }}
      >
        Add Group Tab
      </Button>
    </Stack>
  );
};
