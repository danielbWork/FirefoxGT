console.log("0");

import React from "react";
import ReactDOM from "react-dom/client";
import { useTextInputDialog } from "../../utils/ui/dialogs/useTextInputDialog";
import { CustomThemeProvider } from "../../utils/ui/CustomThemeProvider";
import { useOnMount } from "../../utils/ui/useOnMount";

console.log("a");

type Props = {
  test: ReactDOM.Root;
  id: string;
};
console.log("b");

const App = ({ test, id }: Props) => {
  const { dialog, openDialog } = useTextInputDialog(
    "Test",
    "My values",
    (result) => {
      const root = document.getElementById(id);
      console.log(root);
      // TODO Make this actually work multiple times

      test.unmount();
      root?.remove();
      // location.reload();
    }
  );

  // Official load of dialog
  useOnMount(() => {
    setTimeout(() => {
      openDialog("Hi");
    }, 500);
  });

  return <CustomThemeProvider includeCSS={false}>{dialog}</CustomThemeProvider>;
};

console.log("c");

const body = document.body;

console.log("d");

// TODO Handle repeat calls

const app = document.createElement("div");

console.log("e");

app.id = "textInputRoot" + new Date().getMilliseconds();

body.appendChild(app);

console.log("f");

const root = ReactDOM.createRoot(app);

console.log(app.id);

root.render(
  <React.StrictMode>
    <App test={root} id={app.id} />
  </React.StrictMode>
);
