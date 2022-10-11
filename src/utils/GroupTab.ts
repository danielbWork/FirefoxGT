/**
 * A simple representation of a group tab
 */
export class GroupTab {
  /**
   * The id of the group tab
   */
  readonly id: number;

  /**
   * The name of the group tab
   */
  name: string;

  /**
   * The tabs inside the group
   */
  innerTabs: number[];

  /**
   * Whether or not user group tab is hiding the tabs
   */
  isOpen: boolean;

  /**
   * The icon of the group tab
   */
  icon?: string;

  /**
   *
   * @param id The id of the group tab
   * @param name The name of the group tab
   * @param innerTabs The tabs inside the group
   * @param isOpen Whether or not user group tab is hiding the tabs
   * @param icon The icon for the group tab
   */
  constructor(
    id: number,
    name: string,
    innerTabs: number[],
    isOpen = true,
    icon?: string
  ) {
    this.id = id;
    this.name = name;
    this.innerTabs = innerTabs;
    this.isOpen = isOpen;
    this.icon = icon;
  }
}
