import {
  GROUP_TAB_LIST_KEY,
  INNER_TAB_LIST_KEY,
  IS_HIDING_KEY,
} from "./Consts.js";

/**
 * Adds the context menu item for adding a group tabs
 */
function createConextMenuItems() {
  browser.contextMenus.create({
    id: "add-group-tab",
    title: "Put this tab in new group tab",
    contexts: ["tab"],
  });
}

/**
 * Handles setup for group tab creation
 */
export function setupCreate() {
  createConextMenuItems();

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

  // Set Group tab values
  await browser.sessions.setTabValue(groupTab.id, INNER_TAB_LIST_KEY, [tab.id]);
  await browser.sessions.setTabValue(groupTab.id, IS_HIDING_KEY, false);

  // Set Window's values regarding group tab
  await browser.sessions.setWindowValue(groupTab.windowId, GROUP_TAB_LIST_KEY, [
    groupTab.id,
  ]);
}
