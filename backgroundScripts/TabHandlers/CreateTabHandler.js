import {
  CREATE_NEW_GROUP_TAB_ID,
  NAME_PARAM,
  OPEN_LINK_IN_NEW_GROUP_TAB_ID,
  TAB_COUNT_PARAM,
} from "../../Consts.js";
import { addGroupTab } from "../../Storage/StorageHandler.js";

/**
 * Handles setup for group tab creation
 */
export function setupCreateHandler() {
  browser.contextMenus.onClicked.addListener(onCreateGroupTabMenuClick);
}

/**
 * Creates a group tab with the given tab as it's inner tab
 * @param {*} info The info regarding the tab that was pressed
 * @param {*} tab The tab that the user added to the group
 */
async function onCreateGroupTabMenuClick(info, tab) {
  // Sends to appropriate create method
  if (info.menuItemId === CREATE_NEW_GROUP_TAB_ID) {
    addTabToGroupTab(tab);
  } else if (info.menuItemId === OPEN_LINK_IN_NEW_GROUP_TAB_ID) {
    openLinkInGroupTab(info.linkUrl, info.linkText, tab.index);
  }
}

/**
 * Creates a new group tab with the given tab as it's inner tab
 * @param {Tab} tab The tab that we add to group tab
 */
async function addTabToGroupTab(tab) {
  const groupTabTitle = await handleEnterGroupTabName(tab.title);

  // Incase something went wrong with input
  if (groupTabTitle) {
    handleGroupTabCreation(groupTabTitle, [tab.id], tab.index);
  }
}

/**
 * Create a new group tab with a new inner tab from the link
 *
 * @param {string} linkUrl The url of link of the to be inner tab
 * @param {string} linkText The text of the link we want to open
 * @param {number} index The location we want to put the group at
 */
async function openLinkInGroupTab(linkUrl, linkText, index) {
  const groupTabTitle = await handleEnterGroupTabName(linkText);

  // Incase something went wrong with input
  if (groupTabTitle) {
    const newTab = await browser.tabs.create({
      url: linkUrl,
      index: index + 1,
      active: false,
    });

    handleGroupTabCreation(groupTabTitle, [newTab.id], index + 1);
  }
}

/**
 * Requests the group tab name from the user
 * @returns {string | undefined} The group tab name or undefined if user chose or couldn't enter name
 */
async function handleEnterGroupTabName(defaultTitle = "Group Tab") {
  const createPrompt = `prompt("Please enter the Group tab's name", "${defaultTitle}" || "Group Tab");`;

  const results = await browser.tabs.executeScript({ code: createPrompt });

  console.log(results);

  // TODO Use pop up instead
  // Checks if user is in special tab
  if (!results || results[0] === undefined) {
    browser.notifications.create({
      type: "basic",
      // TODO Add Icon
      title: "Create Failed",
      message: "Can't create in this tab as it is blocked by firefox",
    });

    return;
  }

  // Checks if user chose to exit dialog
  if (results[0] === null) {
    return;
  }

  // Makes sure to block empty names
  if (results[0].trim() === "") {
    browser.notifications.create({
      type: "basic",
      // TODO Add Icon
      title: "Create Failed",
      message: "Can't create group tab with empty name",
    });

    return;
  }

  return results[0];
}

/**
 *  Handles the actual creation of the group tab
 * @param {string} name The name of the group tab defaults to "Group tab"
 * @param {number[]} innerTabs The id's of the inner tabs or just an empty array if nothing is passed
 * @param {number} index The index to put the group tab if nothing is passed then end of window
 */
async function handleGroupTabCreation(
  name = "Group tab",
  innerTabs = [],
  index = undefined
) {
  // Creates the group tab with the relevant info
  const groupTab = await browser.tabs.create({
    url: `/group_tab.html?${NAME_PARAM}=${name}&${TAB_COUNT_PARAM}=${innerTabs.length}`,
    index,
    active: false,
  });

  // Calls discard with delay to have the ui load up icon and title for tab
  setTimeout(() => {
    browser.tabs.discard(groupTab.id);
  }, 500);

  try {
    await addGroupTab(groupTab.id, name, innerTabs);
  } catch (error) {
    console.log({ error });
  }
}
