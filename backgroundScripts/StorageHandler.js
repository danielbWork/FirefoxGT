//#region Util Functions

/**
 * Util to make it easier to get group tabs
 * @returns The group tabs
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
  console.log(groupTabs);

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
 * @returns {{innerTabs: string, isHidingTabs: boolean}} the group tab belonging to the id or undefined if it doesn't exist
 */
export async function getGroupTabByID(id) {
  const groupTabs = await getAllGroupTabs();
  return groupTabs[id];
}

//#endregion

//#region Create Group Tab

/**
 *  Adds a the new group tab to the group tab list
 *
 * @param {number} id The id of the group tab
 * @param {{innerTabs: string, isHidingTabs: boolean}} groupTab The new group tab
 *
 * @throws Error when user adds a group tab that was already in the list
 */
export async function addGroupTab(id, groupTab) {
  let groupTabs = await getAllGroupTabs();

  if (groupTabs[id]) {
    throw "Invalid group tab ID, already exists";
  }

  groupTabs[id] = groupTab;

  await updateAllGroupTabs(groupTabs);
}

//#endregion

//#region Edit Group Tab

/**
 * Updates the group tab value in the storage
 * @param {number} id The id of the group tab
 * @param {{innerTabs: string, isHidingTabs: boolean}} newGroupTab The new value for the group tab
 *
 * @throws Error when user attempts to update a group tab that doesn't exists
 */
export async function updateGroupTab(id, newGroupTab) {
  let groupTabs = await getAllGroupTabs();

  if (!groupTabs[id]) {
    throw "Invalid group tab id no such group";
  }

  groupTabs[id] = newGroupTab;

  await updateAllGroupTabs(groupTabs);
}

/**
 * Toggles the group tab's isHidingTabs value
 * @param {number} id The id of the group tab
 * @param {{innerTabs: string, isHidingTabs: boolean}} groupTab The group tab we update
 *
 * @throws Error when user attempts to update a group tab that doesn't exists
 */
export async function toggleGroupTabVisibility(id, groupTab) {
  groupTab.isHidingTabs = !groupTab.isHidingTabs;
  await updateGroupTab(id, groupTab);
}

//#endregion

//#region Remove Group Tab

/**
 * Sets the value of the group tab in the storage as undefined
 * @param {number} id The Id of the group tab
 */
export async function deleteGroupTab(id) {
  let groupTabs = await getAllGroupTabs();

  // If group tab doesn't exist does nothing
  if (groupTabs[id]) {
    delete groupTabs[id];
    await updateAllGroupTabs(groupTabs);
  }
}

//#endregion
