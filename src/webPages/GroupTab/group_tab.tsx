import { StorageHandler } from "../../utils/Storage/StorageHandler";
import React, { useEffect, useMemo, useState } from "react";
import ReactDOM from "react-dom";
import browser from "webextension-polyfill";
import { Container } from "@mui/material";
import { GroupTab } from "utils/GroupTab";
import { InvalidGroupTab } from "./InvalidGroupTab";

const App = () => {
  const [groupTab, setGroupTab] = useState<GroupTab>();

  useEffect(() => {
    browser.tabs.getCurrent().then(async (tab) => {
      const groupTab = await StorageHandler.instance.getGroupTabByID(tab.id!);

      if (groupTab) {
        document.title = `${groupTab.name} (${groupTab.innerTabs.length})`;
        setGroupTab(groupTab);
      }
    });
  }, []);

  return (
    <Container maxWidth="sm">{!groupTab && <InvalidGroupTab />}</Container>
  );
};

const newDiv = document.createElement("div");
newDiv.setAttribute("id", "content-app-root");
document.body.appendChild(newDiv);
ReactDOM.render(<App />, newDiv);
