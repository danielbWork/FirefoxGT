import { GroupTab } from "../GroupTab.js";
import {
  getAllGroupTabIDs,
  getGroupTabByID,
  toggleGroupTabVisibility,
  updateGroupTab,
} from "../../Storage/StorageHandler.js";
import { TOGGLE_GROUP_TAB_ID } from "../../Consts.js";

/**
 * The timeout id used to mark how long until a tab click
 * should be seen as dragging the tab
 */
let draggingTimeout = undefined;

/**
 * The flag marking that the user is currently dragging the group tab
 */
let isDraggingFlag = false;

/**
 * Handles setup code for handling group tab click
 */
export function setupOnClickHandler() {
  browser.tabs.onActivated.addListener(onGroupTabActivated);
  browser.contextMenus.onClicked.addListener(onToggleContextMenu);
}

//#region Listeners

/**
 *  Reacts to user activating a tab, if tab is group tab toggles it on or off
 * @param {*} activeInfo The activation info
 */
async function onGroupTabActivated(activeInfo) {
  let groupTab = await getGroupTabByID(activeInfo.tabId);

  if (groupTab) {
    // Checks if currently dragging the tab
    if (draggingTimeout || isDraggingFlag) {
      if (draggingTimeout) {
        browser.tabs.hide(groupTab.innerTabs);
        isDraggingFlag = true;
      }

      findNewActiveTab(groupTab, activeInfo.previousTabId);
    } else {
      onGroupTabClick(groupTab, activeInfo.previousTabId);
    }
  }
}

/**
 * Toggles the group tab on visibility state
 * @param {*} info The info regarding the tab that was pressed
 * @param {*} tab The tab that the user added to the group
 */
async function onToggleContextMenu(info, tab) {
  if (info.menuItemId === TOGGLE_GROUP_TAB_ID) {
    const groupTab = await getGroupTabByID(tab.id);

    const activeTab = (await browser.tabs.query({ active: true }))[0];

    await onGroupTabClick(groupTab, activeTab.id);
  }
}

//#endregion

//#region Dragging tab

/**
 * Handles updating the group tab and inner tabs post dragging
 *
 * IMPORTANT: Should be called if whenever group tab was dragged.
 * @param {GroupTab} groupTab The group tab which was moved
 */
export async function onStopDragging(groupTab) {
  // Makes sure to only react to user stopping drag
  // This is mostly for stopping user using the context menu Move Tab option
  if (!isDraggingFlag) return;

  // Makes sure the inner tabs match group tab info
  // Awaits required to make sure the update won't cause issues
  if (groupTab.isOpen) {
    await browser.tabs.show(groupTab.innerTabs);
  } else {
    await browser.tabs.hide(groupTab.innerTabs);
  }

  isDraggingFlag = false;

  // Makes sure that we refresh out of the group tab
  await browser.tabs.update(groupTab.id, { active: true });
}

//#endregion

//#region Group Tab Click

/**
 *  Reacts to user clicking the group tabs and either hides or shows the tabs inside the group appropriately
 * @param {GroupTab} groupTab The group tab that was clicked
 * @param {number} previousTabId The id of tab this was moved from
 */
async function onGroupTabClick(groupTab, previousTabId) {
  // Checks whether to hide or show by doing opposite
  if (groupTab.isOpen) {
    await browser.tabs.hide(groupTab.innerTabs);
  } else {
    await browser.tabs.show(groupTab.innerTabs);
  }

  toggleGroupTabVisibility(groupTab);

  findNewActiveTab(groupTab, previousTabId);

  // Handles dragging timeout to recognize user dragging the tab
  clearTimeout(draggingTimeout);
  draggingTimeout = setTimeout(async () => {
    draggingTimeout = undefined;
  }, 100);
}

/**
 * Finds a valid tab to move to once the group is hidden, otherwise creates a new tab
 *
 * @param {GroupTab} groupTab The group tab that we want to move from
 * @param {number} previousTabId The id of tab this was moved from
 */
async function findNewActiveTab(groupTab, previousTabId) {
  // Called when user closes tab which leads to moving to group tab
  if (!previousTabId) {
    browser.tabs.create({ active: true });
    return;
  }

  // Handles when user closed current tab and goes to group tab but previousTabId was defined
  const handleUpdateError = (error) => {
    // Caused by closing into group tab
    console.log(error);

    // Creates a new tab instead
    browser.tabs.create({ active: true });
  };

  // Checks if we can just go back to previous tab
  if (!groupTab.innerTabs.includes(previousTabId)) {
    await browser.tabs
      .update(previousTabId, { active: true })
      .catch(handleUpdateError);

    return;
  }

  let otherTabs = await browser.tabs.query({
    hidden: false,
    currentWindow: true,
  });

  // Checks if window only has single closed group tab
  if (otherTabs.length === 1) {
    browser.tabs.create({ active: true });
    return;
  }

  const groupTabIDs = await getAllGroupTabIDs();

  // Filters for tabs that are neither a group tab or one of the inner tab about to be hidden
  const validTabs = otherTabs.filter((value) => {
    const id = value.id;

    return !groupTabIDs.includes(`${id}`) && !groupTab.innerTabs.includes(id);
  });

  if (validTabs.length > 0) {
    // Currently goes for the first option might change in future
    browser.tabs
      .update(validTabs[0].id, { active: true })
      .catch(handleUpdateError);
  } else {
    browser.tabs.create({ active: true });
  }
}

//#endregion
