import { GROUP_TAB_URL } from "../Consts";

/**
 * The settings for the extension
 */
export type Settings = {
  //#region Create

  /**
   * Show the dialog requesting the group tab's name when creating it otherwise uses default name
   */
  showCreateGroupTabNameDialog: { popup: boolean; menu: boolean };

  /**
   * Starting name of the group tab
   */
  defaultGroupTabName: string;

  /**
   * The url for the default group tab icon
   * TODO decide whether to use in future or not
   */
  // defaultGroupTabIconURL: string; // unused

  //#endregion

  //#region Move

  /**
   * Show the dialog asking user are they sure they want to move the tab to the group tab
   */
  showMoveToGroupTabDialog: { drag: boolean; menu: boolean }; // unused

  /**
   * Allows user to drag tabs into group tabs and add them to inner tab, if false just pushes them outside of the group tab
   */
  addTabsByDrag: boolean; // unused

  /**
   * Show the dialog asking user are they sure they want to move the tab from current group to new one
   */
  showMoveFromGroupToNewDialog: { drag: boolean; menu: boolean }; // unused

  //#endregion

  //#region Remove

  /**
   * Show the dialog asking user are they sure they want to remove the tab from the group tab
   */
  showRemoveFromGroupTabDialog: {
    drag: boolean;
    menu: boolean;
    popup: boolean;
  }; // unused

  /**
   * Decides what to do with inner tabs after removing group tab
   */
  removeInnerTabOfDeletedGroupTab: "always" | "dialog" | "never"; // unused

  /**
   * Show the dialog asking user are they sure they want to remove the group tab
   */
  showRemoveGroupTabFromPopupDialog: boolean;
  /**
   * Decides if deleted group tabs (not by window close) can be restored
   */
  removeGroupTabFromMemory: boolean; // unused

  //#endregion

  //#region UI

  /**
   * The inner tabs count in the group tab title
   */
  innerTabCountInName: "prefix" | "postfix" | "non"; // unused

  /**
   * Decides if we show change in title for open/ close groups
   */
  isOpenInName: boolean;

  //#endregion

  //#region Other

  /**
   * Adds end tab in group tab to mark end of group
   */
  useEndTab: boolean; // unused

  /**
   * Activates the closed group mode
   */
  useCloseGroupMode: boolean; // unused

  //#endregion
};

/**
 * Default settings for the extension
 */
export const defaultSettings: Settings = {
  showCreateGroupTabNameDialog: { popup: true, menu: true },
  defaultGroupTabName: "Group Tab",
  // defaultGroupTabIconURL: GROUP_TAB_URL,
  showMoveToGroupTabDialog: { drag: true, menu: false },
  addTabsByDrag: true,
  showMoveFromGroupToNewDialog: { drag: true, menu: false },
  showRemoveFromGroupTabDialog: { drag: true, menu: false, popup: true },

  showRemoveGroupTabFromPopupDialog: true,
  removeInnerTabOfDeletedGroupTab: "dialog",
  removeGroupTabFromMemory: false,
  innerTabCountInName: "prefix",
  isOpenInName: true,
  useEndTab: false,
  useCloseGroupMode: false,
};
