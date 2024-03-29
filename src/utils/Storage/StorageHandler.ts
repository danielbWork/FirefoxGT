import { GroupTab } from "../GroupTab";
import {
  onAddTabNotifier,
  onEditGroupTabNotifier,
  onRemoveTabNotifier,
} from "./StorageEventListeners";
import browser, { storage } from "webextension-polyfill";
import { defaultSettings, Settings } from "./Settings";

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

  /**
   * The local value for group tabs
   */
  private groupTabs: Record<number, GroupTab> = {};

  /**
   * Current settings of the extension
   */
  settings: Settings = { ...defaultSettings };

  /**
   * Signifies that we haven't loaded everything yet
   */
  isStartup = true;

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
   * Util to make it easier to update group tabs
   */
  private updateAllGroupTabs() {
    return storage.local.set({ groupTabs: this.groupTabs });
  }

  /**
   * Utils to make easier to update extension settings
   */
  private updateSettings() {
    return storage.local.set({ settings: this.settings });
  }

  /**
   *  Sets up storage default values
   */
  async setupDefaultStorage() {
    this.groupTabs = {};
    this.settings = { ...defaultSettings };
    await storage.local.set({
      groupTabs: this.groupTabs,
      settings: this.settings,
    });
    await this.loadStorage();
  }

  /**
   * Loads specifically the group tabs from the storage
   */
  async loadGroupTabs() {
    const data = await storage.local.get();
    this.groupTabs = data.groupTabs;
  }

  /**
   * Loads storage to local copy, required to be called to get current storage info
   */
  async loadStorage() {
    const data = await storage.local.get();
    this.groupTabs = data.groupTabs;

    // Does this for future proofing new settings as there should always be a default value
    this.settings = { ...defaultSettings, ...data.settings };
  }

  /**
   * Resets the settings back to state in storage
   */
  async resetSettingsToStorage() {
    const data = await storage.local.get();
    this.settings = data.settings;
  }

  /**
   * Restore settings to default
   */
  async restoreDefaultSettings() {
    this.settings = { ...defaultSettings };
    await this.updateSettings();
  }

  /**
   * Restore settings to default
   */
  async applyNewSettings(settings: Settings) {
    this.settings = { ...settings };
    await this.updateSettings();
  }

  /**
   * Gets the group tab from the storage with the id, or undefined if it doesn't exist
   * @param id The id of the tab
   * @returns the group tab belonging to the id or undefined if it doesn't exist
   */
  getGroupTabByID(id: number): GroupTab | undefined {
    return this.groupTabs[id];
  }

  /**
   * Goes over the group tabs and checks to see if the id is either theirs or one of the inner tabs
   * @param id The id of the tab or 0 if nothing is passed
   * @returns Object holding group tab with the id or if the
   *  id belongs to a inner tab then the object returns the index of the inner tab as well as the group tab
   */
  getGroupTabOrInnerTabByID(id = 0) {
    if (this.groupTabs[id]) {
      return { groupTab: this.groupTabs[id] };
    }

    // Finds the group tab with the problem index
    const groupTab = Object.values(this.groupTabs).find((group) => {
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
  getAllGroupTabIDs() {
    return Object.keys(this.groupTabs);
  }

  //#endregion

  //#region Create Group Tab

  /**
   *  Adds a the new group tab to the group tab list
   *
   * @param id The id of the group tab
   * @param name The name of the group tab
   * @param innerTabs The new group tab
   * @param icon The icon of the group tab
   * @param isOpen Whether or not the group is open
   * @param isClosedGroupMode Whether or not the group is in closed group mode
   * @returns The group tab that was created
   * @throws Error when user adds a group tab that was already in the list
   */
  async addGroupTab(
    id: number,
    name: string,
    innerTabs: number[] = [],
    icon?: string,
    isOpen?: boolean,
    isClosedGroupMode?: boolean
  ) {
    if (this.groupTabs[id]) {
      throw "Invalid group tab ID, already exists";
    }

    const newGroupTab = new GroupTab(
      id,
      name,
      innerTabs,
      icon,
      isOpen,
      isClosedGroupMode
    );

    this.groupTabs[id] = newGroupTab;

    await this.updateAllGroupTabs();

    this.onAddTab.addedGroupTab(newGroupTab);

    return newGroupTab;
  }

  /**
   * Adds an inner tab to the group tab
   * @param groupTab The group tab we add the id to
   * @param innerTabID The id of the new inner tab
   * @param index the index to put the new tab in if undefined put in the end of array
   */
  async addInnerTab(groupTab: GroupTab, innerTabID: number, index?: number) {
    // Avoid repeat enters
    if (groupTab.innerTabs.includes(innerTabID)) {
      return;
    }

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

  /**
   * Adds an array of inner tabs to the group tab
   * @param groupTab The group tab we add the id to
   * @param innerTabIDs The ids of the new inner tabs
   * @param index the index to put the new tab in if undefined put in the end of array
   */
  async addInnerTabs(
    groupTab: GroupTab,
    innerTabIDs: number[],
    index?: number
  ) {
    // Avoid repeat enters

    const tabsToAdd = innerTabIDs.filter((id) => {
      return !groupTab.innerTabs.includes(id);
    });

    if (index !== undefined) {
      groupTab.innerTabs.splice(index, 0, ...tabsToAdd);
    } else {
      groupTab.innerTabs.push(...tabsToAdd);
    }

    await this.updateGroupTab(groupTab);

    // Updates about each added tab
    tabsToAdd.forEach((id, toAddIndex) => {
      this.onAddTab.addedInnerTab(
        groupTab,
        toAddIndex +
          (index !== undefined ? index : groupTab.innerTabs.length - 1)
      );
    });
  }

  //#endregion

  //#region Edit Group Tab

  /**
   * Updates the group tab value in the storage
   * @param newGroupTab The new value for the group tab
   *  @param notifyEdit If true notifies about an edit in the group tab
   *
   * @throws Error when user attempts to update a group tab that doesn't exists
   */
  async updateGroupTab(newGroupTab: GroupTab, notifyEdit = false) {
    const id = newGroupTab.id;

    if (!this.groupTabs[id]) {
      throw "Invalid group tab id no such group";
    }

    this.groupTabs[id] = newGroupTab;

    await this.updateAllGroupTabs();

    if (notifyEdit) {
      this.onEditTab.editedGroupTab(newGroupTab);
    }
  }

  /**
   * Toggles the group tab's isOpen value
   * @param groupTab The group tab we update
   *
   * @throws Error when user attempts to update a group tab that doesn't exists
   */
  async toggleGroupTabVisibility(groupTab: GroupTab) {
    groupTab.isOpen = !groupTab.isOpen;

    await this.updateGroupTab(groupTab, true);
  }

  /**
   * Toggles the group tab's isClosedGroupMode value
   * @param groupTab The group tab we update
   *
   * @throws Error when user attempts to update a group tab that doesn't exists
   */
  async toggleGroupTabClosedMode(groupTab: GroupTab) {
    groupTab.isClosedGroupMode = !groupTab.isClosedGroupMode;
    await this.updateGroupTab(groupTab, true);
  }

  /**
   * Updates the name of the group tab
   * @param groupTab The group tab that we update the name of
   * @param name The new name of the group tab
   */
  async updateGroupTabName(groupTab: GroupTab, name: string) {
    groupTab.name = name;
    await this.updateGroupTab(groupTab, true);
  }

  /**
   * Updates the icon of the group tab
   * @param groupTab The group tab that we update the icon of
   * @param name The new icon of the group tab if nothing is passed resets to default icon
   */
  async updateGroupTabIcon(groupTab: GroupTab, icon?: string) {
    groupTab.icon = icon;
    await this.updateGroupTab(groupTab, true);
  }

  /**
   * Replaces a group tab with it's new version
   * @param oldId The original id of the group tab
   * @param id The new id of the group tab
   * @param name The name of the group tab
   * @param innerTabs The inner tabs of the group tab
   * @param icon The icon of the group tab
   * @param isOpen Whether or not the group is open
   * @param isClosedGroupMode Whether or not the group is in closed group mode
   * @returns The new version of the group tab
   */
  async updateGroupTabFromSession(
    oldId: number,
    id: number,
    name: string,
    innerTabs: number[],
    icon?: string,
    isOpen?: boolean,
    isClosedGroupMode?: boolean
  ) {
    const removedGroupTab = this.groupTabs[oldId];

    // Best way to not delete a restored group tab that took this id
    // without some flag
    if (removedGroupTab?.name === name && removedGroupTab?.icon === icon) {
      delete this.groupTabs[oldId];
    }

    const newGroupTab = new GroupTab(
      id,
      name,
      innerTabs,
      icon,
      isOpen,
      isClosedGroupMode
    );

    this.groupTabs[id] = newGroupTab;

    await this.updateAllGroupTabs();

    return newGroupTab;
  }

  //#endregion

  //#region Remove Group Tab

  /**
   * Sets the value of the group tab (or inner tab) in the storage as undefined
   * @param id The Id of the tab that was removed
   *
   */
  async removeTabFromStorage(id: number) {
    // If group tab doesn't exist does nothing
    if (this.groupTabs[id]) {
      const removedGroupTab = this.groupTabs[id];

      delete this.groupTabs[id];
      await this.updateAllGroupTabs();

      this.onRemoveTab.removedGroupTab(removedGroupTab);
    }
    // Checks inner tabs as well
    else {
      const { groupTab, index } = this.getGroupTabOrInnerTabByID(id);

      if (groupTab && index !== undefined) {
        // Removes the deleted inner tab
        groupTab.innerTabs.splice(index, 1);

        this.groupTabs[groupTab.id] = groupTab;
        await this.updateAllGroupTabs();

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
