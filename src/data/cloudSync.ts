import type { User } from "@supabase/supabase-js";
import type { Folder, Note } from "../types";
import { supabase } from "../lib/supabase";
import { documentToMarkdown, markdownToDocument } from "./richTextDocument";

type Entity = "note" | "folder";
type Operation = {
  id: string; entity: Entity; entityId: string; kind: "upsert" | "delete";
  snapshot: Note | Folder | null; baseUpdatedAt: string | null; baseVersion?: number;
  revisionId: string; sequence: number;
};
export type AccountCache = { userId: string; notes: Note[]; folders: Folder[]; outbox: Operation[]; cursor: string | null; hasMore?: boolean; inFlight?: { id: string; operations: Operation[]; payload: Record<string, unknown>[] } };
const dbName = "scribe-extension-local-first";
let dbPromise: Promise<IDBDatabase> | undefined;
function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);
    request.onupgradeneeded = () => request.result.createObjectStore("accounts", { keyPath: "userId" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local notes storage."));
  }).catch((error) => { dbPromise = undefined; throw error; });
  return dbPromise;
}
function save(cache: AccountCache) {
  return openDb().then((db) => new Promise<void>((resolve, reject) => {
    const tx = db.transaction("accounts", "readwrite", { durability: "strict" });
    tx.objectStore("accounts").put(cache);
    tx.oncomplete = () => resolve();
    tx.onerror = tx.onabort = () => reject(tx.error ?? new Error("Could not save notes locally."));
  }));
}
export async function loadAccount(userId: string): Promise<AccountCache> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const request = db.transaction("accounts", "readonly").objectStore("accounts").get(userId);
    request.onsuccess = () => resolve(request.result ?? { userId, notes: [], folders: [], outbox: [], cursor: null });
    request.onerror = () => reject(request.error ?? new Error("Could not load local notes."));
  });
}
const now = () => new Date().toISOString();
const iconToCloud = (icon: string) => icon === "lightbulb" ? "idea" : icon === "plane" ? "travel" : icon;
const iconFromCloud = (icon: string) => icon === "idea" ? "lightbulb" : icon === "travel" ? "plane" : icon;
const colorToCloud = (color: string) => ({ "#8970ed": "violet", "#9477ff": "violet", "#4697f6": "blue", "#379be9": "blue", "#22b893": "mint", "#22c89a": "mint", "#f5ae32": "amber", "#e7a642": "amber", "#ed638e": "rose", "#df69a2": "rose", "#20bfcc": "cyan" } as Record<string, string>)[color.toLowerCase()] ?? "violet";
const colorFromCloud = (color: string) => ({ violet: "#9477ff", blue: "#4697f6", mint: "#22c89a", amber: "#f5ae32", rose: "#ed638e", cyan: "#20bfcc" } as Record<string, string>)[color.toLowerCase()] ?? (color.startsWith("#") ? color : "#8970ed");
function normalizeNote(row: Record<string, unknown>, folders: Folder[]): Note {
  const folderId = typeof row.folder_id === "string" ? row.folder_id : "";
  const folder = folders.find((item) => item.id === folderId)?.name ?? "";
  return { id: String(row.id), title: String(row.title ?? ""), body: documentToMarkdown(row.content), folder, folderId: folderId || null, color: "#8970ed", version: Number(row.version) || undefined, createdAt: String(row.created_at ?? now()), updatedAt: String(row.updated_at ?? now()), updated: "Saved", baseUpdatedAt: String(row.updated_at ?? now()), pinned: Boolean(row.is_pinned), isDraft: Boolean(row.is_draft), isDeleted: Boolean(row.deleted_at), isNew: false };
}
function noteSnapshot(note: Note, folders: Folder[]) {
  return { title: note.title, content: markdownToDocument(note.body), folder_id: note.folderId ?? folders.find((folder) => folder.name === note.folder)?.id ?? null, is_pinned: Boolean(note.pinned), is_draft: Boolean(note.isDraft), deleted_at: note.isDeleted ? (note.updatedAt || now()) : null, created_at: note.createdAt ?? now() };
}
function folderSnapshot(folder: Folder) {
  return { name: folder.name, icon: iconToCloud(folder.icon), color: colorToCloud(folder.color), created_at: folder.createdAt ?? now() };
}
function queue(cache: AccountCache, entity: Entity, id: string, snapshot: Note | Folder | null, kind: "upsert" | "delete") {
  const key = `${entity}:${id}`;
  const previous = cache.outbox.find((op) => `${op.entity}:${op.entityId}` === key);
  const existing = entity === "note" ? cache.notes.find((item) => item.id === id) : cache.folders.find((item) => item.id === id);
  cache.outbox = cache.outbox.filter((op) => `${op.entity}:${op.entityId}` !== key);
  cache.outbox.push({ id: key, entity, entityId: id, kind, snapshot, baseUpdatedAt: previous ? previous.baseUpdatedAt : (existing?.updatedAt || null), baseVersion: previous ? previous.baseVersion : existing?.version, revisionId: crypto.randomUUID(), sequence: previous?.sequence ?? Date.now() });
}
function encode(op: Operation, cache: AccountCache) {
  return { revisionId: op.revisionId, entity: op.entity, id: op.entityId, kind: op.kind, baseVersion: op.baseVersion ?? null, baseUpdatedAt: op.baseUpdatedAt, snapshot: op.kind === "delete" ? null : op.entity === "note" ? noteSnapshot(op.snapshot as Note, cache.folders) : folderSnapshot(op.snapshot as Folder) };
}
function fromRow(entity: Entity, row: Record<string, unknown> | null, folders: Folder[]): Note | Folder | null {
  if (!row) return null;
  if (entity === "note") return normalizeNote(row, folders);
  return { id: String(row.id), name: String(row.name ?? "New folder"), icon: iconFromCloud(String(row.icon ?? "folder")), color: colorFromCloud(String(row.color ?? "violet")), version: Number(row.version) || undefined, createdAt: String(row.created_at ?? now()), updatedAt: String(row.updated_at ?? now()), sortOrder: 0 };
}
export async function syncAccount(user: User, cache: AccountCache): Promise<AccountCache> {
  if (!supabase) throw new Error("Supabase is not configured.");
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError || session?.user.id !== user.id) throw new Error("The signed-in account changed. Local changes are queued for that account.");
  const rank = (op: Operation) => op.entity === "note" && op.kind === "delete" ? -1 : op.entity === "folder" && op.kind === "upsert" ? 0 : op.entity === "folder" ? 2 : 1;
  const operations = (cache.inFlight?.operations ?? [...cache.outbox].sort((a, b) => rank(a) - rank(b) || a.sequence - b.sequence).slice(0, 50));
  const batch = cache.inFlight ?? { id: crypto.randomUUID(), operations, payload: operations.map((op) => encode(op, cache)) };
  cache.inFlight = batch;
  await save(cache);
  const { data, error } = await supabase.rpc("sync_notes_batch", { p_batch_id: batch.id, p_operations: batch.payload, p_cursor: cache.cursor }).setHeader("Authorization", `Bearer ${session.access_token}`).abortSignal(AbortSignal.timeout(20_000));
  if (error) {
    if (error.message.includes("SCRIBE_STORAGE_LIMIT_REACHED")) {
      // The server rolled this transaction back; prepare a fresh batch so
      // deletions or smaller local edits can resolve the storage limit.
      cache.inFlight = undefined;
      await save(cache);
      throw new Error("Cloud storage limit reached (10 MB). Permanently delete unwanted notes or shorten their content to free space.");
    }
    if (/function .*sync_notes_batch.* does not exist|schema cache/i.test(error.message)) throw new Error(`${error.message} Apply the Scribe batch-sync migration to this Supabase project.`);
    throw new Error(error.message);
  }
  const reply = data as { cursor: string; full: boolean; hasMore: boolean; changes: { entity: Entity; id: string; snapshot: Record<string, unknown> | null }[]; results: { revisionId: string; entity: Entity; status: "applied" | "conflict"; snapshot: Record<string, unknown> | null }[] };
  const sentRevisions = new Set(batch.operations.map((op) => op.revisionId));
  if (reply.results.length !== batch.operations.length || reply.results.some((result) => !sentRevisions.has(result.revisionId))) throw new Error("The sync response did not match the submitted batch.");
  const localNotes = new Map(cache.notes.map((item) => [item.id, item]));
  const localFolders = new Map(cache.folders.map((item) => [item.id, item]));
  if (reply.full) { localNotes.clear(); localFolders.clear(); }
  const changed = new Set<string>();
  for (const change of reply.changes) {
    const key = `${change.entity}:${change.id}`; changed.add(key);
    const value = fromRow(change.entity, change.snapshot, [...localFolders.values()]);
    const target = change.entity === "note" ? localNotes : localFolders;
    if (value) target.set(change.id, value as never); else target.delete(change.id);
  }
  for (const result of reply.results) {
    const sent = batch.operations.find((op) => op.revisionId === result.revisionId)!;
    const key = `${sent.entity}:${sent.entityId}`;
    const pendingIndex = cache.outbox.findIndex((op) => op.id === key);
    const latest = pendingIndex >= 0 ? cache.outbox[pendingIndex] : undefined;
    if (result.status === "conflict" && latest?.kind === "upsert" && latest.snapshot) {
      const copy = { ...latest.snapshot, id: crypto.randomUUID(), version: undefined, createdAt: now(), updatedAt: now() };
      if (sent.entity === "note") { (copy as Note).title = `${(copy as Note).title || "Untitled note"} (conflict copy)`; (copy as Note).isDeleted = false; queue(cache, "note", copy.id, copy as Note, "upsert"); localNotes.set(copy.id, copy as Note); }
      else { (copy as Folder).name += " (conflict copy)"; queue(cache, "folder", copy.id, copy as Folder, "upsert"); localFolders.set(copy.id, copy as Folder); }
      cache.outbox = cache.outbox.filter((op) => op.id !== key);
      if (!changed.has(key) && result.snapshot) {
        const target = sent.entity === "note" ? localNotes : localFolders;
        target.set(sent.entityId, fromRow(sent.entity, result.snapshot, [...localFolders.values()]) as never);
      }
    } else if (result.status === "conflict") {
      // A remote delete/update wins for the original ID. Never retry a stale
      // local delete indefinitely; preserve remote state and retire the delete.
      cache.outbox = cache.outbox.filter((op) => op.id !== key);
      if (!changed.has(key)) {
        const target = sent.entity === "note" ? localNotes : localFolders;
        const value = fromRow(sent.entity, result.snapshot, [...localFolders.values()]);
        if (value) target.set(sent.entityId, value as never); else target.delete(sent.entityId);
      }
    } else if (latest?.revisionId === sent.revisionId) cache.outbox = cache.outbox.filter((op) => op.id !== key);
    else if (latest && result.status === "applied") {
      const server = fromRow(sent.entity, result.snapshot, [...localFolders.values()]) as Note | Folder | null;
      cache.outbox[pendingIndex] = { ...latest, baseVersion: server?.version, baseUpdatedAt: server?.updatedAt ?? null, snapshot: latest.snapshot ? { ...latest.snapshot, version: server?.version } : null };
    }
    if (!changed.has(key) && result.snapshot && result.status === "applied") {
      const target = sent.entity === "note" ? localNotes : localFolders;
      target.set(sent.entityId, fromRow(sent.entity, result.snapshot, [...localFolders.values()]) as never);
    }
  }
  for (const op of cache.outbox) {
    const target = op.entity === "note" ? localNotes : localFolders;
    if (op.kind === "delete") target.delete(op.entityId);
    else if (op.snapshot) target.set(op.entityId, op.snapshot as never);
  }
  for (const note of localNotes.values()) {
    const linkedFolder = note.folderId ? localFolders.get(note.folderId) : undefined;
    if (linkedFolder) note.folder = linkedFolder.name;
    else if (note.folderId && !localFolders.has(note.folderId)) { note.folderId = null; note.folder = ""; }
  }
  cache.notes = [...localNotes.values()].sort((a, b) => (b.updatedAt ?? "").localeCompare(a.updatedAt ?? ""));
  cache.folders = [...localFolders.values()];
  cache.cursor = reply.cursor;
  cache.hasMore = reply.hasMore;
  delete cache.inFlight;
  await save(cache);
  return cache;
}

