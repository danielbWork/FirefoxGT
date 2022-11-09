import { StorageHandler } from "../../utils/Storage/StorageHandler";
import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import browser from "webextension-polyfill";
import { Container } from "@mui/material";
import { GroupTab } from "../../utils/GroupTab";
import { InvalidGroupTab } from "./InvalidGroupTab";
import { useOnMount } from "../../utils/ui/useOnMount";
import { ICON_URL } from "../../utils/Consts";
import { GroupTabGrid } from "./GroupTabGrid";
import { CustomThemeProvider } from "../../utils/ui/CustomThemeProvider";
import { UIMessageHandler } from "../../utils/ui/UIMessageHandler";

const App = () => {
  const [groupTab, setGroupTab] = useState<GroupTab>();

  useOnMount(() => {
    browser.tabs.getCurrent().then(async (tab) => {
      await StorageHandler.instance.loadStorage();
      UIMessageHandler.instance.setupMessageHandler();

      const groupTab = StorageHandler.instance.getGroupTabByID(tab.id!);
      setGroupTab(groupTab);
    });
  });

  // Updates group tab title and icon
  useEffect(() => {
    if (!groupTab) return;

    const settings = StorageHandler.instance.settings;

    const innerTabsCountString = `(${groupTab.innerTabs.length})`;
    // const isOpenString = `${groupTab.isOpen ? "\u{3009}" : "\u{2304}"}`;

    let prefix = `${
      settings.innerTabCountInName === "prefix" ? innerTabsCountString : ""
    }`;
    let postfix = `${
      settings.innerTabCountInName === "postfix" ? innerTabsCountString : ""
    }`;

    document.title = `${prefix} ${groupTab.name} ${postfix}`.trim();

    // Handles custom icons, otherwise get's official icon
    // Uses manifest as url doesn't work
    const favIcon = groupTab.icon || browser.runtime.getURL(ICON_URL);

    // Creates the element here to make the ui updates cleaner
    const iconElement = document.createElement("link");
    iconElement.id = "favicon";
    iconElement.rel = "shortcut icon";
    iconElement.href = favIcon;

    const oldIcon = document.getElementById("favicon");

    // Reloads icon
    if (oldIcon) {
      document.head.removeChild(oldIcon);
    }
    document.head.appendChild(iconElement);
  }, [groupTab]);

  return (
    <CustomThemeProvider>
      <Container sx={{ width: "100%", height: "100%" }}>
        {groupTab ? <GroupTabGrid groupTab={groupTab} /> : <InvalidGroupTab />}
      </Container>
    </CustomThemeProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
