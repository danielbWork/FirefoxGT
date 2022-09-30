import { EDIT_GROUP_TAB_NAME_ID } from "../../Consts.js";
import {
  getGroupTabByID,
  storageNotifier,
  updateGroupTabName,
} from "../../Storage/StorageHandler.js";
import { GroupTab } from "../GroupTab.js";

export function setupEditHandler() {
  storageNotifier.onEditTab.addListener(onGroupTabEdit);
  storageNotifier.onAddTab.addListener(onInnerTabEdit);
  storageNotifier.onRemoveTab.addListener(onInnerTabEdit);

  browser.contextMenus.onClicked.addListener(onEditNameMenuClick);
}

/**
 * Handles updating group tab info in ui
 * @param {GroupTab} groupTab The group tab that we want to update
 */
async function onGroupTabEdit(groupTab) {
  await browser.tabs.reload(groupTab.id);
}

/**
 * Checks if the inner tab was added/removed from the group tab and updates it accordingly
 * @param {GroupTab} groupTab The group tab that was edited
 * @param {number | undefined} innerTab index or id of the inner tab that was updated
 */
async function onInnerTabEdit(groupTab, index) {
  // Does this check because 0 is false
  if (index !== undefined) {
    await onGroupTabEdit(groupTab);
  }
}

/**
 * Handles renaming the group tab
 * @param {*} info The info regarding the tab that was pressed
 * @param {*} tab The group tab that the user wants to rename
 */
async function onEditNameMenuClick(info, tab) {
  // Exists if not relevant
  if (info.menuItemId !== EDIT_GROUP_TAB_NAME_ID) return;

  const groupTab = await getGroupTabByID(tab.id);

  const editPrompt = `prompt("Please enter the Group tab's new name", "${groupTab.name}");`;

  const results = await browser.tabs.executeScript({ code: editPrompt });

  // TODO Use pop up instead
  // Checks if user is in special tab
  if (!results || results[0] === undefined) {
    browser.notifications.create({
      type: "basic",
      // TODO Add Icon
      title: "Create Failed",
      message:
        "Can't edit in this tab as it is blocked by firefox, please move to another tab and try again",
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

  await updateGroupTabName(groupTab, results[0]);
}
