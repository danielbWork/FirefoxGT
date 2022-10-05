import { Tabs, tabs } from "webextension-polyfill";
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
  const groupTabPromises: Promise<{
    groupTab: GroupTab;
    groupTabInfo: Tabs.Tab;
} | undefined>[] = [];

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