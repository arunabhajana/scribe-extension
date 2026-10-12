/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_PUBLISHABLE_KEY?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare namespace chrome {
  function runtimeGetURL(path: string): string;
  namespace runtime {
    function getURL(path: string): string;
  }
  namespace storage {
    interface StorageArea {
      get(keys: string | string[]): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
    }
    const local: StorageArea;
  }
  namespace identity {
    function getRedirectURL(path?: string): string;
  }
  namespace runtime {
    interface MessageSender {
      url?: string;
      id?: string;
    }
    function sendMessage<T = unknown>(message: unknown): Promise<T>;
  }
}
