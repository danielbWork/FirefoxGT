import { Box, Button, Divider, List, Stack, Typography } from "@mui/material";
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
  const [groupTabIDs, setGroupTabIDs] = useState<string[]>(
    StorageHandler.instance.getAllGroupTabIDs()
  );

  // Updates group tabs in the component
  const handleUpdateGroupTabs = useCallback(() => {
    const groupTabsIDs = StorageHandler.instance.getAllGroupTabIDs();

    setGroupTabIDs(groupTabsIDs);
  }, []);

  // Removes group tab from ui and storage and updates the ui
  const handleRemoveGroupTab = useCallback(async (groupTabId: number) => {
    await browser.tabs.remove(groupTabId);
    await StorageHandler.instance.removeTabFromStorage(groupTabId);
    handleUpdateGroupTabs();
  }, []);

  // Adds group tab to ui and storage
  const handleAddGroupTab = useCallback(async (name: string) => {
    const groupTab = await tabs.create({
      url: GROUP_TAB_URL,
      active: false,
    });

    await StorageHandler.instance.addGroupTab(groupTab.id!, name);

    handleUpdateGroupTabs();
  }, []);

  const { dialog, openDialog } = useGroupTabNameDialog(
    "Add Group Tab",
    "Please enter the Group tab's name",
    handleAddGroupTab
  );

  // Opens the dialog to create a new group
  const handleCreateDialogOpen = useCallback(() => {
    openDialog();
  }, [openDialog]);

  return (
    <Stack
      spacing={2}
      alignItems="center"
      sx={{
        paddingBottom: 3,
        width: "100%",
        flex: 1,
        overflow: "scroll",
      }}
      justifyContent={groupTabIDs.length > 0 ? "space-between" : "center"}
    >
      {dialog}

      {groupTabIDs.length > 0 ? (
        <List dense sx={{ width: "100%", overflow: "scroll" }}>
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
      ) : (
        <Typography variant="h6" color="InfoText" align="center">
          No Group tabs currently press the button to create a new one
        </Typography>
      )}

      <Button
        onClick={handleCreateDialogOpen}
        variant="contained"
        sx={{ width: "50%" }}
      >
        Add Group Tab
      </Button>
    </Stack>
  );
};
