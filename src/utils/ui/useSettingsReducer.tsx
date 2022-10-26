import { useCallback, useReducer } from "react";
import { StorageHandler } from "../Storage/StorageHandler";
import { Settings } from "../Storage/Settings";

/**
 * The type of update being done to the setting
 */
export enum SettingUpdateType {
  UPDATE_VALUE,
  UPDATE_ALL,
}

/**
 * The action being done to the settings
 */
type UpdateAction =
  | { type: SettingUpdateType.UPDATE_VALUE; name: string; value: any }
  | { type: SettingUpdateType.UPDATE_ALL; settings: Settings };

/**
 * A reducer for handling the settings
 *  @returns Both settings and dispatch to update the settings with
 */
export const useSettingsReducer = (): [
  Settings,
  React.Dispatch<UpdateAction>
] => {
  const settingsReducer = useCallback(
    (state: Settings, action: UpdateAction) => {
      let newState: Settings;

      switch (action.type) {
        case SettingUpdateType.UPDATE_VALUE:
          newState = { ...state };
          (newState as any)[action.name] = action.value;

          break;
        case SettingUpdateType.UPDATE_ALL:
          newState = { ...action.settings };
          break;

        default:
          newState = { ...state };

          break;
      }

      return newState;
    },
    []
  );

  const [settings, dispatch] = useReducer(settingsReducer, {
    ...StorageHandler.instance.settings,
  });

  return [settings, dispatch];
};
