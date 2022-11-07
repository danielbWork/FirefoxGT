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
   * Flag for closed group mode which has the group tab's inner tabs always hidden until user "enters" the group
   */
  isClosedGroupMode: boolean;

  /**
   *
   * @param id The id of the group tab
   * @param name The name of the group tab
   * @param innerTabs The tabs inside the group
   * @param icon The icon for the group tab
   * @param isOpen Whether or not group tab is hiding the tabs
   * @param isClosedGroupMode Whether or not the group tab is in closed group mode
   */
  constructor(
    id: number,
    name: string,
    innerTabs: number[],
    icon?: string,
    isOpen = true,
    isClosedGroupMode = false
  ) {
    this.id = id;
    this.name = name;
    this.innerTabs = innerTabs;
    this.icon = icon;
    this.isOpen = isOpen;
    this.isClosedGroupMode = isClosedGroupMode;
  }
}
