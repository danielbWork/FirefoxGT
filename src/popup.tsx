import { Popup } from "./popupComponents/Popup";
import React from "react";
import ReactDOM from "react-dom/client";
import { CustomThemeProvider } from "./utils/ui/CustomThemeProvider";
import { PopupMessageHandler } from "./popupComponents/PopupMessageHandler";
import { StorageHandler } from "./utils/Storage/StorageHandler";

PopupMessageHandler.instance.setupMessageHandler();

const App = () => {
  return (
    <CustomThemeProvider>
      <Popup />
    </CustomThemeProvider>
  );
};

const root = ReactDOM.createRoot(document.getElementById("root")!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
