import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User, UserIdentity } from "@supabase/supabase-js";
import { Edit3, Pin, RotateCcw, Trash2, X } from "lucide-react";
import { AppHeader } from "./components/AppHeader";
import { NoteEditor } from "./components/NoteEditor";
import { NotesView } from "./components/NotesView";
import { NoteViewer } from "./components/NoteViewer";
import { SettingsView } from "./components/SettingsView";
import { AuthView } from "./components/AuthView";
import { ContextMenu, type ContextMenuItem } from "./components/ContextMenu";
import { noteFontFamilies, noteFontFamilyCss, noteFontSizes, type NoteFontFamily, type NoteFontSize } from "./data/noteFontSizes";
import type { Folder, Note, Screen } from "./types";
import { supabase } from "./lib/supabase";
import { completeOAuthCallback, linkProviderIdentity, oauthCallbackStorageKey, signInWithProvider as startProviderSignIn, type SocialProvider } from "./lib/oauth";
import { loadAccount, syncAccount, updateAccountCache, type AccountCache } from "./data/cloudSync";

function readLocal<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function App() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [folderOrder, setFolderOrder] = useState<string[]>(() =>
    readLocal("scribe-folder-order", []),
  );
  const [screen, setScreen] = useState<Screen>("auth");
  const [authLoading, setAuthLoading] = useState(Boolean(supabase));
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [linkedIdentities, setLinkedIdentities] = useState<UserIdentity[]>([]);
  const authUserIdRef = useRef<string | null>(null);
  const [accountLoaded, setAccountLoaded] = useState<string | null>(null);
  const [hasPendingSync, setHasPendingSync] = useState(false);
  const accountCache = useRef<AccountCache | null>(null);
  const syncRunning = useRef(false);
  const cacheWriteChain = useRef<Promise<void>>(Promise.resolve());
  const lastCloudSync = useRef(0);
  const syncTrigger = useRef<(() => void) | null>(null);
  const pendingRealtimeSequence = useRef<bigint | null>(null);
  const realtimeDebounce = useRef<number | null>(null);
  const editGeneration = useRef(new Map<string, number>());
  const notesRef = useRef(notes);
  const foldersRef = useRef(folders);
  const screenRef = useRef(screen);
  notesRef.current = notes;
  foldersRef.current = folders;
  screenRef.current = screen;
  const [authError, setAuthError] = useState(() => !supabase
    ? "Supabase isn’t configured. Add the extension’s Supabase URL and publishable key to .env.local."
    : new URLSearchParams(window.location.search).get("error_description") || new URLSearchParams(window.location.search).get("error") || "");
  const [activeFolder, setActiveFolder] = useState("All notes");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [profileOpen, setProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState(
    () => localStorage.getItem("scribe-profile-name") ?? "Scribe user",
  );
  const [profileEmail, setProfileEmail] = useState("");
  const [profileAvatar, setProfileAvatar] = useState(
    () => localStorage.getItem("scribe-profile-avatar") ?? "#8970ed",
  );
  const [accent, setAccent] = useState(
    () => localStorage.getItem("scribe-accent") ?? "#8970ed",
  );
  const [dark, setDark] = useState(
    () => localStorage.getItem("scribe-theme") === "dark",
  );
  const [noteFontSize, setNoteFontSize] = useState<NoteFontSize>(() => {
    const stored = localStorage.getItem("scribe-note-font-size");
    if (stored !== null) {
      if (noteFontSizes.some((option) => option.label === stored)) return stored as NoteFontSize;
      const legacyIndex = Number(stored);
      if (Number.isInteger(legacyIndex) && legacyIndex >= 0 && legacyIndex <= 4)
        return legacyIndex <= 1 ? "Small" : legacyIndex === 2 ? "Medium" : "Large";
    }
    return "Medium";
  });
  const [noteFontFamily, setNoteFontFamily] = useState<NoteFontFamily>(() => {
    const stored = localStorage.getItem("scribe-note-font-family");
    return noteFontFamilies.find((family) => family === stored) ?? "DM Sans";
  });
  const [saved, setSaved] = useState(true);
  const [editField, setEditField] = useState<"title" | "body">("body");
  const [syncStatus, setSyncStatus] = useState<"pending" | "syncing" | "synced" | "error">("synced");
  const [filterPinned, setFilterPinned] = useState(false);
  const [message, setMessage] = useState("");
  const selectedNoteFontSize = noteFontSizes.find((option) => option.label === noteFontSize)?.size ?? 13;
  const selected = useMemo(
    () => notes.find((note) => note.id === selectedId),
    [notes, selectedId],
  );
  useEffect(() => {
    if (!authUser || accountLoaded !== authUser.id || !accountCache.current) return;
    const userId = authUser.id;
    const noteSnapshot = notes;
    const folderSnapshot = folders;
    cacheWriteChain.current = cacheWriteChain.current.then(async () => {
      while (syncRunning.current) await new Promise((resolve) => window.setTimeout(resolve, 100));
      if (authUserIdRef.current !== userId || !accountCache.current) return;
      const next = await updateAccountCache(accountCache.current, noteSnapshot, folderSnapshot);
      if (authUserIdRef.current !== userId) return;
      accountCache.current = next;
      setHasPendingSync(next.outbox.length > 0);
      setSyncStatus(next.outbox.length ? "pending" : "synced");
    }).catch((error: unknown) => {
      if (authUserIdRef.current === userId)
        setMessage(error instanceof Error ? error.message : "Could not save notes locally.");
    });
  }, [notes, folders, authUser, accountLoaded]);

  useEffect(() => {
    authUserIdRef.current = authUser?.id ?? null;
  }, [authUser?.id]);

  function syncProfile(user: User) {
    const email = user.email?.trim() ?? "";
    const metadata = user.user_metadata ?? {};
    const displayName = String(metadata.display_name ?? metadata.full_name ?? metadata.name ?? email.split("@")[0] ?? "").trim();
    setProfileEmail(email);
    setProfileName(displayName || "Scribe user");
    localStorage.setItem("scribe-profile-email", email);
    localStorage.setItem("scribe-profile-name", displayName || "Scribe user");
  }

  async function refreshLinkedIdentities(userId: string): Promise<UserIdentity[] | null> {
    if (!supabase) return null;
    const { data, error } = await supabase.auth.getUserIdentities();
    if (error) return null;
    if (authUserIdRef.current !== userId) return null;
    setLinkedIdentities(data.identities);
    return data.identities;
  }

  useEffect(() => {
    const userId = authUser?.id;
    if (!userId) return;
    if (screen === "settings") void refreshLinkedIdentities(userId);
  }, [authUser?.id, screen]);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session?.user) {
        authUserIdRef.current = session.user.id;
        setAuthUser(session.user);
        syncProfile(session.user);
        setScreen("notes");
      } else {
        authUserIdRef.current = null;
        setLinkedIdentities([]);
        setAuthUser(null);
        setProfileEmail("");
        setScreen("auth");
      }
      setAuthLoading(false);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) setAuthError(error.message);
      if (data.session?.user) {
        authUserIdRef.current = data.session.user.id;
        setAuthUser(data.session.user);
        syncProfile(data.session.user);
        setScreen("notes");
      } else { authUserIdRef.current = null; setLinkedIdentities([]); setAuthUser(null); setProfileEmail(""); setScreen("auth"); }
      setAuthLoading(false);
    }).catch(() => {
      if (mounted) { setAuthError("Could not restore your session. Please sign in again."); setScreen("auth"); setAuthLoading(false); }
    });
    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    if (!supabase || typeof chrome === "undefined" || !chrome.storage?.local) return;
    let active = true;
    void chrome.storage.local.get(oauthCallbackStorageKey).then(async (result) => {
      const callbackUrl = result[oauthCallbackStorageKey];
      if (!active || typeof callbackUrl !== "string") return;
      const error = await completeOAuthCallback(callbackUrl);
      if (active && error) setAuthError(error);
    }).catch(() => {
      if (active) setAuthError("Could not restore the provider sign-in. Please try again.");
    });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const userId = authUser?.id;
    accountCache.current = null;
    lastCloudSync.current = 0;
    if (!userId) return;
    let active = true;
    void loadAccount(userId).then((cache) => {
      if (!active) return;
      accountCache.current = cache;
      setNotes(cache.notes);
      setFolders(cache.folders);
      setHasPendingSync(cache.outbox.length > 0);
      setAccountLoaded(userId);
      setSyncStatus(cache.outbox.length ? "pending" : "synced");
    }).catch((error: unknown) => {
      if (active) { setSyncStatus("error"); setMessage(error instanceof Error ? error.message : "Could not load local notes."); }
    });
    return () => { active = false; };
  }, [authUser?.id]);

  useEffect(() => {
    if (!authUser || accountLoaded !== authUser.id || !accountCache.current) return;
    if (screenRef.current === "editor" || syncRunning.current) return;
    let active = true;
    const run = async (forcePull = false) => {
      if (!active || syncRunning.current || !accountCache.current) return;
      let ownsLock = false;
      try {
        await cacheWriteChain.current;
        if (!active || syncRunning.current || !accountCache.current) return;
        syncRunning.current = true;
        ownsLock = true;
        let cache = accountCache.current;
        // Snapshot local UI changes before sync; writes and pulls share one lock
        // so neither can overwrite the other's IndexedDB transaction.
        if (notesRef.current !== cache.notes || foldersRef.current !== cache.folders) {
          cache = await updateAccountCache(cache, notesRef.current, foldersRef.current);
          accountCache.current = cache;
          setHasPendingSync(cache.outbox.length > 0);
        }
        if (!forcePull && !cache.outbox.length && !cache.hasMore && Date.now() - lastCloudSync.current < 30_000) {
          if (authUserIdRef.current === authUser.id) setSyncStatus("synced");
          return;
        }
        setSyncStatus("syncing");
        const editsAtStart = new Map(editGeneration.current);
        // Drain cursor pages immediately so the UI catches up with Windows
        // after a long suspension or a large remote change set.
        let pages = 0;
        do {
          cache = await syncAccount(authUser, cache);
          if (authUserIdRef.current !== cache.userId) return;
          accountCache.current = cache;
          pages++;
        } while (cache.hasMore && pages < 10);
        const currentNotes = new Map(cache.notes.map((note) => [note.id, note]));
        const currentFolders = new Map(cache.folders.map((folder) => [folder.id, folder]));
        for (const [key, generation] of editGeneration.current) {
          if (generation === editsAtStart.get(key)) continue;
          if (key.startsWith("note:")) {
            const id = key.slice(5);
            const edited = notesRef.current.find((note) => note.id === id);
            if (edited) currentNotes.set(id, edited); else currentNotes.delete(id);
          } else {
            const id = key.slice(7);
            const edited = foldersRef.current.find((folder) => folder.id === id);
            if (edited) currentFolders.set(id, edited); else currentFolders.delete(id);
          }
        }
        const mergedNotes = [...currentNotes.values()].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
        const mergedFolders = [...currentFolders.values()];
        if (authUserIdRef.current !== cache.userId) return;
        setNotes(mergedNotes);
        setFolders(mergedFolders);
        // Persist edits made while the request was in flight as fresh outbox
        // revisions based on the latest server version.
        if (mergedNotes !== cache.notes || mergedFolders !== cache.folders) {
          cache = await updateAccountCache(cache, mergedNotes, mergedFolders);
          accountCache.current = cache;
        }
        lastCloudSync.current = cache.hasMore ? 0 : Date.now();
        setHasPendingSync(cache.outbox.length > 0);
        setSyncStatus(cache.outbox.length || cache.hasMore ? "pending" : "synced");
        if (cache.hasMore) window.setTimeout(() => { if (authUserIdRef.current === cache.userId) void run(); }, 500);
      } catch (error) {
        if (authUserIdRef.current === authUser.id) {
          setSyncStatus("error");
          setMessage(error instanceof Error ? `Cloud sync paused; local notes are safe. ${error.message}` : "Cloud sync paused; local notes are safe.");
        }
      } finally {
        if (ownsLock) {
          syncRunning.current = false;
          const pendingSequence = pendingRealtimeSequence.current;
          const currentCursor = BigInt(accountCache.current?.cursor ?? "0");
          if (pendingSequence !== null && pendingSequence <= currentCursor) {
            pendingRealtimeSequence.current = null;
          } else if (pendingSequence !== null && authUserIdRef.current === authUser.id) {
            window.setTimeout(() => syncTrigger.current?.(), 120);
          }
        }
      }
    };
    syncTrigger.current = () => { void run(true); };
    const first = window.setTimeout(() => {
      const cursor = BigInt(accountCache.current?.cursor ?? "0");
      void run(pendingRealtimeSequence.current !== null && pendingRealtimeSequence.current > cursor);
    }, hasPendingSync ? 1000 : 0);
    const interval = window.setInterval(() => void run(), hasPendingSync ? 15_000 : 60_000);
    const online = () => void run();
    window.addEventListener("online", online);
    window.addEventListener("focus", online);
    return () => {
      active = false;
      if (syncTrigger.current) syncTrigger.current = null;
      window.clearTimeout(first);
      window.clearInterval(interval);
      window.removeEventListener("online", online);
      window.removeEventListener("focus", online);
    };
  }, [authUser, accountLoaded, screen, hasPendingSync]);

  useEffect(() => {
    const client = supabase;
    const userId = authUser?.id;
    if (!client || !userId || accountLoaded !== userId) return;
    const channel = client
      .channel(`scribe-sync-${userId}`)
      .on("postgres_changes", {
        event: "*",
        schema: "public",
        table: "sync_changes",
        filter: `user_id=eq.${userId}`,
      }, (payload) => {
        const row = payload.new as Record<string, unknown>;
        const sequence = row && typeof row.sequence !== "undefined"
          ? BigInt(String(row.sequence))
          : null;
        if (sequence === null) return;
        const cursor = BigInt(accountCache.current?.cursor ?? "0");
        if (sequence <= cursor) return;
        if (pendingRealtimeSequence.current === null || sequence > pendingRealtimeSequence.current)
          pendingRealtimeSequence.current = sequence;
        if (realtimeDebounce.current !== null) window.clearTimeout(realtimeDebounce.current);
        realtimeDebounce.current = window.setTimeout(() => {
          realtimeDebounce.current = null;
          const latestCursor = BigInt(accountCache.current?.cursor ?? "0");
          if (pendingRealtimeSequence.current !== null && pendingRealtimeSequence.current <= latestCursor) {
            pendingRealtimeSequence.current = null;
            return;
          }
          syncTrigger.current?.();
        }, 350);
      })
      .subscribe();
    return () => {
      if (realtimeDebounce.current !== null) window.clearTimeout(realtimeDebounce.current);
      realtimeDebounce.current = null;
      void client.removeChannel(channel);
    };
  }, [authUser?.id, accountLoaded]);

  async function signIn(email: string, password: string) {
    if (!supabase) return "Supabase is not configured. Add the project URL and publishable key to .env.local.";
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (!error) return null;
    if (/email not confirmed/i.test(error.message)) return "Please verify your email from the link we sent before signing in.";
    return error.message;
  }
  async function register(name: string, email: string, password: string) {
    if (!supabase) return { error: "Supabase is not configured. Add the project URL and publishable key to .env.local.", confirmationRequired: false };
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: {
        data: { display_name: name },
      },
    });
    return { error: error?.message ?? null, confirmationRequired: !error && !data.session };
  }
  async function resendVerification(email: string) {
    if (!supabase) return "Supabase is not configured.";
    const { error } = await supabase.auth.resend({ type: "signup", email });
    return error?.message ?? null;
  }
  async function linkProviderIdentityAndRefresh(provider: SocialProvider): Promise<string | null> {
    const error = await linkProviderIdentity(provider);
    if (error) return error;
    const userId = authUserIdRef.current;
    if (userId) await refreshLinkedIdentities(userId);
    return null;
  }

  async function unlinkProviderIdentity(provider: SocialProvider): Promise<string | null> {
    if (!supabase) return "Supabase is not configured.";
    const { data, error } = await supabase.auth.getUserIdentities();
    if (error) return error.message;
    const currentUserId = authUserIdRef.current;
    if (currentUserId) setLinkedIdentities(data.identities);
    const identity = data.identities.find((item) => item.provider === provider);
    if (!identity) return `No ${provider} identity is linked to this account.`;
    if (data.identities.length <= 1) return "Link another sign-in method before unlinking this one.";
    const { error: unlinkError } = await supabase.auth.unlinkIdentity(identity);
    if (unlinkError) return unlinkError.message;
    if (currentUserId) await refreshLinkedIdentities(currentUserId);
    return null;
  }
  const orderedFolderKeys = useMemo(() => {
    const available = [
      ...folders.map((folder) => `folder:${folder.id}`),
      "system:drafts",
      "system:trash",
    ];
    return [
      ...folderOrder.filter((key) => available.includes(key)),
      ...available.filter((key) => !folderOrder.includes(key)),
    ];
  }, [folderOrder, folders]);

  useEffect(() => {
    if (!message) return;
    const timeout = window.setTimeout(() => setMessage(""), 2600);
    return () => window.clearTimeout(timeout);
  }, [message]);

  const createNote = useCallback((folderName?: string) => {
    const destination = folderName ?? activeFolder;
    const note: Note = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      title: "",
      body: "",
      folder: folders.some((folder) => folder.name === destination)
        ? destination
        : "",
      folderId: folders.find((folder) => folder.name === destination)?.id ?? null,
      color: "#9680ff",
      updatedAt: new Date().toISOString(),
      updated: "Just now",
      isDraft: true,
      isNew: true,
    };
    markEdited("note", note.id);
    setNotes((current) => [note, ...current]);
    setSelectedId(note.id);
    setEditField("body");
    setScreen("editor");
    setSaved(false);
  }, [activeFolder, folders]);

  useEffect(() => {
    if (!authUser || accountLoaded !== authUser.id) return;
    try {
      localStorage.setItem(
        "scribe-folder-order",
        JSON.stringify(orderedFolderKeys),
      );
    } catch { /* Preserve the in-memory folder order if storage is unavailable. */ }
  }, [orderedFolderKeys, authUser, accountLoaded]);

  function createFolder(folder: Folder) {
    const nextFolder = { ...folder, createdAt: folder.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString(), sortOrder: folders.length };
    markEdited("folder", nextFolder.id);
    setFolders((current) => [...current, nextFolder]);
    setFolderOrder((current) => {
      const base = current.length
        ? current
        : [
            ...folders.map((item) => `folder:${item.id}`),
            "system:drafts",
            "system:trash",
          ];
      const firstSystem = base.findIndex((key) => key.startsWith("system:"));
      const insertAt = firstSystem < 0 ? base.length : firstSystem;
      return [
        ...base.slice(0, insertAt),
        `folder:${nextFolder.id}`,
        ...base.slice(insertAt),
      ];
    });
    setActiveFolder(nextFolder.name);
    setMessage(`${nextFolder.name} folder created.`);
  }
  function updateFolder(id: string, nextFolder: Folder) {
    markEdited("folder", id);
    const previous = folders.find((folder) => folder.id === id);
    setFolders((current) =>
      current.map((folder) => (folder.id === id ? nextFolder : folder)),
    );
    if (previous && previous.name !== nextFolder.name) {
      setNotes((current) =>
        current.map((note) =>
          note.folder === previous.name
            ? { ...note, folder: nextFolder.name }
            : note,
        ),
      );
      setActiveFolder((current) =>
        current === previous.name ? nextFolder.name : current,
      );
    }
    setMessage(`${nextFolder.name} folder updated.`);
  }
  function deleteFolder(folder: Folder) {
    markEdited("folder", folder.id);
    setFolders((current) => current.filter((item) => item.id !== folder.id));
    setNotes((current) =>
      current.map((note) =>
          note.folder === folder.name ? { ...note, folder: "", folderId: null, updatedAt: new Date().toISOString(), updated: "Just now" } : note,
      ),
    );
    setActiveFolder((current) =>
      current === folder.name ? "All notes" : current,
    );
    setMessage(`${folder.name} folder deleted; its notes are now unfiled.`);
  }
  function moveFolder(id: string, direction: -1 | 1) {
    const next = [...orderedFolderKeys];
    const index = next.indexOf(id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFolderOrder(next);
    try {
      localStorage.setItem("scribe-folder-order", JSON.stringify(next));
    } catch {
      setMessage("Could not save folder order on this device.");
    }
  }

  function updateSelected(field: "title" | "body" | "folder", value: string) {
    setSaved(false);
    markEdited("note", selectedId);
    setNotes((current) =>
      current.map((note) =>
        note.id === selectedId ? { ...note, [field]: value, ...(field === "folder" ? { folderId: folders.find((folder) => folder.name === value)?.id ?? null } : {}), updatedAt: new Date().toISOString(), updated: "Just now" } : note,
      ),
    );
  }
  function saveNote() {
    const current = notes.find((note) => note.id === selectedId);
    if (!current || (!current.title.trim() && !current.body.trim())) {
      setMessage("Add a title or note text, or discard this empty note.");
      return;
    }
    setSaved(true);
    markEdited("note", selectedId);
    setNotes((items) =>
      items.map((note) =>
        note.id === selectedId
          ? { ...note, isDraft: false, isNew: false, updated: "Just now", updatedAt: new Date().toISOString() }
          : note,
      ),
    );
    setScreen("view");
  }
  function editNote(field: "title" | "body" = "body") {
    setEditField(field);
    setScreen("editor");
  }
  function markEdited(entity: "note" | "folder", id: string | null) {
    if (!id) return;
    const key = `${entity}:${id}`;
    editGeneration.current.set(key, (editGeneration.current.get(key) ?? 0) + 1);
  }
  function leaveEditor() {
    if (selected?.isNew) {
      if (!selected.title.trim() && !selected.body.trim()) {
        setNotes((items) => items.filter((note) => note.id !== selectedId));
        setActiveFolder("All notes");
        setMessage("Empty note discarded.");
      } else {
        setNotes((items) =>
          items.map((note) =>
            note.id === selectedId
              ? { ...note, isDraft: true, isNew: false, updated: "Just now", updatedAt: new Date().toISOString() }
              : note,
          ),
        );
        setActiveFolder("Drafts");
        setMessage("Saved to Drafts.");
      }
      setScreen("notes");
      return;
    }
    setScreen("view");
  }
  function discardDraft() {
    if (!selected) return;
    setNotes((items) => items.filter((note) => note.id !== selectedId));
    setActiveFolder("Drafts");
    setScreen("notes");
    setMessage("Draft discarded.");
  }
  function deleteNote() {
    if (selectedId) moveNoteToTrash(selectedId);
  }
  function moveNoteToTrash(id: string) {
    markEdited("note", id);
    setNotes((items) =>
      items.map((note) =>
        note.id === id
          ? { ...note, isDeleted: true, isNew: false, updatedAt: new Date().toISOString(), updated: "Just now" }
          : note,
      ),
    );
    setActiveFolder("Trash");
    setScreen("notes");
    setMessage("Moved to Trash.");
  }
  function editNoteById(id: string) {
    setSelectedId(id);
    setEditField("body");
    setScreen("editor");
  }
  function restoreNote(id: string) {
    markEdited("note", id);
    const note = notes.find((item) => item.id === id);
    setNotes((items) =>
      items.map((item) =>
        item.id === id ? { ...item, isDeleted: false, updatedAt: new Date().toISOString(), updated: "Just now" } : item,
      ),
    );
    setActiveFolder(note?.isDraft ? "Drafts" : "All notes");
    setScreen("notes");
    setMessage(note?.isDraft ? "Draft restored." : "Note restored.");
  }
  function permanentlyDeleteNote(id: string) {
    markEdited("note", id);
    setNotes((items) => items.filter((item) => item.id !== id));
    setScreen("notes");
    setMessage("Note permanently deleted.");
  }
  function togglePin(id: string) {
    markEdited("note", id);
    setNotes((current) =>
      current.map((note) =>
        note.id === id ? { ...note, pinned: !note.pinned, updatedAt: new Date().toISOString(), updated: "Just now" } : note,
      ),
    );
  }
  function openSettings() {
    setProfileOpen(false);
    setScreen("settings");
  }
  function clearNotes() {
    setNotes([]);
    setSelectedId(null);
    setScreen("notes");
    setMessage("Your notes were cleared.");
  }
  function updateProfileName(name: string) {
    setProfileName(name);
    localStorage.setItem("scribe-profile-name", name);
    if (supabase) {
      void supabase.auth.updateUser({ data: { display_name: name.trim() } }).then(({ error }) => {
        if (error) setMessage("Could not update your account name. Please try again.");
      }).catch(() => setMessage("Could not update your account name. Check your connection."));
    }
  }
  function updateProfileAvatar(avatar: string) {
    setProfileAvatar(avatar);
    localStorage.setItem("scribe-profile-avatar", avatar);
  }
  function toggleTheme() {
    setDark((current) => {
      const next = !current;
      localStorage.setItem("scribe-theme", next ? "dark" : "light");
      return next;
    });
  }

  return (
    <main
      className={`${dark ? "dark" : ""} min-h-screen bg-[#f4f4f8] p-7 font-sans text-[#191a22] antialiased transition-colors dark:bg-[#111114] dark:text-[#f4f2fb] max-[480px]:p-0`}
    >
      <div
        style={{ "--scribe-accent": accent } as React.CSSProperties}
        className={`scribe-app relative mx-auto flex h-[660px] max-h-[calc(100vh-32px)] min-h-[500px] w-[420px] flex-col overflow-hidden rounded-[22px] border border-[#e4e1eb] bg-[#f7f6fa] p-[19px] shadow-[0_25px_80px_#34334b1a,0_3px_12px_#34334b0b] transition-colors dark:border-[#2b2b34] dark:bg-[#19191f] dark:text-[#f4f2fb] max-[480px]:h-screen max-[480px]:max-h-screen max-[480px]:min-h-screen max-[480px]:w-full max-[480px]:rounded-none max-[480px]:border-0 max-[480px]:shadow-none max-[480px]:[padding-top:max(19px,env(safe-area-inset-top))] max-[480px]:[padding-bottom:max(14px,env(safe-area-inset-bottom))] ${dark ? "dark" : ""}`}
        onContextMenu={(event) => {
          const target = event.target as HTMLElement;
          if (!target.closest("input, textarea, select, [contenteditable='true']")) event.preventDefault();
        }}
      >
        {!authLoading && screen !== "auth" && screen !== "verify-email" && <AppHeader
          onHome={() => {
            setProfileOpen(false);
            setScreen("notes");
          }}
          onSettings={openSettings}
          onOpenApp={() =>
            setMessage("The full Scribe app will be available soon.")
          }
          profileOpen={profileOpen}
          onProfileToggle={() => setProfileOpen(!profileOpen)}
          dark={dark}
          onThemeToggle={toggleTheme}
          onSignOut={() => {
            setProfileOpen(false);
            void supabase?.auth.signOut().then(({ error }) => {
              if (error) setAuthError(error.message);
              setScreen("auth");
            });
          }}
          name={profileName}
          email={profileEmail}
          avatar={profileAvatar}
          accent={accent}
        />}
        {authLoading && <div className="flex min-h-0 flex-1 items-center justify-center text-[11px] text-[#92909e]">Checking your session…</div>}
        {!authLoading && screen === "notes" && accountLoaded !== authUser?.id && <div className="flex min-h-0 flex-1 items-center justify-center text-[11px] text-[#92909e]">Opening your local notes…</div>}
        {!authLoading && screen === "notes" && accountLoaded === authUser?.id && (
          <NotesView
            notes={notes}
            folders={folders}
            folderOrder={orderedFolderKeys}
            onCreateFolder={createFolder}
            dark={dark}
            accent={accent}
            syncStatus={syncStatus}
            activeFolder={activeFolder}
            onFolderChange={(folder) => {
              setActiveFolder(folder);
              if (filterPinned) setFilterPinned(false);
            }}
            query={query}
            onQueryChange={setQuery}
            selectedId={selectedId}
            filterPinned={filterPinned}
            onFilterPinned={() => {
              setFilterPinned(!filterPinned);
              setActiveFolder("All notes");
            }}
            onOpenNote={(id) => {
              setSelectedId(id);
              setScreen("view");
            }}
            onTogglePin={togglePin}
            onCreateNote={createNote}
            onNavigate={setScreen}
            onOpenApp={() =>
              setMessage("The full Scribe app will be available soon.")
            }
            onPinned={
              filterPinned
                ? () => setFilterPinned(false)
                : () => {
                    setFilterPinned(true);
                    setActiveFolder("All notes");
                  }
            }
            onRestoreNote={restoreNote}
            onPermanentlyDeleteNote={permanentlyDeleteNote}
            onEditNote={editNoteById}
            onMoveToTrash={moveNoteToTrash}
            onCreateNoteInFolder={(folderName) => {
              if (filterPinned) setFilterPinned(false);
              setActiveFolder(folderName);
              createNote(folderName);
            }}
          />
        )}
        {!authLoading && screen === "view" && (
          <ContextMenu
            accent={accent}
            dark={dark}
            items={selected?.isDeleted
              ? [
                  { label: "Restore note", icon: RotateCcw, onSelect: () => selected && restoreNote(selected.id) },
                  { label: "Delete permanently", icon: Trash2, danger: true, separatorBefore: true, onSelect: () => selected && permanentlyDeleteNote(selected.id) },
                ] satisfies ContextMenuItem[]
              : selected
                ? [
                    { label: "Edit note", icon: Edit3, onSelect: () => editNote("body") },
                    { label: selected.pinned ? "Unpin note" : "Pin note", icon: Pin, onSelect: () => togglePin(selected.id) },
                    { label: "Move to Trash", icon: Trash2, danger: true, separatorBefore: true, onSelect: () => moveNoteToTrash(selected.id) },
                  ] satisfies ContextMenuItem[]
                : []}
          >
          <NoteViewer
            note={selected}
            folders={folders}
            accent={accent}
            dark={dark}
            fontSize={selectedNoteFontSize}
            fontFamily={noteFontFamilyCss[noteFontFamily]}
            onBack={() => setScreen("notes")}
            onEdit={editNote}
            onDelete={deleteNote}
            onTogglePin={() => selected && togglePin(selected.id)}
            onRestore={() => selected && restoreNote(selected.id)}
            onDeletePermanently={() =>
              selected && permanentlyDeleteNote(selected.id)
            }
          />
          </ContextMenu>
        )}
        {!authLoading && screen === "editor" && (
          <NoteEditor
            note={selected}
            folders={folders}
            saved={saved}
            accent={accent}
            dark={dark}
            focusField={editField}
            fontSize={selectedNoteFontSize}
            fontFamily={noteFontFamilyCss[noteFontFamily]}
            onBack={leaveEditor}
            onDiscard={discardDraft}
            onDelete={deleteNote}
            onUpdate={updateSelected}
            onSave={saveNote}
            onTogglePin={() => selected && togglePin(selected.id)}
          />
        )}
        {!authLoading && screen === "settings" && (
          <SettingsView
            dark={dark}
            accent={accent}
            folders={folders}
            folderOrder={orderedFolderKeys}
            noteFontSize={noteFontSize}
            onNoteFontSizeChange={(size) => {
              setNoteFontSize(size);
              localStorage.setItem("scribe-note-font-size", size);
            }}
            noteFontFamily={noteFontFamily}
            onNoteFontFamilyChange={(family) => {
              setNoteFontFamily(family);
              localStorage.setItem("scribe-note-font-family", family);
            }}
            onCreateFolder={createFolder}
            onUpdateFolder={updateFolder}
            onDeleteFolder={deleteFolder}
            onMoveFolder={moveFolder}
            onAccentChange={(value) => {
              setAccent(value);
              localStorage.setItem("scribe-accent", value);
            }}
            onThemeToggle={toggleTheme}
            onNavigate={setScreen}
            onClearNotes={clearNotes}
            onMessage={setMessage}
            name={profileName}
            email={profileEmail}
            setName={updateProfileName}
            avatar={profileAvatar}
            setAvatar={updateProfileAvatar}
            linkedAccounts={linkedIdentities
              ?.filter((identity) => identity.provider === "google" || identity.provider === "github")
              .map((identity) => ({
                provider: identity.provider,
                email: typeof identity.identity_data?.email === "string" ? identity.identity_data.email : undefined,
              })) ?? []}
            linkedIdentityCount={linkedIdentities.length}
            onLinkAccount={linkProviderIdentityAndRefresh}
            onUnlinkAccount={unlinkProviderIdentity}
          />
        )}
        {!authLoading && screen === "auth" && (
          <AuthView
            dark={dark}
            accent={accent}
            onAuthenticated={(accountName, accountEmail) => {
              if (accountName) updateProfileName(accountName);
              if (accountEmail) localStorage.setItem("scribe-profile-email", accountEmail);
              setScreen("notes");
              setMessage("You’re signed in. Your notes are ready.");
            }}
            onSignIn={signIn}
            onSignInWithProvider={startProviderSignIn}
            onRegister={async (name, email, password) => {
              const result = await register(name, email, password);
              return result;
            }}
            onResendVerification={resendVerification}
            onMessage={setMessage}
          />
        )}
        {authError && screen === "auth" && !authLoading && <div role="alert" className="absolute bottom-[65px] left-5 right-5 rounded-xl border border-[#f2cbd0] bg-[#fff5f6] px-3 py-2 text-[9px] text-[#a84455] dark:border-[#57333a] dark:bg-[#321f24] dark:text-[#f3aab4]">{authError}</div>}
        {message && (
          <div
            role="status"
            aria-live="polite"
            className="absolute bottom-[68px] left-[18px] right-[18px] z-10 flex min-h-[42px] animate-[toastIn_.18s_ease-out] items-center gap-3 rounded-[12px] border px-3 py-2 text-[10px] shadow-[0_8px_24px_#28263c20]"
            style={{
              borderColor: `${accent}45`,
              backgroundColor: dark
                ? `color-mix(in srgb, ${accent} 14%, #24232b)`
                : `color-mix(in srgb, ${accent} 8%, white)`,
              color: dark ? "#f0edf9" : "#373443",
            }}
          >
            <span className="min-w-0 flex-1">{message}</span>
            <button
              aria-label="Dismiss notification"
              className="grid size-7 shrink-0 place-items-center rounded-lg text-[#858491] transition hover:bg-black/5 hover:text-[var(--scribe-accent)] dark:hover:bg-white/10"
              onClick={() => setMessage("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
