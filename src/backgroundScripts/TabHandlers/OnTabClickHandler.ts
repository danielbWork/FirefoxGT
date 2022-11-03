import { GroupTab } from "../../utils/GroupTab";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { TOGGLE_GROUP_TAB_ID } from "../../utils/Consts";
import browser, { Tabs, Menus, tabs } from "webextension-polyfill";
import { findNewActiveTab, getActiveTab } from "../../utils/Utils";

/**
 * Handles user click events on group tabs
 */
export class OnTabClickHandler {
  /**
   * The timeout id used to mark how long until a tab click
   * should be seen as dragging the tab
   */
  private draggingTimeoutID?: number | NodeJS.Timeout = undefined;

  /**
   * The flag marking that the user is currently dragging the group tab
   */
  private isDraggingFlag = false;

  //#region Singleton

  private static _instance: OnTabClickHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): OnTabClickHandler {
    if (!OnTabClickHandler._instance) {
      OnTabClickHandler._instance = new OnTabClickHandler();
    }

    return OnTabClickHandler._instance;
  }

  //#endregion

  /**
   * Handles setup code for handling group tab click
   */
  setupOnClickHandler() {
    tabs.onActivated.addListener(this.onGroupTabActivated.bind(this));
    browser.contextMenus.onClicked.addListener(
      this.onToggleContextMenu.bind(this)
    );
  }

  //#region Listeners

  /**
   *  Reacts to user activating a tab, if tab is group tab toggles it on or off
   * @param activeInfo The activation info
   */
  private onGroupTabActivated(activeInfo: Tabs.OnActivatedActiveInfoType) {
    let groupTab = StorageHandler.instance.getGroupTabByID(activeInfo.tabId);

    if (groupTab) {
      // Checks if currently dragging the tab
      if (this.draggingTimeoutID || this.isDraggingFlag) {
        if (this.draggingTimeoutID) {
          tabs.hide(groupTab.innerTabs);
          this.isDraggingFlag = true;
        }

        findNewActiveTab(activeInfo.previousTabId);
      } else {
        this.onGroupTabClick(groupTab, activeInfo.previousTabId);
      }
    }
  }

  /**
   * Toggles the group tab on visibility state
   * @param info The info regarding the tab that was pressed
   * @param tab The tab that the user added to the group
   */
  private async onToggleContextMenu(info: Menus.OnClickData, tab?: Tabs.Tab) {
    if (info.menuItemId === TOGGLE_GROUP_TAB_ID) {
      const groupTab = StorageHandler.instance.getGroupTabByID(tab!.id!)!;

      // Checks to see if we need to move before the hide
      if (groupTab.isOpen) {
        await findNewActiveTab();
      }

      // Checks whether to hide or show by doing opposite
      if (groupTab.isOpen) {
        await tabs.hide(groupTab.innerTabs);
      } else {
        await tabs.show(groupTab.innerTabs);
      }

      StorageHandler.instance.toggleGroupTabVisibility(groupTab);
    }
  }

  //#endregion

  //#region Dragging tab

  /**
   * Handles updating the group tab and inner tabs post dragging
   *
   * IMPORTANT: Should be called if whenever group tab was dragged.
   * @param groupTab The group tab which was moved
   */
  async onStopDragging(groupTab: GroupTab) {
    // Makes sure to only react to user stopping drag
    // This is mostly for stopping user using the context menu Move Tab option
    if (!this.isDraggingFlag) return;

    // Makes sure the inner tabs match group tab info
    // Awaits required to make sure the update won't cause issues
    if (groupTab.isOpen) {
      await tabs.show(groupTab.innerTabs);
    } else {
      await tabs.hide(groupTab.innerTabs);
    }

    this.isDraggingFlag = false;

    // Makes sure that we refresh out of the group tab
    await tabs.update(groupTab.id, { active: true });
  }

  //#endregion

  //#region Group Tab Click

  /**
   *  Reacts to user clicking the group tabs and either hides or shows the tabs inside the group appropriately
   * @param groupTab The group tab that was clicked
   * @param previousTabId The id of tab this was moved from
   */
  private async onGroupTabClick(groupTab: GroupTab, previousTabId?: number) {
    // Makes sure that nothing happens while group tab is empty
    if (groupTab.innerTabs.length) {
      // Checks whether to hide or show by doing opposite
      if (groupTab.isOpen) {
        await tabs.hide(groupTab.innerTabs);
      } else {
        await tabs.show(groupTab.innerTabs);
      }

      StorageHandler.instance.toggleGroupTabVisibility(groupTab);
    }

    findNewActiveTab(previousTabId);

    // Handles dragging timeout to recognize user dragging the tab
    clearTimeout(this.draggingTimeoutID);
    this.draggingTimeoutID = setTimeout(async () => {
      this.draggingTimeoutID = undefined;
    }, 100);
  }

  //#endregion
}
