import React, { useCallback, useState } from "react";
import { useOnMount } from "../utils/ui/useOnMount";
import { ContentMessageType } from "../utils/messages/ContentMessageType";
import { ContentDialogHandler } from "./ContentDialogHandler";

/**
 *  Hook in charge of updating the dialog info
 *
 */
export const useDialogInfo = () => {
  const [type, setType] = useState<ContentMessageType>();
  const [data, setData] = useState<any>();

  // Loads the listener only once
  useOnMount(() => {
    ContentDialogHandler.instance.onDisplayDialogNotifier.addListener(
      (newType, newData) => {
        setType(newType);
        setData(newData);
      }
    );
  });

  return { type, data };
};
