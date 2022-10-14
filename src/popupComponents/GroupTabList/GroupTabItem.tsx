import React, { memo, useCallback, useEffect, useMemo, useState } from "react";
import { GroupTab } from "../../utils/GroupTab";
import { useOnMount } from "../../utils/ui/useOnMount";
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
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";
import { InnerTabItem } from "./InnerTabItem";
import CloseIcon from "@mui/icons-material/Close";
import EditIcon from "@mui/icons-material/Edit";

import browser, { Tabs, tabs } from "webextension-polyfill";
import { useGroupTabNameDialog } from "./useGroupTabNameDialog";
import { moveGroupTab } from "../../utils/Utils";
import { ICON_URL } from "../../utils/Consts";

type Props = {
  /**
   * Id of the group tab that this item represents
   */
  groupTabID: number;

  /**
   * Callback to notify when group tab should be removed
   */
  onRemoveGroupTab: (id: number) => void;
};

/**
 * Represents a group tab in the list
 */
export const GroupTabItem = memo(({ groupTabID, onRemoveGroupTab }: Props) => {
  const [groupTab, setGroupTab] = useState<GroupTab>();
  const [groupTabInfo, setGroupTabInfo] = useState<Tabs.Tab>();

  const [isSubListOpen, setIsSubListOpen] = useState(false);

  // Gets group tab and it's info
  const loadGroupTab = useCallback(async () => {
    const loadedTab = StorageHandler.instance.getGroupTabByID(groupTabID);
    const info = await tabs.get(groupTabID);

    setGroupTab(loadedTab);
    setGroupTabInfo(info);
  }, [groupTabID]);

  // First load
  useOnMount(() => {
    loadGroupTab();
  });

  const handleToggleGroup = useCallback(async () => {
    setIsSubListOpen(!isSubListOpen);
  }, [isSubListOpen]);

  const handleRemoveGroupTab = useCallback(() => {
    onRemoveGroupTab(groupTabID);
  }, [onRemoveGroupTab, groupTabID]);

  // Removes the inner tab from the group and moves it
  const handleRemoveInnerTab = useCallback(
    async (tabID: number) => {
      if (!groupTab) return;
      await StorageHandler.instance.removeInnerTab(groupTab, tabID);

      await loadGroupTab();

      moveGroupTab(groupTabID, [tabID]);
    },
    [groupTab]
  );

  const handleGoToInnerTab = useCallback(
    (tabID: number) => {
      if (!groupTab) return;

      tabs.update(tabID, { active: true });

      if (!groupTab.isOpen) {
        StorageHandler.instance.toggleGroupTabVisibility(groupTab);
        tabs.show(groupTab.innerTabs);
      }
    },
    [groupTab]
  );

  const handleEditGroupTabName = useCallback(
    async (newName: string) => {
      await StorageHandler.instance.updateGroupTabName(groupTab!, newName);
      loadGroupTab();
    },
    [groupTab]
  );

  const { dialog, openDialog } = useGroupTabNameDialog(
    "Edit Group tab name",
    "Please enter the Group tab's new name",
    handleEditGroupTabName
  );

  const icon = useMemo(() => {
    // Icon isn't always loaded
    if (groupTabInfo?.favIconUrl) {
      return groupTabInfo.favIconUrl;
    }

    // Default icon
    return ICON_URL;
  }, [groupTabInfo]);

  return (
    <>
      {dialog}
      <ListItem
        role={undefined}
        dense
        divider
        secondaryAction={
          <IconButton
            edge="end"
            aria-label="edit"
            onClick={() => {
              //TODO fix me
              openDialog(groupTab?.name);
            }}
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
        <ListItemButton
          disabled={!groupTab || groupTab.innerTabs.length === 0}
          onClick={() => {
            handleToggleGroup();
          }}
        >
          <ListItemText
            primary={
              groupTab
                ? `${groupTab.name} (${groupTab.innerTabs.length})`
                : "Group Tab"
            }
          />

          {groupTab &&
            groupTab.innerTabs.length > 0 &&
            (isSubListOpen ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
      </ListItem>

      <Collapse in={isSubListOpen} sx={{ paddingLeft: 4 }}>
        <List dense>
          {groupTab?.innerTabs.map((value) => {
            return (
              <InnerTabItem
                key={value}
                tabID={value}
                onRemoveInnerTab={handleRemoveInnerTab}
                onTabClick={handleGoToInnerTab}
              />
            );
          })}
        </List>
      </Collapse>
    </>
  );
});
