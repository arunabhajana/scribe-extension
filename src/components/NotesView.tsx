import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CloudUpload,
  FilePenLine,
  FileText,
  Edit3,
  FolderOpen,
  LoaderCircle,
  Pin,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { Folder, Note, Screen } from "../types";
import { NoteCard } from "./NoteCard";
import { FolderGlyph } from "./FolderGlyph";
import { FolderManager } from "./FolderManager";
import { Tooltip } from "./Tooltip";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";
import { defaultNoteSort, sortNotes } from "../data/noteSorting";
import { useNoteSortPreferences } from "../hooks/useNoteSortPreferences";
import { NoteSortDropdown } from "./NoteSortDropdown";

type Props = {
  accountId: string;
  notes: Note[];
  folders: Folder[];
  folderOrder: string[];
  onCreateFolder: (folder: Folder) => void;
  onUpdateFolder: (id: string, folder: Folder) => void;
  dark: boolean;
  accent: string;
  syncStatus: "pending" | "syncing" | "synced" | "error";
  activeFolder: string;
  onFolderChange: (folder: string) => void;
  query: string;
  onQueryChange: (query: string) => void;
  selectedId: string | null;
  filterPinned: boolean;
  onFilterPinned: () => void;
  onOpenNote: (id: string) => void;
  onTogglePin: (id: string) => void;
  onCreateNote: () => void;
  onNavigate: (screen: Screen) => void;
  onOpenApp: () => void;
  onPinned: () => void;
  onRestoreNote: (id: string) => void;
  onPermanentlyDeleteNote: (id: string) => void;
  onEditNote: (id: string) => void;
  onMoveToTrash: (id: string) => void;
  onCreateNoteInFolder: (folderName: string) => void;
};

