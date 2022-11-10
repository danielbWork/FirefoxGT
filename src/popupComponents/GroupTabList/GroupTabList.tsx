import { Box, Button, Divider, List, Stack, Typography } from "@mui/material";
import React, { useCallback, useState } from "react";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { GroupTabItem } from "./GroupTabItem";
import browser, { tabs } from "webextension-polyfill";
import { useTextInputDialog } from "../../utils/ui/useTextInputDialog";
import { GROUP_TAB_URL } from "../../utils/Consts";
import { useChoiceDialog } from "../../utils/ui/useChoiceDialog";
import { GroupTab } from "utils/GroupTab";

/**
 * The list of group tabs displayed in the ui
 */
export const GroupTabList = () => {
  const [groupTabIDs, setGroupTabIDs] = useState<string[]>(
    StorageHandler.instance.getAllGroupTabIDs()
  );

  const [groupTabToRemove, setGroupTabToRemove] = useState<GroupTab>();

  // Updates group tabs in the component
  const handleUpdateGroupTabs = useCallback(() => {
    const groupTabsIDs = StorageHandler.instance.getAllGroupTabIDs();

    setGroupTabIDs(groupTabsIDs);
  }, []);

  // Handles removing the actual group tab
  const handleRemoveGroupTab = useCallback(
    async (groupTab?: GroupTab) => {
      // At least one of this must be defined
      if (!groupTabToRemove && !groupTab) return;

      // If a value wasn't passed means dialog was used and we need the state value
      groupTab = groupTab || groupTabToRemove!;

      await browser.tabs.remove(groupTab.id);
      await StorageHandler.instance.removeTabFromStorage(groupTab.id);
      handleUpdateGroupTabs();

      setGroupTabToRemove(undefined);
    },
    [groupTabToRemove]
  );

  const { dialog: removeGroupTabDialog, openDialog: openRemoveGroupTabDialog } =
    useChoiceDialog(
      "Remove group tab",
      "Are you sure you want to remove this group tab?",
      handleRemoveGroupTab
    );

  // Handles user clicking the he remove group tab button accordingly with the settings
  const handleRemoveGroupTabClick = useCallback(async (groupTab: GroupTab) => {
    if (StorageHandler.instance.settings.showRemoveGroupTabFromPopupDialog) {
      setGroupTabToRemove(groupTab);
      openRemoveGroupTabDialog(
        `Are you sure you want to remove ${groupTab.name}?`
      );
    } else {
      handleRemoveGroupTab(groupTab);
    }
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

  const { dialog: addGroupTabDialog, openDialog: openAddGroupTabDialog } =
    useTextInputDialog(
      "Add Group Tab",
      "Please enter the Group tab's name",
      handleAddGroupTab
    );

  // Handles creating a group tab based on the settings
  const handleCreateGroupTab = useCallback(() => {
    const settings = StorageHandler.instance.settings;
    if (settings.showCreateGroupTabNameDialog.popup) {
      openAddGroupTabDialog(settings.defaultGroupTabName);
    } else {
      handleAddGroupTab(settings.defaultGroupTabName);
    }
  }, [openAddGroupTabDialog, handleAddGroupTab]);

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
      {addGroupTabDialog}
      {removeGroupTabDialog}

      {groupTabIDs.length > 0 ? (
        <List dense sx={{ width: "100%", overflow: "scroll" }}>
          {groupTabIDs.map((value) => {
            return (
              <GroupTabItem
                key={value}
                groupTabID={parseInt(value)}
                onRemoveGroupTab={handleRemoveGroupTabClick}
              />
            );
          })}
        </List>
      ) : (
        <Typography variant="h6" align="center">
          No Group tabs currently press the button to create a new one
        </Typography>
      )}

      <Button
        onClick={handleCreateGroupTab}
        variant="contained"
        sx={{ width: "50%" }}
      >
        Add Group Tab
      </Button>
    </Stack>
  );
};
