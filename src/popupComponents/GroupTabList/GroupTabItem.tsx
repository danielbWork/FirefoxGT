import React, { memo, useCallback, useMemo, useState } from "react";
import { GroupTab } from "../../utils/GroupTab";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import {
  Avatar,
  Collapse,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { InnerTabItem } from "./InnerTabItem";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

import browser, { Tabs, tabs } from "webextension-polyfill";
import { useTextInputDialog } from "../../utils/ui/dialogs/useTextInputDialog";
import { createGroupTabTitle, moveGroupTab } from "../../utils/Utils";
import { ICON_URL } from "../../utils/Consts";
import { useChoiceDialog } from "../../utils/ui/dialogs/useChoiceDialog";
import { useOnMount } from "../../utils/ui/useOnMount";

type Props = {
  /**
   * Id of the group tab that this item represents
   */
  groupTabID: number;

  /**
   * Callback to notify when group tab should be removed
   */
  onRemoveGroupTab: (groupTab: GroupTab) => void;
};

/**
 * Represents a group tab in the list
 */
export const GroupTabItem = memo(({ groupTabID, onRemoveGroupTab }: Props) => {
  const [groupTab, setGroupTab] = useState<GroupTab>(
    StorageHandler.instance.getGroupTabByID(groupTabID)!
  );
  const [groupTabInfo, setGroupTabInfo] = useState<Tabs.Tab>();

  const [isSubListOpen, setIsSubListOpen] = useState(false);

  const [innerTabToRemove, setInnerTabToRemove] = useState<number>();

  const loadGroupTabInfo = useCallback(async () => {
    const info = await tabs.get(groupTabID);
    setGroupTabInfo(info);
  }, [groupTabID]);

  // Firs load for the info
  useOnMount(() => {
    loadGroupTabInfo();
  });

  // Gets group tab and it's info
  const loadGroupTab = useCallback(async () => {
    const groupTabValue = StorageHandler.instance.getGroupTabByID(groupTabID)!;

    // Makes sure it's a new object to update the ui
    setGroupTab({ ...groupTabValue });
    loadGroupTabInfo();
  }, [groupTabID]);

  // Toggles sublist to be displayed or not
  const handleToggleGroup = useCallback(async () => {
    setIsSubListOpen(!isSubListOpen);
  }, [isSubListOpen]);

  // Notifies that the group tab needs to be removed
  const handleRemoveGroupTab = useCallback(() => {
    onRemoveGroupTab(groupTab);
  }, [onRemoveGroupTab, groupTabID]);

  // Handles removing the actual inner tab
  const handleRemoveInnerTab = useCallback(
    async (idToRemove?: number) => {
      // At least one of this must be defined
      if (!innerTabToRemove && !idToRemove) return;

      // If a value wasn't passed means dialog was used and we need the state value
      idToRemove = idToRemove || innerTabToRemove!;

      await StorageHandler.instance.removeInnerTab(groupTab, idToRemove);

      await loadGroupTab();

      moveGroupTab(groupTabID, [idToRemove]);

      setInnerTabToRemove(undefined);
    },
    [innerTabToRemove]
  );

  const { dialog: removeInnerTabDialog, openDialog: openRemoveInnerTabDialog } =
    useChoiceDialog(
      "Remove inner tab",
      "Are you sure you want to remove this inner tab?",
      handleRemoveInnerTab
    );

  // Handles user clicking the he remove inner tab button accordingly with the settings
  const handleRemoveInnerTabClick = useCallback(
    async (tabID: number) => {
      if (!groupTab) return;

      const innerTab = await tabs.get(tabID);

      if (StorageHandler.instance.settings.showRemoveFromGroupTabDialog.popup) {
        setInnerTabToRemove(tabID);
        openRemoveInnerTabDialog(
          `Are you sure you want to remove ${innerTab.title}?`
        );
      } else {
        handleRemoveInnerTab(tabID);
      }
    },
    [groupTab]
  );

  // Goes to the inner tab in the browser
  const handleGoToInnerTab = useCallback(
    (tabID: number) => {
      if (!groupTab) return;

      tabs.update(tabID, { active: true });

      if (!groupTab.isOpen) {
        StorageHandler.instance.toggleGroupTabVisibility(groupTab);
      }
    },
    [groupTab]
  );

  // Updates the group tab's name
  const handleEditGroupTabName = useCallback(
    async (newName: string) => {
      await StorageHandler.instance.updateGroupTabName(groupTab!, newName);
      loadGroupTab();
    },
    [groupTab]
  );

  const { dialog: editNameDialog, openDialog: openEditNameDialog } =
    useTextInputDialog(
      "Edit Group tab name",
      "Please enter the Group tab's new name",
      handleEditGroupTabName
    );

  // Opens the dialog to edit the group tab's name
  const handleEditDialogOpen = useCallback(() => {
    openEditNameDialog(groupTab.name);
  }, [openEditNameDialog]);

  // Loads the group tab's icon
  const icon = useMemo(() => {
    // Icon isn't always loaded
    if (groupTabInfo?.favIconUrl) {
      return groupTabInfo.favIconUrl;
    }

    // Default icon
    return ICON_URL;
  }, [groupTabInfo]);

  const title = useMemo(() => {
    return groupTab ? createGroupTabTitle(groupTab) : "";
  }, [groupTab]);

  if (!groupTabInfo) {
    return (
      <ListItem role={undefined} dense divider>
        <Skeleton width={"100%"} height={"100%"} />
      </ListItem>
    );
  }

  return (
    <>
      {editNameDialog}
      {removeInnerTabDialog}
      <ListItem
        role={undefined}
        dense
        divider
        secondaryAction={
          <IconButton
            edge="end"
            aria-label="edit"
            onClick={handleEditDialogOpen}
          >
            <EditIcon />
          </IconButton>
        }
      >
        <ListItemIcon onClick={handleRemoveGroupTab}>
          <IconButton>
            <CloseIcon />
          </IconButton>
        </ListItemIcon>
        <ListItemAvatar>
          <Avatar src={icon} sx={{ width: 24, height: 24 }} />
        </ListItemAvatar>
        <ListItem
          disabled={!groupTab.innerTabs.length}
          onClick={() => {
            handleToggleGroup();
          }}
          sx={{
            marginTop: "1",
            "&:hover": groupTab.innerTabs.length
              ? { color: "Highlight" }
              : undefined,
          }}
        >
          <ListItemText primary={title} />

          {groupTab.innerTabs.length > 0 &&
            (isSubListOpen ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>
      </ListItem>

      <Collapse in={isSubListOpen} sx={{ paddingLeft: 4 }}>
        <List dense>
          {groupTab.innerTabs.map((value) => {
            return (
              <InnerTabItem
                key={value}
                tabID={value}
                onRemoveInnerTab={handleRemoveInnerTabClick}
                onTabClick={handleGoToInnerTab}
              />
            );
          })}
        </List>
      </Collapse>
    </>
  );
});
