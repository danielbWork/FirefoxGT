import { GroupTab } from "../GroupTab.js";

/**
 * Base class for notifiers
 */
abstract class BaseEventNotifier<T> {
  /**
   * @property The array of listeners notified
   */
  protected listeners: T[] = [];

  constructor() {}

  /**
   * Adds a listener to be notified when events happen
   * @param listener The listener we add
   */
  addListener(listener: T) {
    this.listeners.push(listener);
  }

  /**
   * Removes a listener from being notified
   * @param listener The listener we remove
   */
  removeListener(listener: T) {
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
export class onAddTabNotifier extends BaseEventNotifier<
  (groupTab: GroupTab, index?: number) => void
> {
  constructor() {
    super();
  }

  /**
   * Notifies all listeners about group tab
   * @param groupTab The new group tab
   */
  addedGroupTab(groupTab: GroupTab) {
    this.listeners.forEach((listener) => {
      listener(groupTab);
    });
  }

  /**
   * Notifies all listeners about inner tab
   * @param groupTab The group tab with the new inner tab
   * @param index The index of the new inner tab
   */
  addedInnerTab(groupTab: GroupTab, index: number) {
    this.listeners.forEach((listener) => {
      listener(groupTab, index);
    });
  }
}

/**
 * Notifies when group tab / inner tab is removed.
 *
 * Uses Listeners of type (groupTab : GroupTab, id: number | undefined)=>void where
 * groupTab is the group tab that was either removed or removed a inner tab, and the index
 * passed is the id of the inner tab if it was removed otherwise undefined.
 *
 */
export class onRemoveTabNotifier extends BaseEventNotifier<
  (groupTab: GroupTab, id?: number) => void
> {
  constructor() {
    super();
  }

  /**
   * Notifies all listeners about group tab
   * @param groupTab The removed group tab
   */
  removedGroupTab(groupTab: GroupTab) {
    this.listeners.forEach((listener) => {
      listener(groupTab);
    });
  }

  /**
   * Notifies all listeners about removed inner tab
   * @param groupTab The group tab which held the inner tab
   * @param id The id of the removed inner tab
   */
  removedInnerTab(groupTab: GroupTab, id: number) {
    this.listeners.forEach((listener) => {
      listener(groupTab, id);
    });
  }
}

/**
 * Notifies when group tab was changed in some way (not including removing a inner tab)
 *
 * Uses Listeners of type (groupTab : GroupTab)=>void where groupTab is the group tab that was edited
 */
export class onEditGroupTabNotifier extends BaseEventNotifier<
  (groupTab: GroupTab) => void
> {
  constructor() {
    super();
  }

  /**
   * Notifies all listeners about group tab
   * @param groupTab The edited group tab
   */
  editedGroupTab(groupTab: GroupTab) {
    this.listeners.forEach((listener) => {
      listener(groupTab);
    });
  }
}
