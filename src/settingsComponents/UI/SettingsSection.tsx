import { ExpandLess, ExpandMore } from "@mui/icons-material";
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
  const [isExpanded, setIsExpanded] = useState(true);

  const handleExpandToggle = useCallback(() => {
    setIsExpanded(!isExpanded);
  }, [isExpanded, setIsExpanded]);

  return (
    <Stack
      spacing={2}
      alignItems="flex-start"
      justifyContent="flex-start"
      direction="column"
      sx={{ padding: 1, width: "100%" }}
    >
      <Typography variant="h5" color="InfoText">
        {title}{" "}
        <IconButton onClick={handleExpandToggle}>
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Typography>

      <Collapse in={isExpanded}>
        <Box
          alignItems="flex-start"
          justifyContent="flex-start"
          sx={{ paddingLeft: 2, width: "100%", marginTop: 0, marginBottom: 0 }}
        >
          {settings.map((setting) => {
            if (setting.type === SettingType.BOOLEAN) {
              return <BooleanSetting key={setting.title} {...setting} />;
            }

            if (setting.type === SettingType.MULTI_BOOLEAN) {
              return <MultiBooleanSetting key={setting.title} {...setting} />;
            }

            if (setting.type === SettingType.STRING) {
              return <StringSetting key={setting.title} {...setting} />;
            }

            if (setting.type === SettingType.MULTIPLE_CHOICE) {
              return (
                <MultipleChoiceStringsSetting
                  key={setting.title}
                  {...setting}
                />
              );
            }

            return <></>;
          })}
        </Box>
      </Collapse>
      <Divider
        sx={{ backgroundColor: "InactiveBorder", height: 1, width: 800 }}
      />
    </Stack>
  );
};
