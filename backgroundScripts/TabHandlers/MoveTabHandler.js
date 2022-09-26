import { GroupTab } from "../GroupTab.js";
import {
  addInnerTab,
  getGroupTabByID,
  getGroupTabOrInnerTabByID,
  removeTabFromStorage,
} from "../../Storage/StorageHandler.js";
import { onStopDragging } from "./OnTabClickHandler.js";

/**
 * Handles setup code for moving group tabs and their inner tabs
 */
export function setupMoveHandler() {
  browser.tabs.onMoved.addListener(async (tabId, moveInfo) => {
    let { groupTab, index } = await getGroupTabOrInnerTabByID(tabId);

    if (groupTab) {
      if (typeof index !== "undefined") {
        onInnerTabMove(groupTab, index, moveInfo);
      } else {
        onGroupTabMove(groupTab, moveInfo);
      }
    } else {
      onMoveInsideAGroupTab(tabId, moveInfo);
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

/**
 *  Handles user moving an inner tab to a new location
 * @param {GroupTab} groupTab The group tab who had an inner tab
 * @param {number} index The index of the inner tab in the group tab
 * @param {*} moveInfo The moveInfo regarding the inner tab
 */
async function onInnerTabMove(groupTab, index, moveInfo) {
  // Block infinite loop and non important movements
  if (moveInfo.toIndex === moveInfo.fromIndex) {
    return;
  }

  const groupTabInfo = await browser.tabs.get(groupTab.id);

  // Checks if the tab is inside of group range
  if (
    moveInfo.toIndex > groupTabInfo.index && // min
    moveInfo.toIndex <= groupTabInfo.index + groupTab.innerTabs.length // max
  ) {
    return;
  }

  const movedTabInfo = await browser.tabs.get(groupTab.innerTabs[index]);

  // TODO Add dialog asking user if they are sure
  await removeTabFromStorage(movedTabInfo.id);

  // Notifies user
  const removedAlert = `alert("Tab ${movedTabInfo.title} was removed from group tab ${groupTabInfo.title}")`;
  await browser.tabs.executeScript(movedTabInfo.id, { code: removedAlert });
}

/**
 * Handles user moving tab inside of the group tab area
 * @param {number} tabId Id of the tab that was moved
 * @param {*} moveInfo Info regarding the tab movement
 */
async function onMoveInsideAGroupTab(tabId, moveInfo) {
  const groupTabInfos = await browser.tabs.query({
    windowId: moveInfo.windowId,
    url: "moz-extension://*/group_tab.html*",
  });

  // Uses normal for since we need to exist loop once the tab was added
  for (const groupTabInfo of groupTabInfos) {
    // Only cares about group tabs that are before the moved tab id
    if (groupTabInfo.index > moveInfo.toIndex) continue;

    const groupTab = await getGroupTabByID(groupTabInfo.id);

    // Handles non group tabs with similar html schemes
    if (!groupTab) continue;

    // Checks if the tab was moved to inside a group
    if (groupTabInfo.index + groupTab.innerTabs.length >= moveInfo.toIndex) {
      // TODO Add dialog asking user if they are sure

      const movedTabInfo = await browser.tabs.get(tabId);

      addInnerTab(groupTab, tabId);

      // Notifies user
      const movedAlert = `alert("Tab ${movedTabInfo.title} was moved to group tab ${groupTabInfo.title}")`;
      await browser.tabs.executeScript(tabId, { code: movedAlert });

      break;
    }
  }
}
