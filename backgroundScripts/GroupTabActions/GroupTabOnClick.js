import { getGroupTabByID, toggleGroupTabVisibility } from "./StorageManager.js";

/**
 * Handles setup code for handling group tab click
 */
export function setupGroupTabOnClick() {
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      let groupTab = await getGroupTabByID(activeInfo.tabId);

      if (groupTab) {
        onGroupTabClick(activeInfo.tabId, groupTab, activeInfo.previousTabId);
      }
    } catch (error) {
      console.log({ error, activeInfo });
    }
  });
}

/**
 *  Reacts to user clicking the group tabs and either hides or shows the tabs inside the group appropriately
 * @param {number} groupTabID The id of the group tab
 * @param {innerTabs: string, isHidingTabs: boolean} groupTab The actual group tab
 * @param {number} previousTabId The id of the previously active tab
 */
async function onGroupTabClick(groupTabID, groupTab, previousTabId) {
  console.log("onGroupTabClick");

  if (groupTab.isHidingTabs) {
    await browser.tabs.show(groupTab.innerTabs);
  } else {
    await browser.tabs.hide(groupTab.innerTabs);
  }

  await browser.tabs.update(previousTabId, { active: true });

  toggleGroupTabVisibility(groupTabID, groupTab);
}
