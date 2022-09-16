import {
  INNER_TAB_LIST_KEY,
  IS_HIDING_KEY,
  GROUP_TAB_LIST_KEY,
} from "/background_scripts/Consts.js";

/**
 * Handles setup code for handliing group tab click
 */
export function setupGroupTabOnClick() {
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      let groupTablist = await browser.sessions.getWindowValue(
        activeInfo.windowId,
        GROUP_TAB_LIST_KEY
      );

      if (groupTablist.includes(activeInfo.tabId)) {
        onGroupTabClick(activeInfo.tabId, activeInfo.previousTabId);
      }
    } catch (error) {
      console.log({ error, activeInfo });
    }
  });
}

/**
 *  Reacts to user clicking the group id and either hides or show's the tab's inside the group appropriatly
 * @param {number} groupTabID The id of the group tab
 * @param {number} previousTabId The id of the previously active tab
 */
async function onGroupTabClick(groupTabID, previousTabId) {
  const tabList = await browser.sessions.getTabValue(
    groupTabID,
    INNER_TAB_LIST_KEY
  );
  const isHidden = await browser.sessions.getTabValue(
    groupTabID,
    IS_HIDING_KEY
  );

  if (isHidden) {
    await browser.tabs.show(tabList);
  } else {
    await browser.tabs.hide(tabList);
  }

  await browser.tabs.update(previousTabId, { active: true });

  await browser.sessions.setTabValue(groupTabID, IS_HIDING_KEY, !isHidden);
}
