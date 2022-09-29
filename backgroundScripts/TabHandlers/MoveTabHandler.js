import { GroupTab } from "../GroupTab.js";
import {
  addInnerTab,
  getAllGroupTabIDs,
  getGroupTabByID,
  getGroupTabOrInnerTabByID,
  removeInnerTab,
  removeTabFromStorage,
  toggleGroupTabVisibility,
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
  browser.tabs.onMoved.addListener(onTabMoved);

  browser.contextMenus.onClicked.addListener(onMoveInnerTabMenuItemClick);
}

//#region Listeners

/**
 * Identifies which type of tab was moved and calls appropriate code
 * @param {number} tabId Id of the tab that was moved
 * @param {*} moveInfo Info regarding the tab movement
 */
async function onTabMoved(tabId, moveInfo) {
  let { groupTab, index } = await getGroupTabOrInnerTabByID(tabId);

  if (groupTab) {
    if (index !== undefined) {
      onInnerTabMove(groupTab, index, moveInfo);
    } else {
      onGroupTabMove(groupTab, moveInfo);
    }
  } else {
    onMoveIntoGroupTab(tabId, moveInfo);
  }
}

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

    await addTabToGroupMenuClick(parseInt(groupID), tab.id);
    return;
  }

  // All other actions should only be for inner tab
  const { groupTab, index } = await getGroupTabOrInnerTabByID(tab.id);

  if (!groupTab || index === undefined) return;

  // Checks tab was moved to other group
  if (info.menuItemId.startsWith(MOVE_TO_GROUP_TAB_ID)) {
    const newGroupID = info.menuItemId.substring(MOVE_TO_GROUP_TAB_ID.length);
    moveTabFromGroupToNewGroupMenuClick(groupTab, index, parseInt(newGroupID));
  }
  // Check tabs was moved outside of group
  else if (info.menuItemId === REMOVE_FROM_GROUP_TAB_ID) {
    await removeTabFromGroupMenuClick(groupTab, tab.id);
  }
}

//#endregion

//#region Utils

/**
 * Moves the group the tab and it's inner tab to a new location
 *
 * @param {GroupTab} groupTab The group tab we move
 * @param {number} index The index we move the group tab to
 * @param {number[] | undefined} additionalTab other tabs to that should be moved after the group
 */
async function moveGroupTab(groupTab, index, additionalTab) {
  const endingTabs = additionalTab || [];

  // Makes sure that move keeps the order of the group
  const allTabs = [groupTab.id, ...groupTab.innerTabs, ...endingTabs];

  await browser.tabs.move(allTabs, {
    index: index,
  });
}

/**
 * Checks to see if the inner tab was put inside a group tab
 * @param {number} index The index an inner tab was moved to
 *
 * @returns {{groupTab : GroupTab| undefined, groupTabInfo : Tab| undefined }} The group tab and it's info that the index is a part of (can return undefined vars if not in a group)
 */
async function checkMovedIntoGroupTab(index) {
  const groupTabPromises = [];

  const groupTabIDs = await getAllGroupTabIDs();

  groupTabIDs.forEach((id) => {
    const checkIsInRange = async (id) => {
      // Get's all info we need
      const [groupTab, groupTabInfo] = await Promise.all([
        getGroupTabByID(id),
        browser.tabs.get(id),
      ]);

      // Checks if was put between group tabs
      return index > groupTabInfo.index && // min
        index <= groupTabInfo.index + groupTab.innerTabs.length // max
        ? { groupTab, groupTabInfo }
        : undefined;
    };

    groupTabPromises.push(checkIsInRange(parseInt(id)));
  });

  // Find valid group tab if exists
  const result = await Promise.all(groupTabPromises);
  const groupTabValues = result.find((value) => {
    return value !== undefined;
  });

  if (groupTabValues) return groupTabValues;

  return { groupTab: undefined, groupTabInfo: undefined };
}

//#endregion

//#region OnTabMove

/**
 *  Moves the inner tabs to follow the group tab
 * @param {GroupTab} groupTab The group tab that was moved
 * @param {} moveInfo Info regarding moving the group tab
 */
async function onGroupTabMove(groupTab, moveInfo) {
  try {
    await moveGroupTab(groupTab, moveInfo.toIndex);
    await onStopDragging(groupTab);
  } catch (error) {
    console.log(error);
  }
}

/**
 * Handles user moving tab inside of the group tab area
 * @param {number} tabId Id of the tab that was moved
 * @param {*} moveInfo Info regarding the tab movement
 */
async function onMoveIntoGroupTab(tabId, moveInfo) {
  const { groupTab, groupTabInfo } = await checkMovedIntoGroupTab(
    moveInfo.toIndex
  );

  if (groupTab && groupTabInfo) {
    // TODO Add dialog asking user if they are sure

    const movedTabInfo = await browser.tabs.get(tabId);

    addInnerTab(groupTab, tabId, moveInfo.toIndex - groupTabInfo.index - 1);

    await browser.notifications.create({
      type: "basic",
      // TODO Add Icon
      title: "Tab Moved",
      message: `Tab ${movedTabInfo.title} was moved to group tab ${groupTab.name}`,
    });
  }
}

//#region Inner Tab Move

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
    await onReorderInGroupTab(groupTab, groupTabInfo.index, index, moveInfo);
    return;
  }

  const { groupTab: newGroupTab, groupTabInfo: newGroupTabInfo } =
    await checkMovedIntoGroupTab(moveInfo.toIndex);

  if (newGroupTab && newGroupTabInfo) {
    await onMoveFromOneGroupToOther(
      groupTab,
      groupTabInfo,
      index,
      newGroupTab,
      newGroupTabInfo,
      moveInfo
    );

    return;
  }

  await onRemoveTabFromGroup(groupTab, groupTabInfo, index);
}

