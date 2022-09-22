import { ADD_GROUP_TAB_ID } from "../Consts.js";
import { addGroupTab } from "../StorageHandler.js";

/**
 * Handles setup for group tab creation
 */
export function setupCreateHandler() {
  browser.contextMenus.onClicked.addListener(createGroupTab);
}

/**
 * Creates a group tab and sets it's info for the session
 * @param {*} info The info regarding the tab that was pressed
 * @param {*} tab The tab that the user added to the group
 */
async function createGroupTab(info, tab) {
  // Makes sure we only add group tab when needed
  if (info.menuItemId !== ADD_GROUP_TAB_ID) {
    return;
  }

  const groupTab = await browser.tabs.create({
    url: "/group_tab.html",
    index: tab.index,
    active: false,
  });

  // Calls discard with delay to have the ui load up icon and title for tab
  setTimeout(() => {
    browser.tabs.discard(groupTab.id);
  }, 100);

  try {
    await addGroupTab(groupTab.id, [tab.id]);
  } catch (error) {
    console.log({ error });
  }
}
