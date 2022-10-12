import { StorageHandler } from "../../utils/Storage/StorageHandler";
import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom/client";
import browser from "webextension-polyfill";
import { Container } from "@mui/material";
import { GroupTab } from "utils/GroupTab";
import { InvalidGroupTab } from "./InvalidGroupTab";
import { useOnMount } from "../../utils/ui/useOnMount";

const App = () => {
  const [groupTab, setGroupTab] = useState<GroupTab>();

  useOnMount(() => {
    browser.tabs.getCurrent().then(async (tab) => {
      const groupTab = await StorageHandler.instance.getGroupTabByID(tab.id!);

      if (groupTab) {
        document.title = `${groupTab.name} (${groupTab.innerTabs.length})`;

        // Handles custom icons, otherwise get's official icon
        const favIcon =
          groupTab.icon || browser.runtime.getManifest().icons![48];

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

        setGroupTab(groupTab);
      }
    });
  });

  return (
    <Container maxWidth="sm">{!groupTab && <InvalidGroupTab />}</Container>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
