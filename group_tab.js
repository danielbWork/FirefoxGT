import { getGroupTabByID } from "./Storage/StorageHandler.js";

/**
 * Updates the tab title to match the given values in the url
 */
async function handleTabTitle() {
  const tab = await browser.tabs.getCurrent();

  const groupTab = await getGroupTabByID(tab.id);

  // Incase this is called pre putting group tab in storage
  if (groupTab) {
    document.title = `${groupTab.name} (${groupTab.innerTabs.length})`;
  }

  // TODO upgrade to react/ typescript
}

handleTabTitle();
