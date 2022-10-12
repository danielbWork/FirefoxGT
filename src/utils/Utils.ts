import { notifications, Tabs, tabs } from "webextension-polyfill";
import { GroupTab } from "./GroupTab.js";
import { StorageHandler } from "./Storage/StorageHandler";

/**
 * Checks to see if the given index is inside a group tab
 * and returns the info regarding said group tab in needed
 * @param index The index an inner tab was moved to
 *
 * @returns The group tab and it's info that the index is a part of (can return undefined vars if not in a group)
 */
export async function checkMovedIntoGroupTab(index: number) {
  const groupTabPromises: Promise<
    | {
        groupTab: GroupTab;
        groupTabInfo: Tabs.Tab;
      }
    | undefined
  >[] = [];

  const groupTabIDs = await StorageHandler.instance.getAllGroupTabIDs();

  groupTabIDs.forEach((id) => {
    const checkIsInRange = async (id: number) => {
      // Get's all info we need
      const [groupTab, groupTabInfo] = await Promise.all([
        StorageHandler.instance.getGroupTabByID(id),
        tabs.get(id),
      ]);

      // Just to shut up warning
      if (!groupTab) return undefined;

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
    iconUrl: "icons/group_tab_icon.png",
    title,
    message,
  });
}

/**
 * Moves the group tabs it's inner tabs and the postfix to the index
 * @param groupTab The group tab or it's id that we want to move
 * @param postfix Tabs to be added after the group tab and it's inner tabs
 * @param index The starting index for the group tab (if undefined uses group tab's current index)
 */
export async function moveGroupTab(
  groupTab: number | GroupTab,
  postfix: number[] = [],
  index?: number
) {
  let groupTabValue;

  // Gets the actual group tab no matter what
  if (typeof groupTab === "number") {
    groupTabValue = (await StorageHandler.instance.getGroupTabByID(groupTab))!;
  } else {
    groupTabValue = groupTab;
  }

  const groupTabInfo = await tabs.get(groupTabValue.id);

  let indexValue = index;

  // Gets  group tab index if nothing was passed
  if (indexValue === undefined) {
    indexValue = groupTabInfo.index;
  }

  // Moves all tabs to be after the group tab and in it's window
  tabs.move([groupTabValue.id, ...groupTabValue.innerTabs, ...postfix], {
    index: indexValue,
    windowId: groupTabInfo.windowId,
  });
}
