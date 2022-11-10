import { notifications, Tabs, tabs } from "webextension-polyfill";
import { ICON_URL } from "./Consts";
import { GroupTab } from "./GroupTab";
import { StorageHandler } from "./Storage/StorageHandler";

/**
 * Checks to see if the given index is inside a group tab
 * and returns the info regarding said group tab in needed
 * @param index The index an inner tab was moved to
 * @param windowId The id for the window the tab is in
 *
 * @returns The group tab and it's info that the index is a part of (can return undefined vars if not in a group)
 */
export async function checkMovedIntoGroupTab(index: number, windowId: number) {
  const groupTabPromises: Promise<
    | {
        groupTab: GroupTab;
        groupTabInfo: Tabs.Tab;
      }
    | undefined
  >[] = [];

  const groupTabIDs = StorageHandler.instance.getAllGroupTabIDs();

  groupTabIDs.forEach((id) => {
    const checkIsInRange = async (id: number) => {
      // Get's all info we need
      const groupTab = StorageHandler.instance.getGroupTabByID(id);
      const groupTabInfo = await tabs.get(id);

      // Uses to shut up groupTab warning, and ignore pinned group tabs and group tabs in other windows
      if (
        !groupTab ||
        groupTabInfo.pinned ||
        groupTabInfo.windowId !== windowId
      )
        return undefined;

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

/**
 * Creates a notification and displays to user
 * @param title The title of notification
 * @param message The message of the notification
 * @returns The notification id
 */
export async function createNotification(title: string, message: string) {
  return notifications.create({
    type: "basic",
    iconUrl: ICON_URL,
    title,
    message,
  });
}

/**
 * Moves the group tabs it's inner tabs and the postfix to the index
 * if group tab is pinned only moves it and not it's inner tabs or postfix
 * @param groupTab The group tab or it's id that we want to move
 * @param postfix Tabs to be added after the group tab and it's inner tabs
 * @param index The starting index for the group tab (if undefined uses group tab's current index)
 * @param windowId The id of the window to put the group tab in if not passed uses the group tabs current window
 */
export async function moveGroupTab(
  groupTab: number | GroupTab,
  postfix: number[] = [],
  index?: number,
  windowId?: number
) {
  let groupTabValue;

  // Gets the actual group tab no matter what
  if (typeof groupTab === "number") {
    groupTabValue = StorageHandler.instance.getGroupTabByID(groupTab)!;
  } else {
    groupTabValue = groupTab;
  }

  const groupTabInfo = await tabs.get(groupTabValue.id);

  let indexValue = index;

  // Gets  group tab index if nothing was passed
  if (indexValue === undefined) {
    indexValue = groupTabInfo.index;
  }

  let tabsToMove;

  // If group tab is pinned inner tabs have unrestricted movements and are
  // unaffected by it's movements
  if (groupTabInfo.pinned) {
    tabsToMove = [groupTabValue.id];
  } else {
    tabsToMove = [groupTabValue.id, ...groupTabValue.innerTabs, ...postfix];
  }

  // Moves all tabs to be after the group tab and in it's window
  tabs.move(tabsToMove, {
    index: indexValue,
    windowId: windowId !== undefined ? windowId : groupTabInfo.windowId,
  });
}

/**
 * Gets the current active tab in the current window
 * @returns The active tab
 */
export async function getActiveTab() {
  const activeTab = await tabs.query({ currentWindow: true, active: true });

  return activeTab[0];
}

/**
 * Delays the current process
 * @param time The time in milliseconds to delay
 * @returns The promise that needs to be waited to actually delay
 */
export async function delay(time = 100) {
  return new Promise((resolve) => setTimeout(resolve, time));
}

/**
 * Finds a valid tab to move to from the active tab, does nothing if active tab is not a or in group tab
 *
 * @param previousTabId The id of the tab this was moved from if it exists
 */
export async function findNewActiveTab(previousTabId?: number) {
  const activeTab = await getActiveTab();

  const { groupTab, index } = StorageHandler.instance.getGroupTabOrInnerTabByID(
    activeTab.id!
  );

  if (!groupTab) return;

  let visibleTabs = await tabs.query({
    active: false,
    hidden: false,
    windowId: activeTab.windowId,
  });

  // Removes the group tab and inner children from this
  visibleTabs = visibleTabs.filter((tab) => {
    const id = tab.id!;
    return id !== groupTab?.id && !groupTab?.innerTabs.includes(id);
  });

  // If no tab left just creates new one
  if (!visibleTabs.length) {
    tabs.create({ active: true });
    return;
  }

  // Finds if the previous tab is a viable option
  if (previousTabId) {
    const previousTab = visibleTabs.find((tab) => {
      return tab.id === previousTabId;
    });

    // Opener must not be in the group tab
    if (previousTab) {
      const previousGroupTab =
        StorageHandler.instance.getGroupTabByID(previousTabId);

      // Can't go to a group tab
      if (!previousGroupTab) {
        await tabs.update(previousTab.id, { active: true });
        return;
      }
    }
  }

  let newTab;

  const groupTabIndex = (await tabs.get(groupTab.id)).index;
  const endIndex = groupTab.innerTabs.length + groupTabIndex;

  // Finds the distance between the tab and the active tab's group
  const calculateDistance = (index: number) => {
    // Distance is the shortest length either to the group tab or the last tab in the group
    return Math.min(
      Math.abs(groupTabIndex - index),
      Math.abs(endIndex - index)
    );
  };

  // Goes over the tabs and try to see if any are valid to move to
  for (const tab of visibleTabs) {
    const visibleGroupTab = StorageHandler.instance.getGroupTabByID(
      tab.id || 0
    );

    // Not interested in group tabs
    if (!visibleGroupTab) {
      // If already found possible new tab checks which is closer
      if (newTab) {
        newTab =
          calculateDistance(tab.index) < calculateDistance(newTab.index)
            ? tab
            : newTab;
      } else {
        newTab = tab;
      }
    }
  }

  if (newTab) {
    tabs.update(newTab.id, { active: true });
  } else {
    tabs.create({ active: true });
  }
}

/**
 * Creates the title for the group tab based on the settings
 * @param groupTab The group tab we get the title of
 * @returns The title in the correct format
 */
export function createGroupTabTitle(groupTab: GroupTab): string {
  let title;

  const settings = StorageHandler.instance.settings;

  const innerTabsCountString = `(${groupTab.innerTabs.length})`;

  let prefix = `${
    settings.innerTabCountInName === "prefix" ? innerTabsCountString : ""
  }`;
  let postfix = `${
    settings.innerTabCountInName === "postfix" ? innerTabsCountString : ""
  }`;

  title = `${prefix} ${groupTab.name} ${postfix}`.trim();

  return title;
}
