import { useEffect } from "react";

/**
 * Runs the passed effect at the first render of the component and only that once
 * @param effect Effect that is ran on mount
 */
export const useOnMount = (effect: React.EffectCallback) => {
  useEffect(effect, []);
};
