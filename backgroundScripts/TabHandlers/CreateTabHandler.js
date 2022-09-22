import { ADD_GROUP_TAB_ID, NAME_PARAM, TAB_COUNT_PARAM } from "../../Consts.js";
import { addGroupTab } from "../StorageHandler.js";

/**
 * Handles setup for group tab creation
 */
export function setupCreateHandler() {
  browser.contextMenus.onClicked.addListener(createGroupTabWithTab);
}

/**
 * Creates a group tab with the given tab as it's inner tab
 * @param {*} info The info regarding the tab that was pressed
 * @param {*} tab The tab that the user added to the group
 */
function createGroupTabWithTab(info, tab) {
  // Makes sure we only add group tab when needed
  if (info.menuItemId !== ADD_GROUP_TAB_ID) {
    return;
  }

  const createPrompt = `prompt("Please enter the Group tab's name", "${tab.title}" || "Group Tab");`;

  browser.tabs
    .executeScript({ code: createPrompt })
    .then(async (results) => {
      console.log(results);

      // TODO Use pop up instead
      // Checks if user is in special tab
      if (!results || results[0] === undefined) {
        browser.notifications.create({
          type: "basic",
          // TODO Add Icon
          title: "Create Failed",
          message: "Can't create in this tab as it is blocked by firefox",
        });

        return;
      }

      // Checks if user chose to exit dialog
      if (results[0] === null) {
        return;
      }

      // Makes sure to block empty names
      if (results[0].trim() === "") {
        browser.notifications.create({
          type: "basic",
          // TODO Add Icon
          title: "Create Failed",
          message: "Can't create group tab with empty name",
        });
      } else {
        handleGroupTabCreation(results[0], [tab.id], tab.index);
      }
    })
    .catch((error) => {
      console.log(error);
      browser.notifications.create({
        type: "basic",
        // TODO Add Icon
        title: "Create Failed",
        message: error.toString(),
      });
    });
}

/**
 *  Handles the actual creation of the group tab
 * @param {string} name The name of the group tab defaults to "Group tab"
 * @param {number[]} innerTabs The id's of the inner tabs or just an empty array if nothing is passed
 * @param {number} index The index to put the group tab if nothing is passed then end of window
 */
async function handleGroupTabCreation(
  name = "Group tab",
  innerTabs = [],
  index = undefined
) {
  // Creates the group tab with the relevant info
  const groupTab = await browser.tabs.create({
    url: `/group_tab.html?${NAME_PARAM}=${name}&${TAB_COUNT_PARAM}=${innerTabs.length}`,
    index,
    active: false,
  });

  // Calls discard with delay to have the ui load up icon and title for tab
  setTimeout(() => {
    browser.tabs.discard(groupTab.id);
  }, 300);

  try {
    await addGroupTab(groupTab.id, name, innerTabs);
  } catch (error) {
    console.log({ error });
  }
}
