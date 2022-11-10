import { GroupTab } from "../../utils/GroupTab.js";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { ADD_TO_GROUP_TAB_ID, MOVE_TO_GROUP_TAB_ID } from "../../utils/Consts";
import browser, { Tabs, Menus, tabs } from "webextension-polyfill";
import {
  checkMovedIntoGroupTab,
  createNotification,
  findNewActiveTab,
  getActiveTab,
  moveGroupTab,
} from "../../utils/Utils";
import { OnTabClickHandler } from "./OnTabClickHandler";

/**
 * Handles Tabs being moved by the user
 */
export class MoveTabHandler {
  private highlightedTabs: number[] = [];

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

    tabs.onAttached.addListener(this.onTabWindowMoved.bind(this));

    tabs.onHighlighted.addListener(this.onTabsHighlighted.bind(this));

    browser.contextMenus.onClicked.addListener(
      this.onMoveTabMenuItemClick.bind(this)
    );
  }

  //#region Listeners

  /**
   * Identifies which type of tab was moved and calls appropriate code
   * @param tabId Id of the tab that was moved
   * @param moveInfo Info regarding the tab movement
   */
  private onTabMoved(tabId: number, moveInfo: Tabs.OnMovedMoveInfoType) {
    let { groupTab, index } =
      StorageHandler.instance.getGroupTabOrInnerTabByID(tabId);

    if (groupTab) {
      if (index !== undefined) {
        this.onInnerTabMove(
          groupTab,
          index,
          moveInfo.toIndex,
          moveInfo.windowId
        );
      } else {
        this.onGroupTabMove(groupTab, moveInfo.toIndex, moveInfo.windowId);
      }
    } else {
      this.onMoveIntoGroupTab(tabId, moveInfo.toIndex, moveInfo.windowId);
    }
  }

  /**
   * Identifies which type of tab was moved and calls appropriate code
   * @param tabId The id of the tab that was moved
   * @param attachInfo The new info regarding the tabs location
   */
  private onTabWindowMoved(
    tabId: number,
    attachInfo: Tabs.OnAttachedAttachInfoType
  ) {
    let { groupTab, index } =
      StorageHandler.instance.getGroupTabOrInnerTabByID(tabId);

    if (groupTab) {
      if (index !== undefined) {
        this.onInnerTabMove(
          groupTab,
          index,
          attachInfo.newPosition,
          attachInfo.newWindowId
        );
      } else {
        this.onGroupTabMove(
          groupTab,
          attachInfo.newPosition,
          attachInfo.newWindowId
        );
      }
    } else {
      this.onMoveIntoGroupTab(
        tabId,
        attachInfo.newPosition,
        attachInfo.newWindowId
      );
    }
  }

  /**
   * Move the tabs based on which item was clicked
   * @param info The info regarding the tab that was pressed
   * @param tab The tab that the user wants to move
   */
  private async onMoveTabMenuItemClick(
    info: Menus.OnClickData,
    tab?: Tabs.Tab
  ) {
    // Must have a tab with id for this action as well as being a string action
    if (!tab?.id || typeof info.menuItemId !== "string") return;

    // Checks for new tab to add to group
    if (info.menuItemId.startsWith(ADD_TO_GROUP_TAB_ID)) {
      const groupID = info.menuItemId.substring(ADD_TO_GROUP_TAB_ID.length);

      await this.addTabToGroupMenuClick(parseInt(groupID), tab);
      return;
    }

    // All other actions should only be for inner tab
    const { groupTab, index } =
      StorageHandler.instance.getGroupTabOrInnerTabByID(tab.id);

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
  }

  /**
   * Handles user highlighting tabs/ inner tabs
   * @param highlightInfo The tabs that are highlighted
   */
  private async onTabsHighlighted(
    highlightInfo: Tabs.OnHighlightedHighlightInfoType
  ) {
    // Clears the set since the updated values have been updated
    this.highlightedTabs = [];

    highlightInfo.tabIds.forEach((id) => {
      const { groupTab, index } =
        StorageHandler.instance.getGroupTabOrInnerTabByID(id);

      // Disables highlighting group and inner tabs
      if (groupTab) {
        tabs.update(id, { highlighted: false });
      } else {
        this.highlightedTabs.push(id);
      }
    });
  }

  //#endregion

  //#region Utils

  /**
   * Creates a confirm dialog for the user to confirm their action
   *
   * @param message The message displayed in the confirm dialog
   * @returns the results of the confirm script
   */
  private async handleConfirmMove(message: string) {
    const confirmCode = `confirm("${message}");`;

    const results = await tabs.executeScript({
      code: confirmCode,
    });

    return results;
  }

  //#endregion

  //#region OnTabMove

  /**
   *  Moves the inner tabs to follow the group tab
   * @param groupTab The group tab that was moved
   * @param toIndex The index to put the group tab in
   * @param windowId The id of the window to put the group tab in
   */
  private async onGroupTabMove(
    groupTab: GroupTab,
    toIndex: number,
    windowId: number
  ) {
    const { groupTab: enteredGroupTab, groupTabInfo: enteredGroupTabInfo } =
      await checkMovedIntoGroupTab(toIndex, windowId);

    // Checks if group tab was put inside another group tab and moves it out
    if (enteredGroupTab) {
      // Puts the the dragged group tab and it's inner tabs after the group tab they were put in
      await moveGroupTab(
        enteredGroupTab,
        [groupTab.id, ...groupTab.innerTabs],
        enteredGroupTabInfo.index,
        windowId
      );
    } else {
      await moveGroupTab(groupTab, undefined, toIndex, windowId);
    }

    await OnTabClickHandler.instance.onStopDragging(groupTab);
  }

  /**
   * Handles user moving tab inside of the group tab area
   * @param tabId Id of the tab that was moved
   * @param toIndex The new index for the tab
   * @param windowId The id of the window the tab was put in
   * @param isConfirmed Marks if the tab move is auto confirmed by the settings or not
   */
  private async onMoveIntoGroupTab(
    tabId: number,
    toIndex: number,
    windowId: number
  ) {
    const settings = StorageHandler.instance.settings;

    const { groupTab, groupTabInfo } = await checkMovedIntoGroupTab(
      toIndex,
      windowId
    );

    if (!groupTab || !groupTabInfo) {
      return;
    }

    const isHighlighted =
      this.highlightedTabs.includes(tabId) && this.highlightedTabs.length > 1;

    // Blocks adding by drag when not needed
    if (!settings.addTabsByDrag) {
      // Puts the tab outside of the group tab
      moveGroupTab(groupTab, isHighlighted ? this.highlightedTabs : [tabId]);
      return;
    }

    const movedTabInfo = await tabs.get(tabId);

    let results;

    // Makes sure to display dialog if needed
    if (settings.showMoveToGroupTabDialog.drag) {
      results = await this.handleConfirmMove(
        `Are you sure you want to move ${
          isHighlighted
            ? "the highlighted tabs"
            : `tab ${movedTabInfo.title?.replaceAll('"', '\\"')}`
        } to group ${groupTab.name.replaceAll('"', '\\"')}?`
      );
    } else {
      results = [true];
    }

    if (results[0]) {
      if (isHighlighted) {
        // Adds all of the highlighted group tabs
        await StorageHandler.instance.addInnerTabs(
          groupTab,
          this.highlightedTabs,
          toIndex - groupTabInfo.index - 1
        );
      } else {
        await StorageHandler.instance.addInnerTab(
          groupTab,
          tabId,
          toIndex - groupTabInfo.index - 1
        );
      }

      await createNotification(
        `Tab${isHighlighted ? "s" : ""} Moved`,
        `${
          isHighlighted
            ? "Highlighted tabs were"
            : `Tab ${movedTabInfo.title} was`
        } moved to group tab ${groupTab.name}`
      );
    } else {
      // Puts the tab outside of the group tab
      moveGroupTab(groupTab, isHighlighted ? this.highlightedTabs : [tabId]);
    }
  }

  //#region Inner Tab Move

  /**
   *  Handles user moving an inner tab to a new location
   * @param groupTab The group tab who had an inner tab
   * @param index The index of the inner tab in the group tab
   * @param toIndex The new index of inner tab
   * @param windowId The window id of the window the inner tab is in
   */
  private async onInnerTabMove(
    groupTab: GroupTab,
    index: number,
    toIndex: number,
    windowId: number
  ) {
    const groupTabInfo = await tabs.get(groupTab.id);

    // Checks if the tab is inside of group range in window (pinned groups have max range so we ignore them)
    if (
      !groupTabInfo.pinned &&
      windowId === groupTabInfo.windowId &&
      toIndex > groupTabInfo.index && // min
      toIndex <= groupTabInfo.index + groupTab.innerTabs.length // max
    ) {
      await this.onReorderInGroupTab(
        groupTab,
        groupTabInfo.index,
        index,
        toIndex
      );
      return;
    }

    const { groupTab: newGroupTab, groupTabInfo: newGroupTabInfo } =
      await checkMovedIntoGroupTab(toIndex, windowId);

    if (newGroupTab && newGroupTabInfo) {
      await this.onMoveFromOneGroupToOther(
        groupTab,
        groupTabInfo,
        index,
        newGroupTab,
        StorageHandler.instance.settings.showMoveFromGroupToNewDialog.drag,
        toIndex
      );

      return;
    }

    // Moving a tab in pinned group should never remove it unless in other window
    if (!groupTabInfo.pinned || groupTabInfo.windowId !== windowId) {
      await this.onRemoveTabFromGroup(groupTab, index);
    }
  }

  /**
   *
   * Moves the inner tab to a new location in the group tab
   *
   * @param groupTab The group tab who has the inner tab move
   * @param groupTabIndex The index of the group tab in the browser
   * @param innerTabIndex The index of the inner tab in the group tab
   * @param toIndex The new index of the inner tab
   */
  private async onReorderInGroupTab(
    groupTab: GroupTab,
    groupTabIndex: number,
    innerTabIndex: number,
    toIndex: number
  ) {
    const tabId = groupTab.innerTabs[innerTabIndex];

    const newIndex = toIndex - groupTabIndex - 1;

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
   * @param toIndex The new index of inner tab in the ui
   * @param displayDialog Marks if the dialog should be displayed
   */
  private async onMoveFromOneGroupToOther(
    groupTab: GroupTab,
    groupTabInfo: Tabs.Tab,
    innerTabIndex: number,
    newGroupTab: GroupTab,
    displayDialog: boolean,
    toIndex?: number
  ) {
    const movedTabInfo = await tabs.get(groupTab.innerTabs[innerTabIndex]);

    let results;

    // Display dialog if needed
    if (displayDialog) {
      results = await this.handleConfirmMove(
        `Are you sure you want to move tab ${movedTabInfo.title?.replaceAll(
          '"',
          '\\"'
        )} from group ${groupTab.name.replaceAll(
          '"',
          '\\"'
        )} to group ${newGroupTab.name.replaceAll('"', '\\"')}?`
      );
    } else {
      results = [true];
    }

    // Checks if user confirmed inner tab swap
    if (results[0]) {
      await StorageHandler.instance.removeInnerTab(groupTab, movedTabInfo.id!);
      const newIndex =
        toIndex !== undefined ? toIndex - groupTabInfo.index - 1 : undefined;

      await StorageHandler.instance.addInnerTab(
        newGroupTab,
        movedTabInfo.id!,
        newIndex
      );

      await createNotification(
        "Tab Moved",
        `Tab ${movedTabInfo.title} was moved to group tab ${newGroupTab.name}`
      );

      if (groupTab.isClosedGroupMode) {
        await tabs.hide(groupTab.innerTabs);
      }
    } else {
      // Resets the inner tab inside the group tab
      moveGroupTab(groupTab);
    }
  }

  /**
   *
   * Asks user if they are sure they want to remove the inner tab from group
   *
   * @param groupTab The group tab who originally had the inner tab
   * @param innerTabIndex The index of the inner tab in the group tab
   */
  private async onRemoveTabFromGroup(
    groupTab: GroupTab,
    innerTabIndex: number
  ) {
    const movedTabInfo = await tabs.get(groupTab.innerTabs[innerTabIndex]);

    const settings = StorageHandler.instance.settings;

    let results;

    if (settings.showRemoveFromGroupTabDialog.drag) {
      results = await this.handleConfirmMove(
        `Are you sure you want remove tab ${movedTabInfo.title?.replaceAll(
          '"',
          '\\"'
        )} from group ${groupTab.name.replaceAll('"', '\\"')}?`
      );
    } else {
      results = [true];
    }

    if (results[0]) {
      await StorageHandler.instance.removeInnerTab(groupTab, movedTabInfo.id!);

      createNotification(
        "Tab Removed",
        `Tab ${movedTabInfo.title} was removed from group tab ${groupTab.name}`
      );

      if (groupTab.isClosedGroupMode) {
        await tabs.hide(groupTab.innerTabs);
      }
    } else {
      // Resets the inner tab inside the group tab
      moveGroupTab(groupTab);
    }
  }

  //#endregion

  //#endregion

  //#region OnMenuItemClick

  /**
   * Moves the inner tab from the group and puts it  in the new group
   * @param groupId The id of the group we want to move the tab to
   * @param tab The tab we want to move
   */
  private async addTabToGroupMenuClick(groupId: number, tab: Tabs.Tab) {
    const groupTab = StorageHandler.instance.getGroupTabByID(groupId)!;

    let results;

    // Makes sure to display dialog if needed
    if (StorageHandler.instance.settings.showMoveToGroupTabDialog.menu) {
      results = await this.handleConfirmMove(
        `Are you sure you want to move tab ${tab.title?.replaceAll(
          '"',
          '\\"'
        )} to group ${groupTab?.name.replaceAll('"', '\\"')}?`
      );
    } else {
      results = [true];
    }

    if (!results[0]) return;

    await StorageHandler.instance.addInnerTab(groupTab, tab.id!);

    await moveGroupTab(groupTab);

    // Incase of closed group tab handles hider hiding or showing the new tab
    if (!groupTab.isOpen || groupTab.isClosedGroupMode) {
      if (tab.active) {
        groupTab.isOpen = true;

        await tabs.show(groupTab.innerTabs);

        StorageHandler.instance.updateGroupTab(groupTab);
      } else {
        tabs.hide(tab.id!);
      }
    }
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
    const groupTabInfo = await tabs.get(groupTab.id);

    const newGroupTab = StorageHandler.instance.getGroupTabByID(newGroupId);

    this.onMoveFromOneGroupToOther(
      groupTab,
      groupTabInfo,
      index,
      newGroupTab!,
      StorageHandler.instance.settings.showMoveFromGroupToNewDialog.menu
    );
  }

  //#endregion
}
