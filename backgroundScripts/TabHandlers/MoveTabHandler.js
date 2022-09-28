import { GroupTab } from "../GroupTab.js";
import {
  addInnerTab,
  getGroupTabByID,
  getGroupTabOrInnerTabByID,
  removeTabFromStorage,
  updateGroupTab,
} from "../../Storage/StorageHandler.js";
import { onStopDragging } from "./OnTabClickHandler.js";
import {
  ADD_TO_GROUP_TAB_ID,
  MOVE_TO_GROUP_TAB_ID,
  REMOVE_FROM_GROUP_TAB_ID,
} from "../../Consts.js";

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

  browser.contextMenus.onClicked.addListener(onMoveInnerTabMenuItemClick);
}

//#region OnTabMove

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
    const allTabs = [groupTab.id, ...groupTab.innerTabs];

    await browser.tabs.move(allTabs, {
      index: moveInfo.toIndex,
    });

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

  // TODO add handling for moving from one group to other

  const groupTabInfo = await browser.tabs.get(groupTab.id);

  // Checks if the tab is inside of group range
  if (
    moveInfo.toIndex > groupTabInfo.index && // min
    moveInfo.toIndex <= groupTabInfo.index + groupTab.innerTabs.length // max
  ) {
    // TODO ADD sort inner tabs
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

//#endregion

//#region OnMenuItemClick

/**
 * Move the tabs based on which item was clicked
 * @param {*} info The info regarding the tab that was pressed
 * @param {*} tab The tab that the user wants to move
 */
async function onMoveInnerTabMenuItemClick(info, tab) {
  // Must have a tab for this action
  if (!tab) return;

  // Checks for new tab to add to group
  if (info.menuItemId.startsWith(ADD_TO_GROUP_TAB_ID)) {
    const groupID = info.menuItemId.substring(ADD_TO_GROUP_TAB_ID.length);

    addTabToGroup(parseInt(groupID), tab.id);
    return;
  }

  // All other actions should only be for inner tab
  const { groupTab, index } = await getGroupTabOrInnerTabByID(tab.id);

  // Only cares about inner tabs (does undefined check as !index returns true for index=0)
  if (!groupTab || index === undefined) return;

  // Finds which action was pressed
  if (info.menuItemId.startsWith(MOVE_TO_GROUP_TAB_ID)) {
    const newGroupID = info.menuItemId.substring(MOVE_TO_GROUP_TAB_ID.length);

    moveTabFromGroupToNewGroup(groupTab, index, parseInt(newGroupID));
  } else if (info.menuItemId === REMOVE_FROM_GROUP_TAB_ID) {
    removeTabFromGroup(groupTab, index, tab.id);
  }
}

/**
 * Moves the inner tab from the group and puts it  in the new group
 * @param {number} groupId The id of the group we want to move the tab to
 * @param {number} tabId The id of the tab we want to move
 */
async function addTabToGroup(groupId, tabId) {
  const groupTab = await getGroupTabByID(groupId);

  groupTab.innerTabs.push(tabId);
  await updateGroupTab(groupTab);

  const groupInfo = await browser.tabs.get(groupId);

  // Makes sure that move keeps the order of the group
  const allTabs = [groupId, ...groupTab.innerTabs];

  await browser.tabs.move(allTabs, {
    index: groupInfo.index,
  });
}

/**
 * Moves the inner tab from the group and puts it  in the new group
 * @param {GroupTab} groupTab The group tab that contains the inner tab
 * @param {number} index The index of the inner tab we want to move
 * @param {number} newGroupId The id of the group we want to move the tab to
 */
async function moveTabFromGroupToNewGroup(groupTab, index, newGroupId) {
  const movedTabID = groupTab.innerTabs.splice(index, 1)[0];

  await updateGroupTab(groupTab);

  // Moves the inner tab to the group
  await addTabToGroup(newGroupId, movedTabID);
}

/**
 * Removes the inner tab from the group and puts it outside the group
 * @param {GroupTab} groupTab The group tab that contains the inner tab
 * @param {number} index The index of the inner tab we want to remove from the group in the group tab
 */
async function removeTabFromGroup(groupTab, index) {
  const removedTabID = groupTab.innerTabs.splice(index, 1)[0];

  const groupTabInfo = await browser.tabs.get(groupTab.id);

  await updateGroupTab(groupTab);

  // Makes sure that move keeps the order of the group and put removed tab outside of it
  const allTabs = [groupTab.id, ...groupTab.innerTabs, removedTabID];

  await browser.tabs.move(allTabs, {
    index: groupTabInfo.index,
  });
}

//#endregion
