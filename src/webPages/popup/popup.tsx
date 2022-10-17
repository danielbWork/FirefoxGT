import { Popup } from "../../popupComponents/Popup";
import React, { useState } from "react";
import ReactDOM from "react-dom/client";
import { CustomThemeProvider } from "../../utils/ui/CustomThemeProvider";
import { PopupMessageHandler } from "../../popupComponents/PopupMessageHandler";
import { StorageHandler } from "../../utils/Storage/StorageHandler";
import { useOnMount } from "../../utils/ui/useOnMount";

PopupMessageHandler.instance.setupMessageHandler();

const App = () => {
  const [isLoaded, setIsLoaded] = useState(false);

  // Loads the storage for the app
  useOnMount(() => {
    StorageHandler.instance.loadStorage().then(() => {
      setIsLoaded(true);
    });
  });

  return (
    <CustomThemeProvider>{isLoaded ? <Popup /> : <></>}</CustomThemeProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
