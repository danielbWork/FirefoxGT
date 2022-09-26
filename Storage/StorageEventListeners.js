import { GroupTab } from "../backgroundScripts/GroupTab.js";

//TODO Maybe change to classes (check if matters)

/**
 * Base class for notifiers
 */
class BaseEventNotifier {
  /**
   * @property The array of listeners notified
   */
  listeners;

  constructor() {
    this.listeners = [];
  }

  /**
   * Adds a listener to be notified when events happen
   * @param {*} listener The listener we add
   */
  addListener(listener) {
    this.listeners.push(listener);
  }

  /**
   * Removes a listener from being notified
   * @param {*} listener The listener we remove
   */
  removeListener(listener) {
    this.listeners = this.listeners.filter((value) => value !== listener);
  }
}

/**
 * Notifies when group tab / inner tab is added.
 *
 * Uses Listeners of type (groupTab : GroupTab, index: number | undefined)=>void where
 * groupTab is the group tab that was either added or added a inner tab, and the index
 * passed is the index of the inner tab if it was added otherwise undefined.
 *
 */
export class onAddTabNotifier extends BaseEventNotifier {
  constructor() {
    super();
  }

  /**
   * Notifies all listeners about group tab
   * @param {GroupTab} groupTab The new group tab
   */
  addedGroupTab(groupTab) {
    console.log(groupTab);

    this.listeners.forEach((listener) => {
      listener(groupTab);
    });
  }

  /**
   * Notifies all listeners about inner tab
   * @param {GroupTab} groupTab The group tab with the new inner tab
   * @param {number} index The index of the new inner tab
   */
  addedInnerTab(groupTab, index) {
    this.listeners.forEach((listener) => {
      listener(groupTab, index);
    });
  }
}

/**
 * Notifies when group tab / inner tab is removed.
 *
 * Uses Listeners of type (groupTab : GroupTab, index: number | undefined)=>void where
 * groupTab is the group tab that was either removed or removed a inner tab, and the index
 * passed is the index of the inner tab if it was removed otherwise undefined.
 *
 */
export class onRemoveTabNotifier extends BaseEventNotifier {
  constructor() {
    super();
  }

  /**
   * Notifies all listeners about group tab
   * @param {GroupTab} groupTab The removed group tab
   */
  removedGroupTab(groupTab) {
    this.listeners.forEach((listener) => {
      listener(groupTab);
    });
  }

  /**
   * Notifies all listeners about removed inner tab
   * @param {GroupTab} groupTab The group tab which held the inner tab
   * @param {number} index The index of the removed inner tab
   */
  removedInnerTab(groupTab) {
    this.listeners.forEach((listener) => {
      listener(groupTab, index);
    });
  }
}

/**
 * Notifies when group tab was changed in some way (not including removing a inner tab)
 *
 * Uses Listeners of type (groupTab : GroupTab)=>void where groupTab is the group tab that was edited
 */
export class onEditGroupTabNotifier extends BaseEventNotifier {
  constructor() {
    super();
  }

  /**
   * Notifies all listeners about group tab
   * @param {GroupTab} groupTab The edited group tab
   */
  editedGroupTab(groupTab) {
    this.listeners.forEach((listener) => {
      listener(groupTab);
    });
  }
}
