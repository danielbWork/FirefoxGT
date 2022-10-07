import {
  Box,
  createTheme,
  CssBaseline,
  ThemeProvider,
  useMediaQuery,
} from "@mui/material";
import React, { useMemo } from "react";
import ReactDOM from "react-dom";

type Props = {
  children?: JSX.Element;
};

/**
 * Custom Theme provider to handle all boilerplate for theme code
 */
export const CustomThemeProvider = ({ children }: Props) => {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? "dark" : "light",
        },
      }),
    [prefersDarkMode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
};
