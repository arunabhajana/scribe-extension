import { supabase } from "./supabase";

export type SocialProvider = "google" | "github";

export const oauthCallbackStorageKey = "scribe-oauth-callback-url";

type OAuthLaunchResult = {
  callbackUrl?: string;
  error?: string;
};

function isExpectedProviderUrl(url: URL, provider: SocialProvider, projectOrigin: string): boolean {
  if (url.protocol !== "https:") return false;
  const callback = url.searchParams.get("redirect_uri");
  if (callback !== `${projectOrigin}/auth/v1/callback`) return false;
  if (provider === "google") {
    return url.hostname === "accounts.google.com" && url.pathname.startsWith("/o/oauth2/");
  }
  return url.hostname === "github.com" && url.pathname === "/login/oauth/authorize";
}

async function startProviderOAuth(provider: SocialProvider, linkIdentity: boolean): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  if (typeof chrome === "undefined" || !chrome.identity || !chrome.runtime?.sendMessage) {
    return "Google and GitHub sign-in are available in the installed extension, not the web preview.";
  }

  try {
    const redirectTo = chrome.identity.getRedirectURL("auth");
    const options = {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: provider === "github" ? "read:user user:email" : "openid email profile",
      ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}),
    };
    const { data, error } = linkIdentity
      ? await supabase.auth.linkIdentity({ provider, options })
      : await supabase.auth.signInWithOAuth({ provider, options });
    if (error) return error.message;
    if (!data.url) return "Supabase did not return a provider sign-in URL.";

    const authorizationUrl = new URL(data.url);
    const configuredProjectUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
    if (!configuredProjectUrl) return "Supabase is not configured.";
    const projectUrl = new URL(configuredProjectUrl);
    const normalizeHost = (host: string) => host.toLowerCase().replace(/\.$/, "");
    const isProjectAuthorizeUrl = authorizationUrl.protocol === "https:"
      && normalizeHost(authorizationUrl.hostname) === normalizeHost(projectUrl.hostname)
      && (authorizationUrl.port || projectUrl.port) === (projectUrl.port || "")
      && authorizationUrl.pathname === "/auth/v1/authorize"
      && authorizationUrl.searchParams.get("provider") === provider
      && authorizationUrl.searchParams.get("redirect_to") === redirectTo;
    const validAuthorizationUrl = linkIdentity
      ? isExpectedProviderUrl(authorizationUrl, provider, projectUrl.origin)
      : isProjectAuthorizeUrl;
    if (!validAuthorizationUrl) {
      const providerName = provider === "google" ? "Google" : "GitHub";
      return `Could not start ${providerName} sign-in. Check that the provider is enabled in Supabase and try again.`;
    }

    const result = await chrome.runtime.sendMessage<OAuthLaunchResult>({
      type: "SCRIBE_LAUNCH_OAUTH",
      authorizationUrl: data.url,
      provider,
      flow: linkIdentity ? "link" : "sign-in",
      projectOrigin: projectUrl.origin,
    });
    if (result.error) return result.error;
    if (!result.callbackUrl) return "The provider did not return a sign-in result.";
    return await completeOAuthCallback(result.callbackUrl);
  } catch (error) {
    return error instanceof Error ? error.message : "Could not start provider sign-in. Please try again.";
  }
}

export function signInWithProvider(provider: SocialProvider): Promise<string | null> {
  return startProviderOAuth(provider, false);
}

export function linkProviderIdentity(provider: SocialProvider): Promise<string | null> {
  return startProviderOAuth(provider, true);
}

export async function completeOAuthCallback(callbackUrl: string): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  if (typeof chrome === "undefined" || !chrome.identity || !chrome.storage?.local) {
    return "The extension sign-in callback could not be read.";
  }

  try {
    await chrome.storage.local.remove(oauthCallbackStorageKey);
    const returnedUrl = new URL(callbackUrl);
    const expectedUrl = new URL(chrome.identity.getRedirectURL("auth"));
    if (returnedUrl.origin !== expectedUrl.origin || returnedUrl.pathname !== expectedUrl.pathname) {
      return "The sign-in callback does not belong to this Scribe extension.";
    }

    const query = returnedUrl.searchParams;
    const fragment = new URLSearchParams(returnedUrl.hash.replace(/^#/, ""));
    const providerError = query.get("error_description") ?? fragment.get("error_description")
      ?? query.get("error") ?? fragment.get("error");
    if (providerError) return providerError.replaceAll("+", " ");

    const code = query.get("code");
    if (code) {
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      return error?.message ?? null;
    }

    const accessToken = fragment.get("access_token");
    const refreshToken = fragment.get("refresh_token");
    if (!accessToken || !refreshToken) {
      return "The provider returned no session. Check the Supabase redirect URL configuration and try again.";
    }
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return error?.message ?? null;
  } catch (error) {
    return error instanceof Error ? error.message : "Could not complete provider sign-in.";
  }
}
