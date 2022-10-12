import { GroupTab } from "../../utils/GroupTab.js";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import {
  ADD_TO_GROUP_TAB_ID,
  MOVE_TO_GROUP_TAB_ID,
  REMOVE_FROM_GROUP_TAB_ID,
} from "../../utils/Consts";
import browser, { Tabs, Menus, tabs } from "webextension-polyfill";
import { checkMovedIntoGroupTab, createNotification } from "../../utils/Utils";
import { OnTabClickHandler } from "./OnTabClickHandler";

/**
 * Handles Tabs being moved by the user
 */
export class MoveTabHandler {
  //#region Singleton

  private static _instance: MoveTabHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): MoveTabHandler {
    if (!MoveTabHandler._instance) {
      MoveTabHandler._instance = new MoveTabHandler();
    }

    return MoveTabHandler._instance;
  }

  //#endregion

  /**
   * Handles setup code for moving group tabs and their inner tabs
   */
  setupMoveHandler() {
    tabs.onMoved.addListener(this.onTabMoved.bind(this));

    browser.contextMenus.onClicked.addListener(
      this.onMoveInnerTabMenuItemClick.bind(this)
    );
  }

  //#region Listeners

  /**
   * Identifies which type of tab was moved and calls appropriate code
   * @param tabId Id of the tab that was moved
   * @param moveInfo Info regarding the tab movement
   */
  private async onTabMoved(tabId: number, moveInfo: Tabs.OnMovedMoveInfoType) {
    let { groupTab, index } =
      await StorageHandler.instance.getGroupTabOrInnerTabByID(tabId);

    if (groupTab) {
      if (index !== undefined) {
        this.onInnerTabMove(groupTab, index, moveInfo);
      } else {
        this.onGroupTabMove(groupTab, moveInfo);
      }
    } else {
      this.onMoveIntoGroupTab(tabId, moveInfo);
    }
  }

  /**
   * Move the tabs based on which item was clicked
   * @param info The info regarding the tab that was pressed
   * @param tab The tab that the user wants to move
   */
  private async onMoveInnerTabMenuItemClick(
    info: Menus.OnClickData,
    tab?: Tabs.Tab
  ) {
    // Must have a tab with id for this action as well as being a string action
    if (!tab?.id || typeof info.menuItemId !== "string") return;

    // Checks for new tab to add to group
    if (info.menuItemId.startsWith(ADD_TO_GROUP_TAB_ID)) {
      const groupID = info.menuItemId.substring(ADD_TO_GROUP_TAB_ID.length);

      await this.addTabToGroupMenuClick(parseInt(groupID), tab.id);
      return;
    }

    // All other actions should only be for inner tab
    const { groupTab, index } =
      await StorageHandler.instance.getGroupTabOrInnerTabByID(tab.id);

    if (!groupTab || index === undefined) return;

    // Checks tab was moved to other group
    if (info.menuItemId.startsWith(MOVE_TO_GROUP_TAB_ID)) {
      const newGroupID = info.menuItemId.substring(MOVE_TO_GROUP_TAB_ID.length);
      this.moveTabFromGroupToNewGroupMenuClick(
        groupTab,
        index,
        parseInt(newGroupID)
      );
    }
    // Check tabs was moved outside of group
    else if (info.menuItemId === REMOVE_FROM_GROUP_TAB_ID) {
      await this.removeTabFromGroupMenuClick(groupTab, tab.id);
    }
  }

  //#endregion

  //#region Utils

  /**
   * Moves the group the tab and it's inner tab to a new location
   *
   * @param groupTab The group tab we move
   * @param index The index we move the group tab to
   * @param additionalTabs other tabs to that should be moved after the group
   */
  private async moveGroupTab(
    groupTab: GroupTab,
    index: number,
    additionalTabs: number[] = []
  ) {
    // Makes sure that move keeps the order of the group
    const allTabs = [groupTab.id, ...groupTab.innerTabs, ...additionalTabs];

    await tabs.move(allTabs, {
      index: index,
    });
  }

  /**
   * Creates a confirm dialog for the user to confirm their action
   *
   * @param message The message displayed in the confirm dialog
   * @returns the results of the confirm script
   */
  private async handleConfirmMove(message: string) {
    const confirmCode = `confirm("${message}");`;

    const activeTab = (await tabs.query({ active: true }))[0];

    const results = await tabs.executeScript(activeTab.id, {
      code: confirmCode,
    });

    return results;
  }

  //#endregion

  //#region OnTabMove

  /**
   *  Moves the inner tabs to follow the group tab
   * @param groupTab The group tab that was moved
   * @param moveInfo Info regarding moving the group tab
   */
  private async onGroupTabMove(
    groupTab: GroupTab,
    moveInfo: Tabs.OnMovedMoveInfoType
  ) {
    await this.moveGroupTab(groupTab, moveInfo.toIndex);

    await OnTabClickHandler.instance.onStopDragging(groupTab);
  }

  /**
   * Handles user moving tab inside of the group tab area
   * @param tabId Id of the tab that was moved
   * @param moveInfo Info regarding the tab movement
   */
  private async onMoveIntoGroupTab(
    tabId: number,
    moveInfo: Tabs.OnMovedMoveInfoType
  ) {
    const { groupTab, groupTabInfo } = await checkMovedIntoGroupTab(
      moveInfo.toIndex
    );

    if (groupTab && groupTabInfo) {
      // TODO Add dialog asking user if they are sure

      const movedTabInfo = await tabs.get(tabId);

      const results = await this.handleConfirmMove(
        `Are you sure you want to move tab ${movedTabInfo.title} to group ${groupTab.name}?`
      );

      if (results[0]) {
        StorageHandler.instance.addInnerTab(
          groupTab,
          tabId,
          moveInfo.toIndex - groupTabInfo.index - 1
        );

        await createNotification(
          "Tab Moved",
          `Tab ${movedTabInfo.title} was moved to group tab ${groupTab.name}`
        );
      } else {
        // Puts the tab outside of the group tab
        this.moveGroupTab(groupTab, groupTabInfo.index, [tabId]);
      }
    }
  }

  //#region Inner Tab Move

  /**
   *  Handles user moving an inner tab to a new location
   * @param groupTab The group tab who had an inner tab
   * @param index The index of the inner tab in the group tab
   * @param moveInfo The moveInfo regarding the inner tab
   */
  private async onInnerTabMove(
    groupTab: GroupTab,
    index: number,
    moveInfo: Tabs.OnMovedMoveInfoType
  ) {
    // Block infinite loop and non important movements
    if (moveInfo.toIndex === moveInfo.fromIndex) {
      return;
    }

    const groupTabInfo = await tabs.get(groupTab.id);

    // Checks if the tab is inside of group range
    if (
      moveInfo.toIndex > groupTabInfo.index && // min
      moveInfo.toIndex <= groupTabInfo.index + groupTab.innerTabs.length // max
    ) {
      await this.onReorderInGroupTab(
        groupTab,
        groupTabInfo.index,
        index,
        moveInfo
      );
      return;
    }

    const { groupTab: newGroupTab, groupTabInfo: newGroupTabInfo } =
      await checkMovedIntoGroupTab(moveInfo.toIndex);

    if (newGroupTab && newGroupTabInfo) {
      await this.onMoveFromOneGroupToOther(
        groupTab,
        groupTabInfo,
        index,
        newGroupTab,
        newGroupTabInfo,
        moveInfo
      );

      return;
    }

    await this.onRemoveTabFromGroup(groupTab, groupTabInfo, index);
  }

  /**
   *
   * Moves the inner tab to a new location in the group tab
   *
   * @param groupTab The group tab who has the inner tab move
   * @param groupTabIndex The index of the group tab in the browser
   * @param innerTabIndex The index of the inner tab in the group tab
   * @param moveInfo The moveInfo regarding the inner tab
   */
  private async onReorderInGroupTab(
    groupTab: GroupTab,
    groupTabIndex: number,
    innerTabIndex: number,
    moveInfo: Tabs.OnMovedMoveInfoType
  ) {
    const tabId = groupTab.innerTabs[innerTabIndex];

    const newIndex = moveInfo.toIndex - groupTabIndex - 1;

    // Removes and readds the id in the correct location
    groupTab.innerTabs.splice(innerTabIndex, 1);
    groupTab.innerTabs.splice(newIndex, 0, tabId);

    await StorageHandler.instance.updateGroupTab(groupTab);
  }

  /**
   *
   * Moves the inner tab to a to the new group tab
   *
   * @param groupTab The group tab who originally had the inner tab
   * @param groupTabInfo The tab info regarding the group tab
   * @param innerTabIndex The index of the inner tab in the original group tab
   * @param newGroupTab The group tab who is going to hold the inner tab
   * @param newGroupTabInfo The tab info regarding the new group tab
   * @param moveInfo The moveInfo regarding the inner tab
   */
  private async onMoveFromOneGroupToOther(
    groupTab: GroupTab,
    groupTabInfo: Tabs.Tab,
    innerTabIndex: number,
    newGroupTab: GroupTab,
    newGroupTabInfo: { index: number },
    moveInfo: Tabs.OnMovedMoveInfoType
  ) {
    const movedTabInfo = await tabs.get(groupTab.innerTabs[innerTabIndex]);

    const results = await this.handleConfirmMove(
      `Are you sure you want to move tab ${movedTabInfo.title} from group ${groupTab.name} to group ${newGroupTab.name}?`
    );

    if (results[0]) {
      await StorageHandler.instance.removeInnerTab(groupTab, movedTabInfo.id!);

      // Adds it temporarily to the end so it can be reordered
      newGroupTab.innerTabs.push(movedTabInfo.id!);

      await this.onReorderInGroupTab(
        newGroupTab,
        newGroupTabInfo.index,
        newGroupTab.innerTabs.length - 1,
        moveInfo
      );

      await createNotification(
        "Tab Moved",
        `Tab ${movedTabInfo.title} was moved to group tab ${newGroupTab.name}`
      );
    } else {
      // Resets the inner tab inside the group tab
      this.moveGroupTab(groupTab, groupTabInfo.index);
    }
  }

  /**
   *
   * Asks user if they are sure they want to remove the inner tab from group
   *
   * @param groupTab The group tab who originally had the inner tab
   * @param groupTabInfo The tab info regarding the group tab
   * @param innerTabIndex The index of the inner tab in the group tab
   */
  private async onRemoveTabFromGroup(
    groupTab: GroupTab,
    groupTabInfo: Tabs.Tab,
    innerTabIndex: number
  ) {
    const movedTabInfo = await tabs.get(groupTab.innerTabs[innerTabIndex]);

    const results = await this.handleConfirmMove(
      `Are you sure you want remove tab ${movedTabInfo.title} from group ${groupTab.name}?`
    );

    if (results[0]) {
      await StorageHandler.instance.removeInnerTab(groupTab, movedTabInfo.id!);

      await createNotification(
        "Tab Removed",
        `Tab ${movedTabInfo.title} was removed from group tab ${groupTab.name}`
      );
    } else {
      // Resets the inner tab inside the group tab
      this.moveGroupTab(groupTab, groupTabInfo.index);
    }
  }

  //#endregion

  //#endregion

  //#region OnMenuItemClick

  /**
   * Moves the inner tab from the group and puts it  in the new group
   * @param groupId The id of the group we want to move the tab to
   * @param tabId The id of the tab we want to move
   */
  private async addTabToGroupMenuClick(groupId: number, tabId: number) {
    const groupTab = (await StorageHandler.instance.getGroupTabByID(groupId))!;

    await StorageHandler.instance.addInnerTab(groupTab, tabId);

    const groupTabInfo = await tabs.get(groupId);

    await this.moveGroupTab(groupTab, groupTabInfo.index);
  }

  /**
   * Moves the inner tab from the group and puts it in the new group
   *
   *
   * @param groupTab The group tab that contains the inner tab
   * @param index The index of the inner tab we want to move
   * @param newGroupId The id of the group we want to move the tab to
   */
  private async moveTabFromGroupToNewGroupMenuClick(
    groupTab: GroupTab,
    index: number,
    newGroupId: number
  ) {
    const movedTabID = groupTab.innerTabs[index];

    await StorageHandler.instance.removeInnerTab(groupTab, movedTabID);

    // Moves the inner tab to the group
    await this.addTabToGroupMenuClick(newGroupId, movedTabID);
  }

  /**
   * Removes the inner tab from the group and puts it outside the group
   * @param groupTab The group tab that contains the inner tab
   * @param id The id of the inner tab we want to remove from the group in the group tab
   */
  private async removeTabFromGroupMenuClick(groupTab: GroupTab, id: number) {
    await StorageHandler.instance.removeInnerTab(groupTab, id);

    // Gets groupTab now after it's value was updated
    const updatedGroupTab = (await StorageHandler.instance.getGroupTabByID(
      groupTab.id
    ))!;
    const groupTabInfo = await tabs.get(updatedGroupTab.id);

    // Makes sure that move keeps the order of the group and put removed tab outside of it

    await this.moveGroupTab(updatedGroupTab, groupTabInfo.index, [id]);
  }

  //#endregion
}
