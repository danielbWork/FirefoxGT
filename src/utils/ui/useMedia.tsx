import React, { useCallback, useEffect, useState } from "react";

/**
 * Custom Media getter as useMediaQuery doesn't work for content pages (i.e. dialogs)
 *
 * copied from https://stackoverflow.com/questions/64959287/window-matchmedia-is-not-a-function
 */
export const useMedia = (query: string) => {
  const [matches, setMatches] = useState(
    typeof window !== "undefined" && window.matchMedia(query).matches
  );

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) setMatches(media.matches);
    const listener = () => setMatches(media.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [matches, query]);

  return matches;
};
