/**
 * The various setting types that a setting can be
 */
export enum SettingType {
  BOOLEAN,
  MULTI_BOOLEAN,
  MULTIPLE_CHOICE,
  STRING,
}

/**
 * The actual settings and it's info
 */
export type Setting = {
  /**
   * The type of the section
   */
  type: SettingType;

  /**
   * Basic title for the setting to explain what it does
   */
  title: string;

  /**
   * The value of the setting
   */
  value: boolean;

  /**
   * Callback to notify about user updating the setting
   */
  updateSettingCallback: (newValue: boolean) => void;

  /**
   * Much longer explanation for the setting that goes into "details" (pun intended)
   */
  details?: string;

  /**
   * Wether or not the checkbox should be disabled
   */
  disabled?: boolean;

  /**
   * Inner settings of this settings that are affected by this setting
   */
  childSettings?: Setting[];
};

/**
 * The a collection of settings
 */
export type Section = {
  /**
   * The name of the section
   */
  title: string;

  /**
   * The settings displayed in the section
   */
  settings: Setting[];
};
