const CALLBACK_STORAGE_KEY = "scribe-oauth-callback-url";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "SCRIBE_LAUNCH_OAUTH") return undefined;

  if (sender.id !== chrome.runtime.id || !sender.url?.startsWith(`chrome-extension://${chrome.runtime.id}/`)) {
    sendResponse({ error: "The sign-in request did not come from Scribe." });
    return undefined;
  }

  const authorizationUrl = typeof message.authorizationUrl === "string"
    ? message.authorizationUrl
    : "";
  const expectedRedirect = chrome.identity.getRedirectURL("auth");
  let parsedUrl;
  try {
    parsedUrl = new URL(authorizationUrl);
  } catch {
    sendResponse({ error: "Supabase returned an invalid sign-in URL." });
    return undefined;
  }
  const provider = message.provider;
  const flow = message.flow;
  let projectOrigin;
  try {
    const configuredProject = new URL(message.projectOrigin);
    if (configuredProject.protocol !== "https:") throw new Error("Invalid project URL");
    projectOrigin = configuredProject.origin;
  } catch {
    sendResponse({ error: "Could not start sign-in. Check the Supabase project settings and try again." });
    return undefined;
  }
  const isProviderUrl = parsedUrl.protocol === "https:"
    && parsedUrl.searchParams.get("redirect_uri") === `${projectOrigin}/auth/v1/callback`
    && (provider === "google"
      ? parsedUrl.hostname === "accounts.google.com" && parsedUrl.pathname.startsWith("/o/oauth2/")
      : provider === "github" && parsedUrl.hostname === "github.com" && parsedUrl.pathname === "/login/oauth/authorize");
  const isSupabaseSignInUrl = parsedUrl.protocol === "https:"
    && parsedUrl.origin === projectOrigin
    && parsedUrl.pathname === "/auth/v1/authorize"
    && parsedUrl.searchParams.get("provider") === provider
    && parsedUrl.searchParams.get("redirect_to") === expectedRedirect;
  if ((flow === "link" && !isProviderUrl) || (flow === "sign-in" && !isSupabaseSignInUrl)) {
    const providerName = provider === "google" ? "Google" : provider === "github" ? "GitHub" : "provider";
    sendResponse({ error: `Could not start ${providerName} sign-in. Check the Supabase provider settings and try again.` });
    return undefined;
  }

  chrome.storage.local.remove(CALLBACK_STORAGE_KEY, () => {
    chrome.identity.launchWebAuthFlow({ url: authorizationUrl, interactive: true }, (callbackUrl) => {
      const launchError = chrome.runtime.lastError?.message;
      if (launchError) {
        sendResponse({ error: launchError });
        return;
      }
      if (!callbackUrl) {
        sendResponse({ error: "The provider did not return a sign-in result." });
        return;
      }
      chrome.storage.local.set({ [CALLBACK_STORAGE_KEY]: callbackUrl }, () => {
        const storageError = chrome.runtime.lastError?.message;
        sendResponse(storageError
          ? { error: "Sign-in returned, but Scribe could not save the callback. Reopen the extension and try again." }
          : { callbackUrl });
      });
    });
  });
  return true;
});
