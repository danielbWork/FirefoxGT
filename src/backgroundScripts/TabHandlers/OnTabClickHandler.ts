import { GroupTab } from "../../utils/GroupTab";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { TOGGLE_GROUP_TAB_ID } from "../../utils/Consts";
import browser, { Tabs, Menus, tabs } from "webextension-polyfill";
import { getActiveTab } from "../../utils/Utils";

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

        this.findNewActiveTab(groupTab, activeInfo.previousTabId);
      } else {
        this.onGroupTabClick(groupTab, activeInfo.previousTabId!);
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
      const groupTab = StorageHandler.instance.getGroupTabByID(tab!.id!);

      const activeTab = await getActiveTab();

      await this.onGroupTabClick(groupTab!, activeTab.id!);
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
  private async onGroupTabClick(groupTab: GroupTab, previousTabId: number) {
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

    this.findNewActiveTab(groupTab, previousTabId);

    // Handles dragging timeout to recognize user dragging the tab
    clearTimeout(this.draggingTimeoutID);
    this.draggingTimeoutID = setTimeout(async () => {
      this.draggingTimeoutID = undefined;
    }, 100);
  }

  /**
   * Finds a valid tab to move to once the group is hidden, otherwise creates a new tab
   *
   * @param groupTab The group tab that we want to move from
   * @param previousTabId The id of tab this was moved from
   */
  private async findNewActiveTab(
    groupTab: GroupTab,
    previousTabId: number | undefined
  ) {
    // Called when user closes tab which leads to moving to group tab
    if (previousTabId === undefined) {
      tabs.create({ active: true });
      return;
    }

    // Handles when user closed current tab and goes to group tab but previousTabId was defined
    const handleUpdateError = (error: any) => {
      // Caused by closing into group tab
      console.log(error);

      // Creates a new tab instead
      tabs.create({ active: true });
    };

    // Checks if we can just go back to previous tab
    if (!groupTab.innerTabs.includes(previousTabId)) {
      await tabs
        .update(previousTabId, { active: true })
        .catch(handleUpdateError);

      return;
    }

    let otherTabs = await tabs.query({
      hidden: false,
      currentWindow: true,
    });

    // Checks if window only has single closed group tab
    if (otherTabs.length === 1) {
      tabs.create({ active: true });
      return;
    }

    const groupTabIDs = StorageHandler.instance.getAllGroupTabIDs();

    // Filters for tabs that are neither a group tab or one of the inner tab about to be hidden
    const validTabs = otherTabs.filter((value) => {
      const id = value.id;

      return (
        id && !groupTabIDs.includes(`${id}`) && !groupTab.innerTabs.includes(id)
      );
    });

    if (validTabs.length > 0) {
      // Currently goes for the first option might change in future
      tabs.update(validTabs[0].id, { active: true }).catch(handleUpdateError);
    } else {
      tabs.create({ active: true });
    }
  }

  //#endregion
}
