import {
  Avatar,
  Box,
  Button,
  FormControl,
  Stack,
  Typography,
} from "@mui/material";
import React, { useCallback, useMemo, useState } from "react";
import { Settings } from "utils/Storage/Settings";
import { ICON_URL } from "../utils/Consts";
import { StorageHandler } from "../utils/Storage/StorageHandler";
import { Section, SettingType } from "./SettingTypes";
import { SettingSection } from "./UI/SettingsSection";

/**
 * The settings ui
 */
export const SettingsUI = () => {
  const [settings, setSettings] = useState<Settings>({
    ...StorageHandler.instance.settings,
  });

  // Creates the real callback to be used for updating settings value of the setting with the given name
  const handleCreateUpdateSettingCallback = useCallback((name: string) => {
    return (value: any) => {
      setSettings((previousState) => {
        // as any included to remove warning
        (previousState as any)[name] = value;
        return { ...previousState };
      });
    };
  }, []);

  // Section regarding creating
  const createSection = useMemo<Section>(() => {
    return { title: "Create", settings: [] };
  }, []);

  // Section regarding moving and dragging moving
  const moveSection = useMemo<Section>(() => {
    return {
      title: "Move",
      settings: [
        {
          type: SettingType.BOOLEAN,
          title: "Enable drag tabs into group tabs",
          value: settings.addTabsByDrag,
          updateSettingCallback:
            handleCreateUpdateSettingCallback("addTabsByDrag"),
          details:
            "If disabled tabs dragged into group tabs by user are moved outside of group tab automatically",
        },
      ],
    };
  }, [settings.addTabsByDrag]);

  // Section regarding deleting tabs
  const removeSection = useMemo<Section>(() => {
    return {
      title: "Remove",
      settings: [
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
  }, [settings.removeGroupTabFromMemory]);

  // Section certain regarding ui aspects
  const uiSection = useMemo<Section>(() => {
    return { title: "UI", settings: [] };
  }, []);

  // Section for other settings that don't fit other categories
  const otherSection = useMemo<Section>(() => {
    return { title: "Other", settings: [] };
  }, []);

  // Separately creates each section so only it will need to update that section in the ui
  const sections = [
    createSection,
    moveSection,
    removeSection,
    uiSection,
    otherSection,
  ];

  return (
    <FormControl sx={{ overflow: "scroll" }}>
      <Stack
        spacing={1}
        alignItems="flex-start"
        justifyContent="flex-start"
        direction="column"
        sx={{ paddingLeft: 6, paddingTop: 4, width: "100%", height: "100%" }}
      >
        <Box alignItems="center" justifyContent="center">
          <Typography
            variant="h4"
            color="InfoText"
            sx={{
              verticalAlign: "middle",
              display: "inline-flex",
              lineHeight: "unset",
            }}
          >
            <Avatar
              src={ICON_URL}
              sx={{
                width: 48,
                height: 48,
                marginRight: 2,
              }}
            />
            FirefoxGT Settings
          </Typography>
        </Box>

        {sections.map((section) => (
          <SettingSection key={section.title} {...section} />
        ))}

        <Stack
          direction="row"
          spacing={2}
          alignSelf="end"
          sx={{ paddingBottom: 10 }}
        >
          <Button variant="outlined">Restore to default</Button>
          <Button variant="contained">Apply</Button>
        </Stack>
      </Stack>
    </FormControl>
  );
};
