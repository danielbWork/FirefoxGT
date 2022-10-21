import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { CustomThemeProvider } from "../../utils/ui/CustomThemeProvider";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { useOnMount } from "../../utils/ui/useOnMount";
import { SettingsUI } from "../../settingsComponents/SettingsUI";

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Loads the storage for the app
  useOnMount(() => {
    StorageHandler.instance.loadStorage().then(() => {
      setIsLoaded(true);
    });
  });

  return (
    <CustomThemeProvider>
      {isLoaded ? <SettingsUI /> : <></>}
    </CustomThemeProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
