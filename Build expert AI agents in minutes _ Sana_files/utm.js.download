const sessionStorageKey = "queryParams";

function getSessionQueryParams() {
  const item = window.sessionStorage.getItem(sessionStorageKey);
  return !item ? {} : JSON.parse(item);
}

function storeQueryParamsInSessionStorage() {
  const oldQueryParams = getSessionQueryParams();

  const newQueryParams = Object.fromEntries(new URLSearchParams(window.location.search).entries());
  delete newQueryParams.id;
  delete newQueryParams.autoplay;

  const queryParams = { ...oldQueryParams, ...newQueryParams };

  window.sessionStorage.setItem(sessionStorageKey, JSON.stringify(queryParams));
}

function writeSessionQueryParamsToQuery() {
  const href = new URL(window.location.href);
  if (!href.search.includes("id") && !href.search.includes("id")) {
    href.search = new URLSearchParams(getSessionQueryParams()).toString();
    window.history.replaceState({}, "", href);
  }
}

storeQueryParamsInSessionStorage();

writeSessionQueryParamsToQuery();
