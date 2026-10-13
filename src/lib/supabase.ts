import { createClient } from "@supabase/supabase-js";
import { sessionAwareFetch } from "./sessionEvents";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
export const authStorageKey = supabaseUrl ? `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token` : "";
const supabaseKey = (
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ??
  import.meta.env.VITE_SUPABASE_ANON_KEY
)?.trim();

export const supabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabase = supabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      global: { fetch: sessionAwareFetch },
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        flowType: "pkce",
        persistSession: true,
        storage: typeof chrome !== "undefined" && chrome.storage?.local
          ? {
              getItem: async (key) => {
                const result = await chrome.storage.local.get(key);
                return typeof result[key] === "string" ? result[key] : null;
              },
              setItem: async (key, value) => {
                await chrome.storage.local.set({ [key]: value });
              },
              removeItem: async (key) => {
                await chrome.storage.local.remove(key);
              },
            }
          : undefined,
      },
    })
  : null;

