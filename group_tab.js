import { NAME_PARAM, TAB_COUNT_PARAM } from "./Consts.js";

/**
 * Updates the tab title to match the given values in the url
 */
function handleTabTitle() {
  const urlParams = new URLSearchParams(window.location.search);

  const title = urlParams.get(NAME_PARAM) || "test";

  const innerTabsCount = urlParams.get(TAB_COUNT_PARAM) || 0;

  document.title = `${title} (${innerTabsCount})`;
}

handleTabTitle();
