import { GroupTab } from "../GroupTab";
import {
  onAddTabNotifier,
  onEditGroupTabNotifier,
  onRemoveTabNotifier,
} from "./StorageEventListeners";
import browser, { storage } from "webextension-polyfill";

/**
 * Handles connecting with the storage to store all info regarding the extension.
 *
 * Important note: Since the background page is in a "different context" to popup and rest of
 * the extension it has it's own instance of this class (so much for singleton) for now the
 * fix is using the messaging api
 */
export class StorageHandler {
  /**
   *  Notifies about group and inner tabs being added
   */
  readonly onAddTab = new onAddTabNotifier();

  /**
   *  Notifies about group and inner tabs being removed
   */
  readonly onRemoveTab = new onRemoveTabNotifier();

  /**
   *  Notifies about group tabs being edited
   */
  readonly onEditTab = new onEditGroupTabNotifier();

  //#region Singleton

  private static _instance: StorageHandler;

  private constructor() {}

  /**
   * @returns The instance of the class
   */
  public static get instance(): StorageHandler {
    if (!StorageHandler._instance) {
      StorageHandler._instance = new StorageHandler();
    }

    return StorageHandler._instance;
  }

  //#endregion

  //#region Util Functions

  /**
   * Util to make it easier to get group tabs
   * @returns The group tabs
   */
  private async getAllGroupTabs(): Promise<Record<number, GroupTab>> {
    let { groupTabs } = await storage.local.get("groupTabs");
    return groupTabs;
  }

  /**
   * Util to make it easier to update group tabs
   * @param groupTabs The group tabs we want to set in the storage
   */
  private async updateAllGroupTabs(groupTabs: Record<number, GroupTab>) {
    await storage.local.set({ groupTabs });
  }

  /**
   *  Sets up storage default values
   */
  setupStorage() {
    this.updateAllGroupTabs({});
  }

  /**
   * Gets the group tab from the storage with the id, or undefined if it doesn't exist
   * @param id The id of the tab
   * @returns the group tab belonging to the id or undefined if it doesn't exist
   */
  async getGroupTabByID(id: number): Promise<GroupTab | undefined> {
    const groupTabs = await this.getAllGroupTabs();
    return groupTabs[id];
  }

  /**
   * Goes over the group tabs and checks to see if the id is either theirs or one of the inner tabs
   * @param id The id of the tab or 0 if nothing is passed
   * @returns Object holding group tab with the id or if the
   *  id belongs to a inner tab then the object returns the index of the inner tab as well as the group tab
   */
  async getGroupTabOrInnerTabByID(id = 0) {
    const groupTabs = await this.getAllGroupTabs();

    if (groupTabs[id]) {
      return { groupTab: groupTabs[id] };
    }

    // Finds the group tab with the problem index
    const groupTab = Object.values(groupTabs).find((group) => {
      return group.innerTabs.includes(id);
    });

    // No group tab or inner tab with this id
    if (!groupTab) {
      return {};
    }

    const index = groupTab.innerTabs.indexOf(id);

    return { groupTab, index };
  }

  /**
   * Gets all the ids of the group tabs.
   * @returns An array of all the group tab ids
   */
  async getAllGroupTabIDs() {
    const groupTabs = await this.getAllGroupTabs();
    return Object.keys(groupTabs);
  }

  //#endregion

  //#region Create Group Tab

  /**
   *  Adds a the new group tab to the group tab list
   *
   * @param id The id of the group tab
   * @param name The name of the group tab
   * @param innerTabs The new group tab
   *
   * @throws Error when user adds a group tab that was already in the list
   */
  async addGroupTab(id: number, name: string, innerTabs: number[] = []) {
    let groupTabs = await this.getAllGroupTabs();

    if (groupTabs[id]) {
      throw "Invalid group tab ID, already exists";
    }

    const newGroupTab = new GroupTab(id, name, innerTabs);

    groupTabs[id] = newGroupTab;

    await this.updateAllGroupTabs(groupTabs);

    this.onAddTab.addedGroupTab(newGroupTab);
  }

