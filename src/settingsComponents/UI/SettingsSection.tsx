import {
  ExpandLess,
  ExpandMore,
  KeyboardArrowRight,
  KeyboardArrowUp,
} from "@mui/icons-material";
import {
  Box,
  Collapse,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import React, { useCallback, useState } from "react";
import { SectionProps, SettingType } from "../SettingsProps";
import { Settings } from "../../utils/Storage/Settings";
import { BooleanSetting } from "./BooleanSetting";
import { MultiBooleanSetting } from "./MultiBooleanSetting";
import { StringSetting } from "./StringSetting";
import { MultipleChoiceStringsSetting } from "./MultipleChoiceStringsSetting";

/**
 * A section to display settings in
 */
export const SettingSection = ({ title, settings }: SectionProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleExpandToggle = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded, setIsExpanded]);

  return (
    <Stack
      spacing={1}
      alignItems="flex-start"
      justifyContent="flex-start"
      direction="column"
      sx={{ width: "100%" }}
    >
      <Typography variant="h5" onClick={handleExpandToggle}>
        <IconButton>
          {isExpanded ? <KeyboardArrowUp /> : <KeyboardArrowRight />}
        </IconButton>{" "}
        {title}
      </Typography>

      <Collapse in={isExpanded}>
        <Box
          alignItems="flex-start"
          justifyContent="flex-start"
          sx={{ paddingLeft: 2, width: "100%", marginTop: 0, marginBottom: 0 }}
        >
          {settings.map((setting) => {
            let settingsItem;

            switch (setting.type) {
              case SettingType.BOOLEAN:
                settingsItem = (
                  <BooleanSetting key={setting.title} {...setting} />
                );
                break;
              case SettingType.MULTI_BOOLEAN:
                settingsItem = (
                  <MultiBooleanSetting key={setting.title} {...setting} />
                );
                break;
              case SettingType.STRING:
                settingsItem = (
                  <StringSetting key={setting.title} {...setting} />
                );
                break;
              case SettingType.MULTIPLE_CHOICE:
                settingsItem = (
                  <MultipleChoiceStringsSetting
                    key={setting.title}
                    {...setting}
                  />
                );
                break;

              default:
                settingsItem = <></>;
                break;
            }

            return settingsItem;
          })}
        </Box>
      </Collapse>
      <Divider
        sx={{
          marginTop: "1",
          height: 1,
          width: 800,
        }}
      />
    </Stack>
  );
};
