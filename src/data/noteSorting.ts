import type { Note } from "../types";

export const noteSortOptions = [
  { value: "modified-desc", label: "Last modified · newest first" },
  { value: "modified-asc", label: "Last modified · oldest first" },
  { value: "name-asc", label: "Name · A–Z" },
  { value: "name-desc", label: "Name · Z–A" },
  { value: "created-desc", label: "Date created · newest first" },
  { value: "created-asc", label: "Date created · oldest first" },
] as const;
export type NoteSort = typeof noteSortOptions[number]["value"];
export const defaultNoteSort: NoteSort = "modified-desc";
export function isNoteSort(value: unknown): value is NoteSort {
  return noteSortOptions.some((option) => option.value === value);
}

const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: "base" });
function timestamp(value?: string) {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isFinite(parsed) ? parsed : null;
}

export function sortNotes(notes: Note[], order: NoteSort) {
  return [...notes].sort((a, b) => {
    let comparison = 0;
    if (order.startsWith("name")) {
      comparison = collator.compare(a.title.trim() || "Untitled note", b.title.trim() || "Untitled note");
      if (order === "name-desc") comparison *= -1;
    } else {
      const created = order.startsWith("created");
      const first = timestamp(created ? a.createdAt : a.updatedAt) ?? (created ? null : timestamp(a.createdAt));
      const second = timestamp(created ? b.createdAt : b.updatedAt) ?? (created ? null : timestamp(b.createdAt));
      // Missing timestamps stay at the end for either direction.
      if (first === null && second !== null) return 1;
      if (second === null && first !== null) return -1;
      if (first !== null && second !== null) comparison = order.endsWith("asc") ? first - second : second - first;
    }
    return comparison || collator.compare(a.title, b.title) || a.id.localeCompare(b.id);
  });
}

const storageKey = "scribe-note-sort";
function validPreferences(value: unknown): Record<string, NoteSort> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, NoteSort] => isNoteSort(entry[1])));
}

export function readNoteSortPreferences(): Record<string, NoteSort> {
  try {
    return validPreferences(JSON.parse(localStorage.getItem(storageKey) ?? "{}"));
  } catch { return {}; }
}

function cachePreferences(preferences: Record<string, NoteSort>) {
  try { localStorage.setItem(storageKey, JSON.stringify(preferences)); }
  catch { /* Chrome storage remains the persistent source when available. */ }
}

export async function loadNoteSortPreferences(): Promise<Record<string, NoteSort>> {
  const cached = readNoteSortPreferences();
  if (typeof chrome === "undefined" || !chrome.storage?.local) return cached;
  try {
    const stored = (await chrome.storage.local.get(storageKey))[storageKey];
    const preferences = { ...cached, ...validPreferences(stored) };
    return preferences;
  } catch { return cached; }
}

let saveQueue: Promise<void> = Promise.resolve();
export function saveNoteSortPreference(key: string, value: NoteSort) {
  cachePreferences({ ...readNoteSortPreferences(), [key]: value });
  saveQueue = saveQueue.then(async () => {
    if (typeof chrome === "undefined" || !chrome.storage?.local) return;
    const stored = (await chrome.storage.local.get(storageKey))[storageKey];
    const preferences = { ...readNoteSortPreferences(), ...validPreferences(stored), [key]: value };
    await chrome.storage.local.set({ [storageKey]: preferences });
  }).catch(() => { /* The synchronous local cache still preserves the choice. */ });
}
