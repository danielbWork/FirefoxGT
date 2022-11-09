import { Avatar, ImageList, Stack, Typography } from "@mui/material";
import React, { useCallback } from "react";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import browser, { tabs } from "webextension-polyfill";
import { GroupTab } from "../../utils/GroupTab";
import { InnerTabGridItem } from "./InnerTabGridItem";
import { ICON_URL } from "../../utils/Consts";

type Props = {
  /**
   * The group tab we display the ui of
   */
  groupTab: GroupTab;
};

/**
 * Grid displaying the group tab
 */
export const GroupTabGrid = ({ groupTab }: Props) => {
  const handleOnInnerTabClick = useCallback(
    async (id: number) => {
      if (!groupTab.isOpen) {
        await StorageHandler.instance.toggleGroupTabVisibility(groupTab);
      }

      tabs.update(id, { active: true });
    },
    [groupTab]
  );

  if (!groupTab.innerTabs.length) {
    return (
      <Typography variant="h1" color="WindowText" align="center">
        Empty Group Tab
      </Typography>
    );
  }
  // TODO Fix title based on setting

  return (
    <Stack spacing={2} sx={{ padding: 4, width: "100%", height: "100%" }}>
      <Typography
        variant="h3"
        color="WindowText"
        justifyContent="center"
        display="flex"
      >
        <Avatar
          src={groupTab.icon || browser.runtime.getURL(ICON_URL)}
          sx={{ width: 48, height: 48, marginRight: 2 }}
        />
        {`${groupTab.name}:`}
      </Typography>
      <ImageList sx={{ width: "100%", height: "100%" }} cols={3} gap={10}>
        {groupTab.innerTabs.map((id) => {
          return (
            <InnerTabGridItem
              key={id}
              id={id}
              onTabClickListener={handleOnInnerTabClick}
            />
          );
        })}
      </ImageList>
    </Stack>
  );
};
