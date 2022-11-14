import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import React, { useMemo } from "react";
import { useMedia } from "./useMedia";

type Props = {
  children?: JSX.Element;

  /**
   * Used for content pages to not effect rest of screen
   */
  includeCSS?: boolean;
};

/**
 * Custom Theme provider to handle all boilerplate for theme code
 */
export const CustomThemeProvider = ({ children, includeCSS = true }: Props) => {
  const prefersDarkMode = useMedia("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
        components: {
          MuiCssBaseline: {
            styleOverrides: `
            fieldset {
              legend {
                  span {
                    display:none;
                  }
              }
            }`,
          },
        },
      }),
    [prefersDarkMode]
  );
  return (
    <ThemeProvider theme={theme}>
      {includeCSS ? <CssBaseline /> : <></>}
      {children}
    </ThemeProvider>
  );
};
