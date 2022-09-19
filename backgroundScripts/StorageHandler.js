import { GroupTab } from "./GroupTab.js";

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
export function setUpStorage() {
  updateAllGroupTabs({});
}

/**
 * Gets the group tab from the storage with the id, or undefined if it doesn't exist
 * @param {number} id The id of the group
 * @returns {GroupTab?} the group tab belonging to the id or undefined if it doesn't exist
 */
export async function getGroupTabByID(id) {
  const groupTabs = await getAllGroupTabs();
  return groupTabs[id];
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
 * @param {number[]} innerTabs The new group tab
 *
 * @throws Error when user adds a group tab that was already in the list
 */
export async function addGroupTab(id, innerTabs) {
  let groupTabs = await getAllGroupTabs();

  if (groupTabs[id]) {
    throw "Invalid group tab ID, already exists";
  }

  groupTabs[id] = new GroupTab(id, innerTabs);

  await updateAllGroupTabs(groupTabs);
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
    delete groupTabs[id];
    await updateAllGroupTabs(groupTabs);
  }
  // Checks inner tabs as well
  else {
    const groupTab = Object.values(groupTabs).find((group) => {
      return group.innerTabs.includes(id);
    });

    // Updates the group tab
    if (groupTab) {
      // Removes the deleted inner tab
      groupTab.innerTabs = groupTab.innerTabs.filter((tabId) => tabId !== id);

      groupTabs[groupTab.id] = groupTab;
      await updateAllGroupTabs(groupTabs);
    }
  }
}

//#endregion
