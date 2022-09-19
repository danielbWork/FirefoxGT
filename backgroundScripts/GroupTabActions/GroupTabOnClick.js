import { GroupTab } from "../GroupTab.js";
import {
  getAllGroupTabIDs,
  getGroupTabByID,
  toggleGroupTabVisibility,
} from "../StorageHandler.js";

/**
 * Handles setup code for handling group tab click
 */
export function setupGroupTabOnClick() {
  browser.tabs.onActivated.addListener(async (activeInfo) => {
    try {
      let groupTab = await getGroupTabByID(activeInfo.tabId);

      if (groupTab) {
        onGroupTabClick(groupTab, activeInfo.previousTabId);
      }
    } catch (error) {
      console.log({ error, activeInfo });
    }
  });
}

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

  // Makes sure group tab is discarded and not active tab
  handleTabMove(groupTab, previousTabId);

  // Need to wait for tab to actually not be active to discard
  setTimeout(() => {
    browser.tabs.discard(groupTab.id).then();
  }, 100);
}

/**
 * Finds a valid tab to move to once the group is hidden, otherwise creates a new tab
 *
 * @param {GroupTab} groupTab The group tab that we want to move from
 * @param {number} previousTabId The id of tab this was moved from
 */
async function handleTabMove(groupTab, previousTabId) {
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
    console.log(`Pre ${previousTabId}`);
    await browser.tabs
      .update(previousTabId, { active: true })
      .catch(handleUpdateError);

    console.log("Post");
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