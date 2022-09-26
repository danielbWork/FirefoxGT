import { GroupTab } from "../backgroundScripts/GroupTab.js";
import {
  onAddTabNotifier,
  onEditGroupTabNotifier,
  onRemoveTabNotifier,
} from "./StorageEventListeners.js";

//#region Notifiers

function StorageNotifier() {
  /**
   *  Notifies about group and inner tabs being added
   */
  this.onAddTab = new onAddTabNotifier();

  /**
   *  Notifies about group and inner tabs being removed
   */
  this.onRemoveTab = new onRemoveTabNotifier();

  /**
   *  Notifies about group tabs being edited
   */
  this.onEditTab = new onEditGroupTabNotifier();
}

export const storageNotifier = new StorageNotifier();

//#endregion

//#region Util Functions

/**
 * Util to make it easier to get group tabs
 * @returns {} The group tabs
 */
async function getAllGroupTabs() {
  let { groupTabs } = await browser.storage.local.get("groupTabs");
  return groupTabs;
}

/**
 * Util to make it easier to update group tabs
 * @param {} groupTabs The group tabs we want to set in the storage
 */
async function updateAllGroupTabs(groupTabs) {
  await browser.storage.local.set({ groupTabs });
}

/**
 *  Sets up storage default values
 */
export function setupStorage() {
  updateAllGroupTabs({});
}

/**
 * Gets the group tab from the storage with the id, or undefined if it doesn't exist
 * @param {number} id The id of the tab
 * @returns {GroupTab | undefined} the group tab belonging to the id or undefined if it doesn't exist
 */
export async function getGroupTabByID(id) {
  const groupTabs = await getAllGroupTabs();
  return groupTabs[id];
}

/**
 * Goes over the group tabs and checks to see if the id is either theirs or one of the inner tabs
 * @param {number} id The id of the tab
 * @returns {{groupTab: GroupTab | undefined, index: number| undefined}} Object holding group tab with the id or if the
 *  id belongs to a inner tab then the object returns the index of the inner tab as well as the group tab
 */
export async function getGroupTabOrInnerTabByID(id) {
  const groupTabs = await getAllGroupTabs();

  if (groupTabs[id]) {
    return { groupTab: groupTabs[id] };
  }

  // Finds the group tab with the problem index
  const groupTab = Object.values(groupTabs).find((group) => {
    return group.innerTabs.includes(id);
  });

  // No group tab or inner tab with this id
  if (!groupTab) {
    return {};
  }

  const index = groupTab.innerTabs.indexOf(id);

  return { groupTab, index };
}

/**
 * Gets all the ids of the group tabs.
 * @returns An array of all the group tab ids
 */
export async function getAllGroupTabIDs() {
  const groupTabs = await getAllGroupTabs();
  return Object.keys(groupTabs);
}

//#endregion

//#region Create Group Tab

/**
 *  Adds a the new group tab to the group tab list
 *
 * @param {number} id The id of the group tab
 * @param {string} name The name of the group tab
 * @param {number[]} innerTabs The new group tab
 *
 * @throws Error when user adds a group tab that was already in the list
 */
export async function addGroupTab(id, name, innerTabs) {
  let groupTabs = await getAllGroupTabs();

  if (groupTabs[id]) {
    throw "Invalid group tab ID, already exists";
  }

  const newGroupTab = new GroupTab(id, name, innerTabs);

  groupTabs[id] = newGroupTab;

  await updateAllGroupTabs(groupTabs);

  storageNotifier.onAddTab.addedGroupTab(newGroupTab);
}

//#endregion

//#region Edit Group Tab

/**
 * Updates the group tab value in the storage
 * @param {GroupTab} newGroupTab The new value for the group tab
 *
 * @throws Error when user attempts to update a group tab that doesn't exists
 */
export async function updateGroupTab(newGroupTab) {
  let groupTabs = await getAllGroupTabs();

  const id = newGroupTab.id;

  if (!groupTabs[id]) {
    throw "Invalid group tab id no such group";
  }

  groupTabs[id] = newGroupTab;

  await updateAllGroupTabs(groupTabs);
}

/**
 * Toggles the group tab's isHidingTabs value
 * @param {GroupTab} groupTab The group tab we update
 *
 * @throws Error when user attempts to update a group tab that doesn't exists
 */
export async function toggleGroupTabVisibility(groupTab) {
  groupTab.isOpen = !groupTab.isOpen;
  await updateGroupTab(groupTab);

  storageNotifier.onEditTab.editedGroupTab(groupTab);
}

/**
 * Adds an inner tab to the group tab
 * @param {GroupTab} groupTab The group tab we add the id to
 * @param {number} innerTabID The id of the new inner tab
 */
export async function addInnerTab(groupTab, innerTabID) {
  groupTab.innerTabs = [...groupTab.innerTabs, innerTabID];

  updateGroupTab(groupTab);

  storageNotifier.onAddTab.addedInnerTab(
    groupTab,
    groupTab.innerTabs.length - 1
  );
}

//#endregion

//#region Remove Group Tab

/**
 * Sets the value of the group tab (or inner tab) in the storage as undefined
 * @param {number} id The Id of the tab that was removed
 *
 */
export async function removeTabFromStorage(id) {
  let groupTabs = await getAllGroupTabs();

  // If group tab doesn't exist does nothing
  if (groupTabs[id]) {
    const removedGroupTab = groupTabs[id];

    delete groupTabs[id];
    await updateAllGroupTabs(groupTabs);

    storageNotifier.onRemoveTab.removedGroupTab(removedGroupTab);
  }
  // Checks inner tabs as well
  else {
    const { groupTab, index } = await getGroupTabOrInnerTabByID(id);

    // Updates the group tab
    if (groupTab) {
      // Removes the deleted inner tab
      const removed = groupTab.innerTabs.splice(index, 1);

      groupTabs[groupTab.id] = groupTab;
      await updateAllGroupTabs(groupTabs);

      storageNotifier.onRemoveTab.removedInnerTab(groupTab, index);
    }
  }
}

//#endregion
