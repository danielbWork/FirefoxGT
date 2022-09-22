/**
 * A simple representation of a group tab
 */
export class GroupTab {
  /**
   * The id of the group tab
   */
  id;

  /**
   * The name of the group tab
   */
  name;

  /**
   * The tabs inside the group
   */
  innerTabs;

  /**
   * Whether or not user group tab is hiding the tabs
   */
  isOpen;

  /**
   *
   * @param {number} id The id of the group tab
   * @param {string} name The name of the group tab
   * @param {number[]} innerTabs The tabs inside the group
   * @param {boolean} isOpen Whether or not user group tab is hiding the tabs
   */
  constructor(id, name, innerTabs, isOpen = true) {
    this.id = id;
    this.name = name;
    this.innerTabs = innerTabs;
    this.isOpen = isOpen;
  }
}