export function NotesView(props: Props) {
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const editingFolder = props.folders.find((folder) => folder.id === editingFolderId);
  const { preferences: sortPreferences, setPreference: setSortPreference } = useNoteSortPreferences();
  const activeFolderId = props.folders.find((folder) => folder.name === props.activeFolder)?.id;
  const sortKey = `${props.accountId}:${activeFolderId ? `folder:${activeFolderId}` : props.activeFolder}:${props.filterPinned ? "pinned" : "all"}`;
  const sortOrder = sortPreferences[sortKey] ?? defaultNoteSort;
  const folderScrollRef = useRef<HTMLDivElement>(null);
  const [hasMoreFolders, setHasMoreFolders] = useState(false);
  const [canGoBack, setCanGoBack] = useState(false);
  const updateFolderOverflow = useCallback(() => {
    const element = folderScrollRef.current;
    if (element) {
      setCanGoBack(element.scrollLeft > 2);
      setHasMoreFolders(
        element.scrollWidth - element.clientWidth - element.scrollLeft > 2,
      );
    }
  }, []);
  useEffect(() => {
    const element = folderScrollRef.current;
    if (!element) return;
    updateFolderOverflow();
    const observer = new ResizeObserver(updateFolderOverflow);
    observer.observe(element);
    if (element.firstElementChild) observer.observe(element.firstElementChild);
    return () => observer.disconnect();
  }, [updateFolderOverflow, props.folders.length]);
  const visibleNotes = useMemo(
    () =>
      sortNotes(props.notes
        .filter((note) => {
          const sectionMatches =
            props.activeFolder === "Trash"
              ? note.isDeleted
              : props.activeFolder === "Drafts"
                ? note.isDraft && !note.isDeleted
                : props.activeFolder === "All notes"
                  ? !note.isDraft && !note.isDeleted
                  : !note.isDraft &&
                    !note.isDeleted &&
                    note.folder === props.activeFolder;
          return (
            sectionMatches &&
            (!props.filterPinned || note.pinned) &&
            `${note.title} ${note.body}`
              .toLowerCase()
              .includes(props.query.toLowerCase())
          );
        }), sortOrder),
    [props.notes, props.activeFolder, props.filterPinned, props.query, sortOrder],
  );
  return (
    <>
      <div className="mb-[10px] mt-[22px] flex justify-between px-0.5 text-[9px] font-bold tracking-[1.15px] text-[#706f7d]">
        <span className="flex items-center gap-1.5" aria-live="polite">
          {props.syncStatus === "syncing" ? (
            <>
              <LoaderCircle
                size={12}
                className="animate-spin"
                style={{ color: props.accent }}
              />
              SYNCING TO CLOUD
            </>
          ) : props.syncStatus === "pending" ? (
            <>
              <CloudUpload size={12} style={{ color: props.accent }} />
              WAITING TO SYNC
            </>
          ) : props.syncStatus === "error" ? (
            <>
              <AlertCircle size={12} className="text-[#ed5260]" />
              CLOUD SYNC FAILED
            </>
          ) : (
            <>
              <CheckCircle2 size={12} style={{ color: props.accent }} />
              SYNCED TO CLOUD
            </>
          )}
        </span>
        <span className="font-semibold tracking-[.65px]">
          {visibleNotes.length}{" "}
          {props.activeFolder === "Drafts"
            ? "DRAFTS"
            : props.activeFolder === "Trash"
              ? "IN TRASH"
              : "NOTES"}
        </span>
      </div>
      <button
        style={{
          backgroundColor: props.accent,
          boxShadow: `0 6px 16px ${props.accent}38`,
        }}
        className="flex h-12 shrink-0 items-center gap-2.5 rounded-[13px] px-[14px] text-sm font-semibold text-white transition hover:-translate-y-px hover:brightness-105"
        onClick={props.onCreateNote}
      >
        <Plus size={23} />
        <span>New note</span>
      </button>
      <div className="relative flex h-[52px] shrink-0 items-center gap-2 border-b border-[#e5e2eb] dark:border-[#33323a]">
        <div
          ref={folderScrollRef}
          className="folder-filter-scroll flex min-w-0 flex-1 items-center gap-1 overflow-x-auto overflow-y-visible py-1 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          onScroll={updateFolderOverflow}
          onWheel={(event) => {
            if (event.deltaY !== 0) {
              event.currentTarget.scrollLeft += event.deltaY;
              event.preventDefault();
            }
          }}
        >
          <button
            style={
              {
                "--filter-accent": props.accent,
                ...(props.activeFolder === "All notes"
                  ? {
                      color: props.accent,
                      backgroundColor: `${props.accent}20`,
                    }
                  : {}),
              } as React.CSSProperties
            }
            className={`flex h-[32px] shrink-0 items-center rounded-[9px] px-3 text-[11px] transition-colors hover:bg-[color-mix(in_srgb,var(--filter-accent)_14%,transparent)] hover:text-[var(--filter-accent)] ${props.activeFolder === "All notes" ? "font-semibold" : "text-[#747586] dark:text-[#a8a6b7]"}`}
            onClick={() => {
              props.onFolderChange("All notes");
              if (props.filterPinned) props.onFilterPinned();
            }}
          >
            All
          </button>
          {props.folderOrder.map((key) => {
            const folder = key.startsWith("folder:")
              ? props.folders.find((item) => `folder:${item.id}` === key)
              : undefined;
            if (folder)
              return (
                <ContextMenu key={key} accent={props.accent} dark={props.dark} items={[
                  { label: "Open folder", icon: FolderOpen, onSelect: () => {
                    props.onFolderChange(folder.name);
                    if (props.filterPinned) props.onFilterPinned();
                  } },
                  { label: "New note in folder", icon: Plus, onSelect: () => props.onCreateNoteInFolder(folder.name) },
                  { label: "Edit folder", icon: Edit3, onSelect: () => setEditingFolderId(folder.id) },
                ]}>
                  <button
                    className={`flex h-[32px] shrink-0 items-center gap-1.5 rounded-[9px] px-2.5 text-[11px] transition hover:-translate-y-px ${props.activeFolder === folder.name ? "font-semibold" : "text-[#747586] hover:bg-[#f7f5ff] dark:text-[#a8a6b7] dark:hover:bg-[#292830]"}`}
                    style={
                      props.activeFolder === folder.name
                        ? {
                            color: folder.color,
                            backgroundColor: `${folder.color}18`,
                          }
                        : undefined
                    }
                    onClick={() => {
                      props.onFolderChange(folder.name);
                      if (props.filterPinned) props.onFilterPinned();
                    }}
                  >
                    <FolderGlyph folder={folder} size={15} />
                    {folder.name}
                  </button>
                </ContextMenu>
              );
            if (key === "system:drafts")
              return (
                <button
                  key={key}
                  className={`flex h-[32px] shrink-0 items-center gap-1.5 rounded-[9px] px-2.5 text-[11px] transition ${props.activeFolder === "Drafts" ? "font-semibold" : "text-[#747586] hover:bg-[#f7f5ff] dark:text-[#a8a6b7] dark:hover:bg-[#292830]"}`}
                  style={{
                    color:
                      props.activeFolder === "Drafts" ? props.accent : undefined,
                    backgroundColor:
                      props.activeFolder === "Drafts" ? `${props.accent}18` : undefined,
                  }}
                  onClick={() => props.onFolderChange("Drafts")}
                >
              <FilePenLine size={15} style={{ color: props.accent }} />
                  Drafts
                </button>
              );
            return (
              <button
                key={key}
                className={`flex h-[32px] shrink-0 items-center gap-1.5 rounded-[9px] px-2.5 text-[11px] transition ${props.activeFolder === "Trash" ? "font-semibold" : "text-[#747586] hover:bg-[#fff3f3] dark:text-[#a8a6b7] dark:hover:bg-[#302427]"}`}
                style={{
                  color: props.activeFolder === "Trash" ? "#e46d78" : undefined,
                  backgroundColor:
                    props.activeFolder === "Trash" ? "#e46d7818" : undefined,
                }}
                onClick={() => props.onFolderChange("Trash")}
              >
                <Trash2 size={15} className="text-[#e46d78]" />
                Trash
              </button>
            );
          })}
          <FolderManager
            folders={props.folders}
            onCreate={props.onCreateFolder}
            dark={props.dark}
            accent={props.accent}
          />
          {editingFolder && <FolderManager
            key={editingFolder.id}
            folders={props.folders}
            editingFolder={editingFolder}
            onCreate={props.onCreateFolder}
            onUpdate={props.onUpdateFolder}
            onClose={() => setEditingFolderId(null)}
            dark={props.dark}
            accent={props.accent}
          />}
        </div>
        {canGoBack && (
          <button
            aria-label="Scroll to previous folders"
            title="Previous folders"
            className="grid size-7 shrink-0 place-items-center rounded-lg text-[#706e7c] transition hover:bg-[color-mix(in_srgb,var(--scribe-accent)_14%,transparent)] hover:text-[var(--scribe-accent)] dark:text-[#aaa8b7]"
            onClick={() =>
              folderScrollRef.current?.scrollBy({
                left: -Math.max(
                  100,
                  (folderScrollRef.current?.clientWidth ?? 0) * 0.7,
                ),
                behavior: "smooth",
              })
            }
          >
            <ArrowLeft size={15} />
          </button>
        )}
        {hasMoreFolders && (
          <button
            aria-label="Scroll to more folders"
            title="More folders"
            className="grid size-7 shrink-0 place-items-center rounded-lg text-[#706e7c] transition hover:bg-[color-mix(in_srgb,var(--scribe-accent)_14%,transparent)] hover:text-[var(--scribe-accent)] dark:text-[#aaa8b7]"
            onClick={() =>
              folderScrollRef.current?.scrollBy({
                left: Math.max(
                  100,
                  (folderScrollRef.current?.clientWidth ?? 0) * 0.7,
                ),
                behavior: "smooth",
              })
            }
          >
            <ArrowRight size={15} />
          </button>
        )}
        <Tooltip label="Create folder" accent={props.accent} dark={props.dark}>
          <button
            className="mx-1 grid size-8 shrink-0 place-items-center rounded-lg text-[#706e7c] transition hover:bg-[color-mix(in_srgb,var(--scribe-accent)_14%,transparent)] hover:text-[var(--scribe-accent)] dark:text-[#aaa8b7]"
            aria-label="Create folder"
            onClick={() =>
              document.getElementById("folder-create-trigger")?.click()
            }
          >
            <Plus size={16} />
          </button>
        </Tooltip>
        <Tooltip
          label={props.filterPinned ? "Show all notes" : "Show pinned notes"}
          accent={props.accent}
          dark={props.dark}
        >
          <button
            style={
              props.filterPinned
                ? { backgroundColor: `${props.accent}20`, color: props.accent }
                : undefined
            }
            className={`grid size-8 shrink-0 place-items-center rounded-lg transition-colors ${props.filterPinned ? "" : "text-[#858491] dark:text-[#c0bdce]"}`}
            onMouseEnter={(event) => {
              if (!props.filterPinned) {
                event.currentTarget.style.color = props.accent;
                event.currentTarget.style.backgroundColor = `${props.accent}18`;
              }
            }}
            onMouseLeave={(event) => {
              if (!props.filterPinned) {
                event.currentTarget.style.color = "";
                event.currentTarget.style.backgroundColor = "";
              }
            }}
            aria-label={
              props.filterPinned ? "Show all notes" : "Show pinned notes"
            }
            onClick={props.onFilterPinned}
          >
            <Pin
              size={16}
              fill={props.filterPinned ? "currentColor" : "none"}
            />
          </button>
        </Tooltip>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-2 pb-1 pt-2">
        <span className="min-w-0 truncate text-[9px] font-medium text-[#747586] dark:text-[#a8a6b7]">{props.filterPinned ? "Pinned notes" : props.activeFolder}</span>
        <NoteSortDropdown value={sortOrder} onChange={(value) => setSortPreference(sortKey, value)} />
      </div>
      <section
        className="notes-scroll flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pl-px pr-2 pt-2 pb-[9px]"
        aria-label="Notes"
      >
        {visibleNotes.length ? (
          visibleNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              folder={props.folders.find(
                (folder) => folder.name === note.folder,
              )}
              active={props.selectedId === note.id}
              accent={props.accent}
              dark={props.dark}
              onOpen={() => props.onOpenNote(note.id)}
              onTogglePin={() => props.onTogglePin(note.id)}
              onRestore={() => props.onRestoreNote(note.id)}
              onDeletePermanently={() => props.onPermanentlyDeleteNote(note.id)}
              contextItems={note.isDeleted
                ? [
                    { label: "Restore note", icon: RotateCcw, onSelect: () => props.onRestoreNote(note.id) },
                    { label: "Delete permanently", icon: Trash2, danger: true, separatorBefore: true, onSelect: () => props.onPermanentlyDeleteNote(note.id) },
                  ] satisfies ContextMenuItem[]
                : [
                    { label: "Open note", icon: FileText, onSelect: () => props.onOpenNote(note.id) },
                    { label: "Edit note", icon: Edit3, onSelect: () => props.onEditNote(note.id) },
                    { label: note.pinned ? "Unpin note" : "Pin note", icon: Pin, onSelect: () => props.onTogglePin(note.id) },
                    { label: "Move to Trash", icon: Trash2, danger: true, separatorBefore: true, onSelect: () => props.onMoveToTrash(note.id) },
                  ] satisfies ContextMenuItem[]}
            />
          ))
        ) : (
          <div className="flex min-h-40 flex-1 flex-col items-center justify-center gap-1.5 text-[#8d8d9a]">
            <span
              className="mb-1.5 grid size-[43px] place-items-center rounded-[14px] text-[var(--scribe-accent)]"
              style={{ backgroundColor: `${props.accent}20` }}
            >
              {props.activeFolder === "Trash" ? (
                <Trash2 size={22} />
              ) : props.activeFolder === "Drafts" ? (
                <FilePenLine size={22} />
              ) : (
                <FileText size={22} />
              )}
            </span>
            <strong className="text-xs text-[#454552] dark:text-[#eeecf4]">
              {props.query
                ? "No matching notes"
                : props.activeFolder === "Trash"
                  ? "Trash is empty"
                  : props.activeFolder === "Drafts"
                    ? "No drafts yet"
                    : "Nothing here yet"}
            </strong>
            <span className="text-[10px]">
              {props.query
                ? "Try another search."
                : props.activeFolder === "Trash"
                  ? "Deleted notes will appear here."
                  : props.activeFolder === "Drafts"
                    ? "Unfinished notes are saved here."
                    : "Create a note to get started."}
            </span>
          </div>
        )}
      </section>
      <div className="shrink-0 border-t border-[#e5e2eb] pt-2 dark:border-[#33323a]">
        <label className="flex h-[40px] items-center gap-2 rounded-[10px] border border-[#dfdce6] bg-[#f1eff5] px-3 text-[#74727f] transition focus-within:border-[var(--scribe-accent)] focus-within:shadow-[0_0_0_2px_color-mix(in_srgb,var(--scribe-accent)_18%,transparent)] dark:border-[#383740] dark:bg-[#222127]">
          <Search size={16} className="shrink-0" />
          <input
            value={props.query}
            onChange={(event) => props.onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                props.onQueryChange("");
                event.currentTarget.blur();
              }
            }}
            placeholder="Search your notes"
            className="h-full min-w-0 flex-1 bg-transparent text-[11px] text-[#393844] outline-none placeholder:text-[#74727f] focus:outline-none focus:ring-0 dark:text-[#eceaf2]"
          />
          {props.query && (
            <button
              aria-label="Clear note search"
              className="rounded p-1 hover:bg-black/5 dark:hover:bg-white/10"
              onClick={() => props.onQueryChange("")}
            >
              <X size={13} />
            </button>
          )}
        </label>
      </div>
    </>
  );
}
