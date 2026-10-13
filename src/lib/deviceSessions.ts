import { supabase } from "./supabase";
export type SignOutScope = "single" | "others" | "all";

export type SignedInDevice = {
  sessionId: string;
  name: string;
  clientType: "windows" | "extension" | "mobile" | "web" | "unknown";
  platform: string;
  signedInAt: string;
  lastSeenAt: string;
  current: boolean;
};

export function deviceSessionError(error: unknown) {
  const message = typeof error === "string" ? error : error && typeof error === "object" && "message" in error ? String(error.message) : "";
  if (/schema cache|could not find.*function|does not exist/i.test(message)) return "Device inventory isn’t available yet. Check that the Supabase device inventory migration has been applied.";
  if (/verified.*session|42501|two-step/i.test(message)) return "Verify your account or sign in again to view your devices.";
  return "Could not load signed-in devices. Check your connection and retry.";
}

export async function registerDeviceSession() {
  if (!supabase) throw new Error("Supabase is not configured.");
  const ua = navigator.userAgent;
  const browser = /Edg\//i.test(ua) ? "Edge" : /OPR\//i.test(ua) ? "Opera" : /Chrome\//i.test(ua) ? "Chrome" : /Firefox\//i.test(ua) ? "Firefox" : "Browser";
  const platform = /Android/i.test(ua) ? "Android" : /iPhone|iPad/i.test(ua) ? "iOS" : /Windows/i.test(ua) ? "Windows" : /CrOS/i.test(ua) ? "ChromeOS" : /Mac/i.test(ua) ? "macOS" : /Linux/i.test(ua) ? "Linux" : "Unknown platform";
  const extension = window.location.protocol === "chrome-extension:";
  const { error } = await supabase.rpc("register_device_session", {
    p_device_name: extension ? `Scribe extension · ${browser}` : `Scribe in ${browser}`,
    p_client_type: extension ? "extension" : "web",
    p_platform: platform,
  }).abortSignal(AbortSignal.timeout(15_000));
  if (error) throw error;
}

const checkInKey = "scribe-device-check-in";
export async function recentDeviceCheckIn(key: string): Promise<number | null> {
  try {
    const stored = typeof chrome !== "undefined" && chrome.storage?.local
      ? (await chrome.storage.local.get(checkInKey))[checkInKey]
      : JSON.parse(localStorage.getItem(checkInKey) ?? "null");
    if (!stored || typeof stored !== "object" || !("key" in stored) || !("at" in stored)) return null;
    const age = typeof stored.at === "number" ? Date.now() - stored.at : Infinity;
    return stored.key === key && age >= 0 && age < 10 * 60_000 ? stored.at as number : null;
  } catch { return null; }
}

export async function rememberDeviceCheckIn(key: string, at: number) {
  try {
    if (typeof chrome !== "undefined" && chrome.storage?.local) await chrome.storage.local.set({ [checkInKey]: { key, at } });
    else localStorage.setItem(checkInKey, JSON.stringify({ key, at }));
  } catch { /* Server-side throttling still bounds writes when local storage is unavailable. */ }
}

export async function getSignedInDevices(): Promise<SignedInDevice[]> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("get_signed_in_devices").abortSignal(AbortSignal.timeout(15_000));
  if (error) throw error;
  if (!Array.isArray(data)) throw new Error("Invalid device inventory response.");
  return data.map((row) => {
    if (typeof row.session_id !== "string" || typeof row.device_name !== "string" || typeof row.platform !== "string" || typeof row.signed_in_at !== "string" || typeof row.last_seen_at !== "string" || typeof row.is_current !== "boolean") throw new Error("Invalid device inventory response.");
    return { sessionId: row.session_id, name: row.device_name, platform: row.platform,
      clientType: ["windows", "extension", "mobile", "web"].includes(row.client_type) ? row.client_type : "unknown",
      signedInAt: row.signed_in_at, lastSeenAt: row.last_seen_at, current: row.is_current };
  });
}
export async function revokeDeviceSessions(scope: SignOutScope, sessionId: string | undefined, accessToken: string): Promise<{ revokedCount: number; currentRevoked: boolean }> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data, error } = await supabase.rpc("revoke_device_sessions", { p_scope: scope, p_session_id: sessionId ?? null }).setHeader("Authorization", `Bearer ${accessToken}`).abortSignal(AbortSignal.timeout(15_000));
  if (error) throw error;
  if (typeof data?.revokedCount !== "number" || typeof data?.currentRevoked !== "boolean") throw new Error("Invalid sign-out response.");
  return data;
}

export function deviceSignOutError(error: unknown) {
  const message = typeof error === "string" ? error : error && typeof error === "object" && "message" in error ? String(error.message) : "";
  if (/schema cache|could not find.*function|does not exist/i.test(message)) return "Device sign-out needs the latest Supabase session sign-out migration. Apply it and retry.";
  if (/two-step|verified.*session|SCRIBE_SESSION_REVOKED/i.test(message)) return "Verify your account or sign in again before signing out devices.";
  return "Could not confirm device sign-out. Check your connection, refresh the list, and retry.";
}
