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
import { Section, SettingType } from "../SettingTypes";
import { Settings } from "../../utils/Storage/Settings";
import { BooleanSetting } from "./BooleanSetting";

/**
 * A section to display settings in
 */
export const SettingSection = ({ title, settings }: Section) => {
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
      sx={{ padding: 2, width: "100%" }}
    >
      <Typography variant="h5" color="InfoText">
        {title}{" "}
        <IconButton onClick={handleExpandToggle}>
          {isExpanded ? <ExpandLess /> : <ExpandMore />}
        </IconButton>
      </Typography>

      <Collapse in={isExpanded}>
        <Stack
          alignItems="flex-start"
          justifyContent="flex-start"
          direction="column"
          sx={{ paddingLeft: 2, width: "100%" }}
        >
          {settings.map((setting) => {
            // TODO Add code for each setting type

            if (setting.type === SettingType.BOOLEAN) {
              return <BooleanSetting key={setting.title} {...setting} />;
            }

            return <></>;
          })}
        </Stack>
      </Collapse>
      <Divider
        sx={{ backgroundColor: "InactiveBorder", height: 1, width: 700 }}
      />
    </Stack>
  );
};
