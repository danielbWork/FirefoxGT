import {
  Alert,
  AppBar,
  Avatar,
  Box,
  Button,
  FormControl,
  IconButton,
  Snackbar,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import React, { useCallback, useMemo, useReducer, useState } from "react";
import { Settings } from "../utils/Storage/Settings";
import { useChoiceDialog } from "../utils/ui/useChoiceDialog";
import { ICON_URL } from "../utils/Consts";
import { StorageHandler } from "../utils/Storage/StorageHandler";
import { SectionProps, SettingType } from "./SettingsProps";
import { SettingSection } from "./UI/SettingsSection";
import { Set } from "typescript";
import { useAlertDialog } from "../utils/ui/useAlertDialog";
import Close from "@mui/icons-material/Close";
import {
  SettingUpdateType,
  useSettingsReducer,
} from "../utils/ui/useSettingsReducer";
import { UIMessageHandler } from "../utils/ui/UIMessageHandler";
import { MessageType } from "../utils/MessageType";

/**
 * The settings ui
 */
export const SettingsUI = () => {
  const [settings, dispatch] = useSettingsReducer();
  const [invalidSettings, setInvalidSettings] = useState<Set<string>>(
    new Set<string>()
  );

  // Creates the real callback to be used for updating settings value of the setting with the given name
  const handleCreateUpdateSettingCallback = useCallback((name: string) => {
    return (value: any, isInvalid = false) => {
      // Handles invalid settings
      setInvalidSettings((previousState) => {
        // Add or removes invalid setting accordingly
        if (isInvalid) {
          previousState.add(name);
        } else {
          previousState.delete(name);
        }

        return previousState;
      });

      dispatch({ type: SettingUpdateType.UPDATE_VALUE, name, value });
    };
  }, []);

  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [isShowingSnackbar, setIsShowingSnackbar] = useState(false);

  const handleCloseSnackBar = useCallback(() => {
    setIsShowingSnackbar(false);
    setSnackbarMessage("");
  }, []);

  // Code that restore settings to default
  const handleRestoreDefaults = useCallback(async () => {
    await StorageHandler.instance.restoreDefaultSettings();

    await UIMessageHandler.instance.sendMessage(MessageType.UPDATE_SETTINGS, {
      settings: StorageHandler.instance.settings,
    });

    dispatch({
      type: SettingUpdateType.UPDATE_ALL,
      settings: StorageHandler.instance.settings,
    });

    setSnackbarMessage("Settings restored to default");
    setIsShowingSnackbar(true);
  }, [settings]);

  const {
    dialog: restoreDefaultsDialog,
    openDialog: openRestoreDefaultsDialog,
  } = useChoiceDialog(
    "Restore Defaults",
    "Restores settings back to extension's default values and deletes all of your changes. Are you sure you want to continue?",
    handleRestoreDefaults
  );

  // Code that actually apply's the settings
  const handleApplySetting = useCallback(() => {
    StorageHandler.instance.applyNewSettings(settings).then(async () => {
      await UIMessageHandler.instance.sendMessage(MessageType.UPDATE_SETTINGS, {
        settings,
      });

      setSnackbarMessage("Changes applied to settings");
      setIsShowingSnackbar(true);
    });
  }, [settings]);

  const { dialog: applyChangesDialog, openDialog: openApplyChangesDialog } =
    useChoiceDialog(
      "Apply Changes",
      "Updates the setting in the extension. Are you sure you want to continue?",
      handleApplySetting
    );

  const {
    dialog: invalidSettingsDialog,
    openDialog: openInvalidSettingsDialog,
  } = useAlertDialog(
    "Invalid Settings",
    "Some settings are invalid please fix them to apply changes"
  );

  // Makes sure we have valid settings before applying
  const handleOnApplyPress = useCallback(() => {
    // No invalid setting no problems
    if (invalidSettings.size === 0) {
      openApplyChangesDialog();
    } else {
      openInvalidSettingsDialog();
    }
  }, [invalidSettings]);

  //#endregion

  //#region Sections

  // Section regarding creating
  const createSection = useMemo<SectionProps>(() => {
    return {
      title: "Create",
      settings: [
        {
          type: SettingType.MULTI_BOOLEAN,
          title: "Request name of group tab on create",
          value: settings.showCreateGroupTabNameDialog,
          updateSettingCallback: handleCreateUpdateSettingCallback(
            "showCreateGroupTabNameDialog"
          ),
          details:
            "When enabled shows dialog asking user for a name when creating a group tab otherwise created group tabs will be named with the default name",
          childSettings: [
            {
              title: "Show in popup",
              fieldName: "popup",
            },
            {
              title: "Show in menu",
              fieldName: "menu",
            },
          ],
        },
        {
          type: SettingType.STRING,
          title: "Default Group Tab Name",
          value: settings.defaultGroupTabName,
          updateSettingCallback: handleCreateUpdateSettingCallback(
            "defaultGroupTabName"
          ),
          details: "The default name given to a group tab",
        },
      ],
    };
  }, [settings.showCreateGroupTabNameDialog, settings.defaultGroupTabName]);

  // Section regarding moving and dragging moving
  const moveSection = useMemo<SectionProps>(() => {
    return {
      title: "Move",
      settings: [
        {
          type: SettingType.MULTI_BOOLEAN,
          title: "Display confirm moving tab to group dialog",
          value: settings.showMoveToGroupTabDialog,
          updateSettingCallback: handleCreateUpdateSettingCallback(
            "showMoveToGroupTabDialog"
          ),
          details:
            "When enabled shows dialog asking user are they sure they want to move the tab to group tab",
          childSettings: [
            {
              title: "Show on tab drag",
              fieldName: "drag",
            },
            {
              title: "Show on menu move",
              fieldName: "menu",
            },
          ],
        },
        {
          type: SettingType.BOOLEAN,
          title: "Enable drag tabs into group tabs",
          value: settings.addTabsByDrag,
          updateSettingCallback:
            handleCreateUpdateSettingCallback("addTabsByDrag"),
          details:
            "If disabled tabs (that aren't already in a group tab) are dragged into group tabs by user are moved outside of group tab automatically",
        },
        {
          type: SettingType.MULTI_BOOLEAN,
          title: "Display confirm moving tab to other group dialog",
          value: settings.showMoveFromGroupToNewDialog,
          updateSettingCallback: handleCreateUpdateSettingCallback(
            "showMoveFromGroupToNewDialog"
          ),
          details:
            "When enabled shows dialog asking user are they sure they want to move a tab from one group tab to another group tab",
          childSettings: [
            {
              title: "Show on tab drag",
              fieldName: "drag",
            },
            {
              title: "Show on menu move",
              fieldName: "menu",
            },
          ],
        },
      ],
    };
  }, [
    settings.addTabsByDrag,
    settings.showMoveToGroupTabDialog,
    settings.showMoveFromGroupToNewDialog,
  ]);

  // Section regarding deleting tabs
  const removeSection = useMemo<SectionProps>(() => {
    return {
      title: "Remove",
      settings: [
        {
          type: SettingType.MULTI_BOOLEAN,
          title: "Display confirm remove tab from group dialog",
          value: settings.showRemoveFromGroupTabDialog,
          updateSettingCallback: handleCreateUpdateSettingCallback(
            "showRemoveFromGroupTabDialog"
          ),
          details:
            "When enabled shows dialog asking user are they sure they want to remove the tab from the group tab",
          childSettings: [
            {
              title: "Show on tab drag",
              fieldName: "drag",
            },
            {
              title: "Show on menu remove",
              fieldName: "menu",
            },
            {
              title: "Show on popup remove",
              fieldName: "popup",
            },
          ],
        },
        {
          type: SettingType.MULTIPLE_CHOICE,
          title: "Handle inner tabs of removed group tab",
          value: settings.removeInnerTabOfDeletedGroupTab,
          updateSettingCallback: handleCreateUpdateSettingCallback(
            "removeInnerTabOfDeletedGroupTab"
          ),
          details:
            "Allows to select what will happen to inner tabs after the removal of a group tab",
          choices: [
            { value: "always", title: "Always delete inner tabs" },
            { value: "dialog", title: "Display dialog to confirm deletion" },
            { value: "never", title: "Always keep inner tabs" },
          ],
        },
        {
          type: SettingType.BOOLEAN,
          title: "Display confirm remove group tab dialog",
          value: settings.showRemoveGroupTabFromPopupDialog,
          updateSettingCallback: handleCreateUpdateSettingCallback(
            "showRemoveGroupTabFromPopupDialog"
          ),
          details:
            "When enabled shows dialog asking user are they sure they want to remove the group tab when attempting to remove from popup",
        },
        {
          type: SettingType.BOOLEAN,
          title: "Remove group tab from history on close",
          value: settings.removeGroupTabFromMemory,
          updateSettingCallback: handleCreateUpdateSettingCallback(
            "removeGroupTabFromMemory"
          ),
          details:
            "When user closes group tab this setting decides wether or not to remove it from browser history",
        },
      ],
    };
  }, [
    settings.showRemoveFromGroupTabDialog,
    settings.removeInnerTabOfDeletedGroupTab,
    settings.showRemoveGroupTabFromPopupDialog,
    settings.removeGroupTabFromMemory,
  ]);

  // Section certain regarding ui aspects
  const uiSection = useMemo<SectionProps>(() => {
    return {
      title: "UI",
      settings: [
        {
          type: SettingType.MULTIPLE_CHOICE,
          title: "Display inner tab count in group tab title",
          value: settings.innerTabCountInName,
          updateSettingCallback: handleCreateUpdateSettingCallback(
            "innerTabCountInName"
          ),
          details:
            "Allows to select whether or not and where the inner tab count will be displayed in the group tab title",
          choices: [
            { value: "prefix", title: "Show as prefix" },
            { value: "postfix", title: "Show as postfix" },
            { value: "non", title: "Don't show" },
          ],
        },
        // {
        //   type: SettingType.BOOLEAN,
        //   title: "Display is group tab open in title",
        //   value: settings.isOpenInName,
        //   updateSettingCallback:
        //     handleCreateUpdateSettingCallback("isOpenInName"),
        //   details:
        //     "When enabled shows small icon at the start of the group tab title marking if the group tab is open or not. The icon will be before the inner tab count if it's in prefix mode",
        // },
      ],
    };
  }, [settings.innerTabCountInName /*settings.isOpenInName*/]);

  // Section for other settings that don't fit other categories
  const otherSection = useMemo<SectionProps>(() => {
    return {
      title: "Other",
      settings: [
        {
          type: SettingType.BOOLEAN,
          title: "Display end tab",
          value: settings.useEndTab,
          updateSettingCallback: handleCreateUpdateSettingCallback("useEndTab"),
          details:
            "Adds an end tab to mark the end for the group tab while it's open",
        },
        {
          type: SettingType.BOOLEAN,
          title: "Activate closed group mode",
          value: settings.useCloseGroupMode,
          updateSettingCallback:
            handleCreateUpdateSettingCallback("useCloseGroupMode"),
          details:
            "Closed group mode is a spacial mode where group tabs are closed at all times until pressed, once pressed they will be open and their inner tabs will be displayed. Once the user enters another tab in the window which isn't in the group tab the group tab will automatically close. In this mode group tabs are enterable and have a unique ui",
        },
      ],
    };
  }, [settings.useEndTab, settings.useCloseGroupMode]);

  // Separately creates each section so only it will need to update that section in the ui
  const sections = [
    createSection,
    moveSection,
    removeSection,
    uiSection,
    otherSection,
  ];

  //#endregion

  return (
    <FormControl sx={{ overflow: "scroll" }}>
      {restoreDefaultsDialog}
      {applyChangesDialog}
      {invalidSettingsDialog}

      <Snackbar
        open={isShowingSnackbar}
        autoHideDuration={5000}
        onClose={handleCloseSnackBar}
      >
        <Alert
          severity="info"
          action={
            <IconButton
              size="small"
              aria-label="close"
              color="inherit"
              onClick={handleCloseSnackBar}
            >
              <Close fontSize="small" />
            </IconButton>
          }
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      <Stack
        spacing={1}
        alignItems="flex-start"
        justifyContent="flex-start"
        direction="column"
        sx={{ paddingLeft: 2, paddingTop: 4, width: "100%", height: "100%" }}
      >
        <Box alignItems="center" justifyContent="center" paddingTop={8}>
          <AppBar position="fixed">
            <Toolbar sx={{ alignItems: "center" }}>
              <Avatar
                src={ICON_URL}
                sx={{
                  width: 48,
                  height: 48,
                  marginRight: 2,
                }}
              />
              <Typography
                variant="h4"
                color="InfoText"
                sx={{
                  paddingTop: 1,
                }}
              >
                FirefoxGT Settings
              </Typography>

              <Stack
                direction="row"
                spacing={2}
                alignSelf="center"
                sx={{ right: 0, position: "absolute", paddingRight: 10 }}
              >
                <Button
                  variant="outlined"
                  onClick={() => {
                    openRestoreDefaultsDialog();
                  }}
                >
                  Restore to default
                </Button>
                <Button variant="contained" onClick={handleOnApplyPress}>
                  Apply
                </Button>
              </Stack>
            </Toolbar>
          </AppBar>
        </Box>

        {sections.map((section) => (
          <SettingSection key={section.title} {...section} />
        ))}
      </Stack>
    </FormControl>
  );
};