/**
 *
 * Moves the inner tab to a new location in the group tab
 *
 * @param {GroupTab} groupTab The group tab who has the inner tab move
 * @param {number} groupTabIndex The index of the group tab in the browser
 * @param {number} innerTabIndex The index of the inner tab in the group tab
 * @param {} moveInfo The moveInfo regarding the inner tab
 */
async function onReorderInGroupTab(
  groupTab,
  groupTabIndex,
  innerTabIndex,
  moveInfo
) {
  const tabId = groupTab.innerTabs[innerTabIndex];

  const newIndex = moveInfo.toIndex - groupTabIndex - 1;

  // Removes and readds the id in the correct location
  groupTab.innerTabs.splice(innerTabIndex, 1);
  groupTab.innerTabs.splice(newIndex, 0, tabId);

  await updateGroupTab(groupTab);
}

/**
 *
 * Moves the inner tab to a to the new group tab
 *
 * @param {GroupTab} groupTab The group tab who originally had the inner tab
 * @param {Tab} groupTabInfo The tab info regarding the group tab
 * @param {number} innerTabIndex The index of the inner tab in the original group tab
 * @param {GroupTab} newGroupTab The group tab who is going to hold the inner tab
 * @param {Tab} newGroupTabInfo The tab info regarding the new group tab
 * @param {*} moveInfo The moveInfo regarding the inner tab
 */
async function onMoveFromOneGroupToOther(
  groupTab,
  groupTabInfo,
  innerTabIndex,
  newGroupTab,
  newGroupTabInfo,
  moveInfo
) {
  const movedTabInfo = await browser.tabs.get(
    groupTab.innerTabs[innerTabIndex]
  );

  const moveConfirm = `confirm("Are you sure you want to move tab ${movedTabInfo.title} from group ${groupTab.name} to group ${newGroupTab.name}?")`;

  const results = await browser.tabs.executeScript(movedTabInfo.id, {
    code: moveConfirm,
  });

  console.log(results);

  if (results[0]) {
    await removeInnerTab(groupTab, movedTabInfo.id);

    // Adds it temporarily to the end so it can be reordered
    newGroupTab.innerTabs.push(movedTabInfo.id);

    await onReorderInGroupTab(
      newGroupTab,
      newGroupTabInfo.index,
      newGroupTab.innerTabs.length - 1,
      moveInfo
    );

    await browser.notifications.create({
      type: "basic",
      // TODO Add Icon
      title: "Tab Moved",
      message: `Tab ${movedTabInfo.title} was moved to group tab ${newGroupTab.name}`,
    });
  } else {
    // Resets the inner tab inside the group tab
    moveGroupTab(groupTab, groupTabInfo.index);
  }
}

/**
 *
 * ASks user if they are sure they want to remove the inner tab from group
 *
 * @param {GroupTab} groupTab The group tab who originally had the inner tab
 * @param {*} groupTabInfo The tab info regarding the group tab
 * @param {*} innerTabIndex The index of the inner tab in the group tab
 */
async function onRemoveTabFromGroup(groupTab, groupTabInfo, innerTabIndex) {
  const movedTabInfo = await browser.tabs.get(
    groupTab.innerTabs[innerTabIndex]
  );

  const removeConfirm = `confirm("Are you sure you want remove tab ${movedTabInfo.title} from group ${groupTab.name}?")`;

  const results = await browser.tabs.executeScript(movedTabInfo.id, {
    code: removeConfirm,
  });

  console.log(results);

  if (results[0]) {
    await removeInnerTab(groupTab, movedTabInfo.id);

    await browser.notifications.create({
      type: "basic",
      // TODO Add Icon
      title: "Tab Removed",
      message: `Tab ${movedTabInfo.title} was removed from group tab ${groupTab.name}`,
    });
  } else {
    // Resets the inner tab inside the group tab
    moveGroupTab(groupTab, groupTabInfo.index);
  }
}

//#endregion

//#endregion

//#region OnMenuItemClick

/**
 * Moves the inner tab from the group and puts it  in the new group
 * @param {number} groupId The id of the group we want to move the tab to
 * @param {number} tabId The id of the tab we want to move
 */
async function addTabToGroupMenuClick(groupId, tabId) {
  const groupTab = await getGroupTabByID(groupId);

  await addInnerTab(groupTab, tabId);

  const groupTabInfo = await browser.tabs.get(groupId);

  await moveGroupTab(groupTab, groupTabInfo.index);
}

/**
 * Moves the inner tab from the group and puts it in the new group
 *
 *
 * @param {GroupTab} groupTab The group tab that contains the inner tab
 * @param {number} index The index of the inner tab we want to move
 * @param {number} newGroupId The id of the group we want to move the tab to
 */
async function moveTabFromGroupToNewGroupMenuClick(
  groupTab,
  index,
  newGroupId
) {
  const movedTabID = groupTab.innerTabs[index];

  await removeInnerTab(groupTab, movedTabID);

  // Moves the inner tab to the group
  await addTabToGroupMenuClick(newGroupId, movedTabID);
}

/**
 * Removes the inner tab from the group and puts it outside the group
 * @param {GroupTab} groupTab The group tab that contains the inner tab
 * @param {number} id The id of the inner tab we want to remove from the group in the group tab
 */
async function removeTabFromGroupMenuClick(groupTab, id) {
  await removeInnerTab(groupTab, id);

  // Gets groupTab now after it's value was updated
  const updatedGroupTab = await getGroupTabByID(groupTab.id);
  const groupTabInfo = await browser.tabs.get(updatedGroupTab.id);

  // Makes sure that move keeps the order of the group and put removed tab outside of it

  await moveGroupTab(updatedGroupTab, groupTabInfo.index, [id]);
}

//#endregion