export async function updateAccountCache(cache: AccountCache, notes: Note[], folders: Folder[], permanentDeletedIds: string[] = []) {
  const previousNotes = new Map(cache.notes.map((note) => [note.id, note]));
  const previousFolders = new Map(cache.folders.map((folder) => [folder.id, folder]));
  for (const note of notes) {
    const before = previousNotes.get(note.id);
    if (!before || JSON.stringify([before.title,before.body,before.folder,before.folderId,before.pinned,before.isDraft,before.isDeleted]) !== JSON.stringify([note.title,note.body,note.folder,note.folderId,note.pinned,note.isDraft,note.isDeleted])) queue(cache,"note",note.id,note,"upsert");
  }
  for (const id of permanentDeletedIds) queue(cache,"note",id,null,"delete");
  for (const id of previousNotes.keys()) if (!notes.some((note) => note.id === id) && !permanentDeletedIds.includes(id)) queue(cache,"note",id,null,"delete");
  for (const folder of folders) {
    const before = previousFolders.get(folder.id);
    if (!before || JSON.stringify([before.name,before.icon,before.color]) !== JSON.stringify([folder.name,folder.icon,folder.color])) queue(cache,"folder",folder.id,folder,"upsert");
  }
  for (const id of previousFolders.keys()) if (!folders.some((folder) => folder.id === id)) queue(cache,"folder",id,null,"delete");
  cache.notes = notes; cache.folders = folders;
  await save(cache);
  return cache;
}
