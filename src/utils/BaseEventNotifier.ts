/**
 * Base class for notifiers
 */
export abstract class BaseEventNotifier<T> {
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
