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
  showMoveToGroupTabDialog: { drag: boolean; menu: boolean };

  /**
   * Allows user to drag tabs into group tabs and add them to inner tab, if false just pushes them outside of the group tab
   */
  addTabsByDrag: boolean;

  /**
   * Show the dialog asking user are they sure they want to move the tab from current group to new one
   */
  showMoveFromGroupToNewDialog: { drag: boolean; menu: boolean };

  //#endregion

  //#region Remove

  /**
   * Show the dialog asking user are they sure they want to remove the tab from the group tab
   */
  showRemoveFromGroupTabDialog: {
    drag: boolean;
    menu: boolean;
    popup: boolean;
  };

  /**
   * Decides what to do with inner tabs after removing group tab
   */
  removeInnerTabOfDeletedGroupTab: "always" | "dialog" | "never";

  /**
   * Show the dialog asking user are they sure they want to remove the group tab
   */
  showRemoveGroupTabFromPopupDialog: boolean;
  /**
   * Decides if deleted group tabs (not by window close) can be restored
   */
  removeGroupTabFromMemory: boolean;

  //#endregion

  //#region UI

  /**
   * The inner tabs count in the group tab title
   */
  innerTabCountInName: "prefix" | "postfix" | "non";

  /**
   * Decides if we show change in title for open/ close groups
   * Commented out as no unicode symbol really fits sadly
   */
  // isOpenInName: boolean; // unused

  //#endregion

  //#region Other

  /**
   * Adds end tab in group tab to mark end of group
   * Commented out as deemed unnecessary might be re-added in the future
   */
  // useEndTab: boolean; // unused

  /**
   * Activates the closed group mode
   * Commented out as this will become an optional feature for each group tab individually
   * might add setting which decides if this mode is default instead maybe with third dialog option
   */
  // useCloseGroupMode: boolean; // unused

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
  // isOpenInName: true,
  // useEndTab: false,
  // useCloseGroupMode: false,
};
