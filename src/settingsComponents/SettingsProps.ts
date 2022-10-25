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
export type SettingProps = {
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
  value: any;

  /**
   * Callback to notify about user updating the setting
   */
  updateSettingCallback: (newValue: any, isInvalid?: boolean) => void;

  /**
   * Much longer explanation for the setting that goes into "details" (pun intended)
   */
  details?: string;

  /**
   * Whether or not the checkbox should be disabled
   */
  disabled?: boolean;

  /**
   * Inner settings of this settings that are affected by this setting
   */
  childSettings?: { fieldName: string; title: string }[];

  /**
   * Selection of possible value for teh setting
   */
  choices?: { value: string; title: string }[];
};

/**
 * The a collection of settings
 */
export type SectionProps = {
  /**
   * The name of the section
   */
  title: string;

  /**
   * The settings displayed in the section
   */
  settings: SettingProps[];
};
