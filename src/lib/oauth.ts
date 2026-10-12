import { supabase } from "./supabase";

export type SocialProvider = "google" | "github";

export const oauthCallbackStorageKey = "scribe-oauth-callback-url";

type OAuthLaunchResult = {
  callbackUrl?: string;
  error?: string;
};

export async function signInWithProvider(provider: SocialProvider): Promise<string | null> {
  if (!supabase) return "Supabase is not configured.";
  if (typeof chrome === "undefined" || !chrome.identity || !chrome.runtime?.sendMessage) {
    return "Google and GitHub sign-in are available in the installed extension, not the web preview.";
  }

  try {
    const redirectTo = chrome.identity.getRedirectURL("auth");
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        scopes: provider === "github" ? "read:user user:email" : "openid email profile",
        ...(provider === "google" ? { queryParams: { prompt: "select_account" } } : {}),
      },
    });
    if (error) return error.message;
    if (!data.url) return "Supabase did not return a provider sign-in URL.";

    const authorizationUrl = new URL(data.url);
    const projectUrl = new URL(import.meta.env.VITE_SUPABASE_URL ?? "");
    if (authorizationUrl.protocol !== "https:" || authorizationUrl.origin !== projectUrl.origin) {
      return "The sign-in URL does not match the configured Supabase project.";
    }

    const result = await chrome.runtime.sendMessage<OAuthLaunchResult>({
      type: "SCRIBE_LAUNCH_OAUTH",
      authorizationUrl: data.url,
    });
    if (result.error) return result.error;
    if (!result.callbackUrl) return "The provider did not return a sign-in result.";
    return await completeOAuthCallback(result.callbackUrl);
  } catch (error) {
    return error instanceof Error ? error.message : "Could not start provider sign-in. Please try again.";
  }
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
