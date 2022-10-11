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

        // Handles custom icons
        const favIcon = groupTab.icon || "/icons/group_tab_icon.png";
        document.getElementById("favicon")?.setAttribute("href", favIcon);

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
