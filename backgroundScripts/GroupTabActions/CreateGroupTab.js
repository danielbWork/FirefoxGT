import { addGroupTab } from "../StorageManager.js";

/**
 * Handles setup for group tab creation
 */
export function setupCreate() {
  browser.contextMenus.onClicked.addListener(createGroupTab);
}

/**
 * Creates a group tab and sets it's info for the session
 * @param {*} info The info regarding the tab thet was pressed
 * @param {*} tab The tab that the user added to the gorup
 */
async function createGroupTab(info, tab) {
  // Makes sure we only add group tab when needed
  if (info.menuItemId !== "add-group-tab") {
    return;
  }

  const groupTab = await browser.tabs.create({
    // TODO Change url to local html file that show a list of the tabs
    url: "https://developer.mozilla.org/en-US/Add-ons/WebExtensions",
    index: tab.index,
    discarded: true,
    title: "test",
  });

  try {
    await addGroupTab(groupTab.id, {
      isHidingTabs: false,
      innerTabs: [tab.id],
    });
  } catch (error) {
    console.log({ error });
  }
}