  /**
   * Adds an inner tab to the group tab
   * @param groupTab The group tab we add the id to
   * @param innerTabID The id of the new inner tab
   * @param index the index to put the new tab in if undefined put in the end of array
   */
  async addInnerTab(groupTab: GroupTab, innerTabID: number, index?: number) {
    if (index !== undefined) {
      groupTab.innerTabs.splice(index, 0, innerTabID);
    } else {
      groupTab.innerTabs.push(innerTabID);
    }

    await this.updateGroupTab(groupTab);

    this.onAddTab.addedInnerTab(
      groupTab,
      index !== undefined ? index : groupTab.innerTabs.length - 1
    );
  }

  //#endregion

  //#region Edit Group Tab

  /**
   * Updates the group tab value in the storage
   * @param newGroupTab The new value for the group tab
   *
   * @throws Error when user attempts to update a group tab that doesn't exists
   */
  async updateGroupTab(newGroupTab: GroupTab) {
    let groupTabs = await this.getAllGroupTabs();

    const id = newGroupTab.id;

    if (!groupTabs[id]) {
      throw "Invalid group tab id no such group";
    }

    groupTabs[id] = newGroupTab;

    await this.updateAllGroupTabs(groupTabs);
  }

  /**
   * Toggles the group tab's isHidingTabs value
   * @param groupTab The group tab we update
   *
   * @throws Error when user attempts to update a group tab that doesn't exists
   */
  async toggleGroupTabVisibility(groupTab: GroupTab) {
    groupTab.isOpen = !groupTab.isOpen;
    await this.updateGroupTab(groupTab);

    this.onEditTab.editedGroupTab(groupTab);
  }

  /**
   * Updates the name of the group tab
   * @param groupTab The group tab that we update the name of
   * @param name The new name of the group tab
   */
  async updateGroupTabName(groupTab: GroupTab, name: string) {
    groupTab.name = name;
    await this.updateGroupTab(groupTab);

    this.onEditTab.editedGroupTab(groupTab);
  }

  /**
   * Updates the icon of the group tab
   * @param groupTab The group tab that we update the icon of
   * @param name The new icon of the group tab if nothing is passed resets to default icon
   */
  async updateGroupTabIcon(groupTab: GroupTab, icon?: string) {
    groupTab.icon = icon;
    await this.updateGroupTab(groupTab);

    this.onEditTab.editedGroupTab(groupTab);
  }

  //#endregion

  //#region Remove Group Tab

  /**
   * Sets the value of the group tab (or inner tab) in the storage as undefined
   * @param id The Id of the tab that was removed
   *
   */
  async removeTabFromStorage(id: number) {
    let groupTabs = await this.getAllGroupTabs();

    // If group tab doesn't exist does nothing
    if (groupTabs[id]) {
      const removedGroupTab = groupTabs[id];

      delete groupTabs[id];
      await this.updateAllGroupTabs(groupTabs);

      this.onRemoveTab.removedGroupTab(removedGroupTab);
    }
    // Checks inner tabs as well
    else {
      const { groupTab, index } = await this.getGroupTabOrInnerTabByID(id);

      if (groupTab && index !== undefined) {
        // Removes the deleted inner tab
        groupTab.innerTabs.splice(index, 1);

        groupTabs[groupTab.id] = groupTab;
        await this.updateAllGroupTabs(groupTabs);

        this.onRemoveTab.removedInnerTab(groupTab, id);
      }
    }
  }

  /**
   * Removes an inner tab from the group tab
   * @param groupTab The group tab we remove the id from
   * @param innerTabID The id of the to be removed inner tab
   */
  async removeInnerTab(groupTab: GroupTab, innerTabID: number) {
    const index = groupTab.innerTabs.findIndex((id) => id === innerTabID);

    if (index === undefined) throw new Error("innerTabID doesn't exist");

    groupTab.innerTabs.splice(index, 1);

    await this.updateGroupTab(groupTab);

    this.onRemoveTab.removedInnerTab(groupTab, innerTabID);
  }

  //#endregion
}
