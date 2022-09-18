/**
 *  Sets up storage default values
 */
export function setUpStorage() {
  browser.storage.local.set({ groupTabs: {} });
}

/**
 *  Adds a the new group tab to the group tab list
 *
 * @param {number} id The id of the group tab
 * @param {{innerTabs: string, isHidingTabs: boolean}} groupTab The new group tab
 *
 * @throws Error when user adds a group tab that was already in the list
 */
export async function addGroupTab(id, groupTab) {
  let { groupTabs } = await browser.storage.local.get("groupTabs");

  if (groupTabs[id]) {
    throw "Invalid group tab ID, already exists";
  }

  groupTabs[id] = groupTab;

  await browser.storage.local.set({ groupTabs });
}

/**
 * Gets the group tab from the storage with the id, or undefined if it doesn't exist
 * @param {number} id The id of the group
 * @returns {{innerTabs: string, isHidingTabs: boolean}} the group tab belonging to the id or undefined if it doesn't exist
 */
export async function getGroupTabByID(id) {
  let { groupTabs } = await browser.storage.local.get("groupTabs");
  return groupTabs[id];
}

/**
 * Updates the group tab value in the storage
 * @param {number} id The id of the group tab
 * @param {{innerTabs: string, isHidingTabs: boolean}} newGroupTab The new value for the group tab
 *
 * @throws Error when user attempts to update a group tab that doesn't exists
 */
export async function updateGroupTab(id, newGroupTab) {
  let { groupTabs } = await browser.storage.local.get("groupTabs");

  if (!groupTabs[id]) {
    throw "Invalid group tab id no such group";
  }

  groupTabs[id] = newGroupTab;

  await browser.storage.local.set({ groupTabs });
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
