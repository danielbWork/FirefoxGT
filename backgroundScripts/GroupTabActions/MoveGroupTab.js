import { GroupTab } from "../GroupTab.js";
import { getGroupTabByID } from "../StorageHandler.js";
import { onStopDragging } from "./GroupTabOnClick.js";

/**
 * Handles setup code for moving group tabs and their inner tabs
 */
export function setupMoveGroupTab() {
  browser.tabs.onMoved.addListener(async (tabId, moveInfo) => {
    let groupTab = await getGroupTabByID(tabId);

    if (groupTab) {
      onGroupTabMove(groupTab, moveInfo);
    }
  });
}

/**
 *  Moves the inner tabs to follow the group tab
 * @param {GroupTab} groupTab The group tab that was moved
 * @param {} moveInfo Info regarding moving the group tab
 */
async function onGroupTabMove(groupTab, moveInfo) {
  // Block infinite loop
  if (moveInfo.toIndex === moveInfo.fromIndex + groupTab.innerTabs.length) {
    return;
  }

  try {
    // Moves the group tab as well to block cases of inner tabs taking it's place
    const allTabs = [groupTab.id].concat(groupTab.innerTabs);

    const result = await browser.tabs.move(allTabs, {
      index: moveInfo.toIndex,
    });

    console.log(result);

    await onStopDragging(groupTab);
  } catch (error) {
    console.log(error);
  }
}
