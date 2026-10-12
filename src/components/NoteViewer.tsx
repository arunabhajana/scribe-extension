import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  Pin,
  RotateCcw,
  Trash2,
} from "lucide-react";
import type { Folder, Note } from "../types";
import { FolderGlyph } from "./FolderGlyph";
import { MarkdownPreview } from "./MarkdownPreview";
import { Tooltip } from "./Tooltip";

type Props = {
  note: Note | undefined;
  folders: Folder[];
  accent: string;
  dark: boolean;
  fontSize: number;
  fontFamily: string;
  onBack: () => void;
  onEdit: (field?: "title" | "body") => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onRestore: () => void;
  onDeletePermanently: () => void;
};

export function NoteViewer({
  note,
  folders,
  accent,
  dark,
  fontSize,
  fontFamily,
  onBack,
  onEdit,
  onDelete,
  onTogglePin,
  onRestore,
  onDeletePermanently,
}: Props) {
  if (!note)
    return (
      <section className="flex min-h-0 flex-1 flex-col pt-2">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-[#747586]"
        >
          <ArrowLeft size={17} />
          Back to notes
        </button>
        <p className="m-auto text-xs text-[#858491]">
          This note is no longer available.
        </p>
      </section>
    );
  const folder = folders.find((item) => item.name === note.folder);
  const folderColor = folder?.color ?? accent;
  function editFromBody(event: React.KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onEdit("body");
    }
  }
  return (
    <section className="flex min-h-0 flex-1 flex-col pt-2">
      <div className="mb-3 flex h-[38px] shrink-0 items-center gap-2.5">
        <button
          className="-ml-1.5 flex h-8 items-center gap-1.5 rounded-lg px-1.5 text-[10px] font-medium text-[#686674] transition hover:bg-[#ebe9f1] dark:text-[#b5b2c0] dark:hover:bg-white/5"
          aria-label="Back to notes"
          onClick={onBack}
        >
          <ArrowLeft size={17} />
          Notes
        </button>
        <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-[#706e7c] dark:text-[#92919f]">
          {note.isDeleted
            ? "In Trash"
            : note.isDraft
              ? "Draft"
              : "Reading note"}
        </span>
        {note.isDeleted ? (
          <>
            <button
              style={{ color: accent, borderColor: `${accent}55` }}
              className="flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-semibold transition hover:bg-[color-mix(in_srgb,var(--scribe-accent)_10%,transparent)]"
              onClick={onRestore}
            >
              <RotateCcw size={13} />
              Restore
            </button>
            <Tooltip label="Delete permanently" accent={accent} dark={dark}>
              <button
                className="grid size-[32px] place-items-center rounded-lg text-[#e45e68] transition hover:bg-[#ed526018]"
                aria-label="Delete permanently"
                onClick={onDeletePermanently}
              >
                <Trash2 size={16} />
              </button>
            </Tooltip>
          </>
        ) : (
          <>
            <Tooltip
              label={note.pinned ? "Unpin note" : "Pin note"}
              accent={accent}
              dark={dark}
            >
              <button
                style={
                  note.pinned
                    ? { color: accent, backgroundColor: `${accent}18` }
                    : undefined
                }
                className="grid size-[32px] place-items-center rounded-lg text-[#858491] transition hover:bg-[color-mix(in_srgb,var(--scribe-accent)_12%,transparent)] hover:text-[var(--scribe-accent)]"
                aria-label={note.pinned ? "Unpin note" : "Pin note"}
                onClick={onTogglePin}
              >
                <Pin size={16} fill={note.pinned ? "currentColor" : "none"} />
              </button>
            </Tooltip>
            <button
              style={{ backgroundColor: accent }}
              className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold text-white shadow-sm transition hover:brightness-105"
              onClick={() => onEdit("body")}
            >
              <Edit3 size={13} />
              Edit
            </button>
            <Tooltip label="Delete note" accent={accent} dark={dark}>
              <button
                className="grid size-[32px] place-items-center rounded-lg text-[#e45e68] transition hover:bg-[#ed526018]"
                aria-label="Delete note"
                onClick={onDelete}
              >
                <Trash2 size={16} />
              </button>
            </Tooltip>
          </>
        )}
      </div>

      <div className="mb-3 flex shrink-0 items-center gap-2 rounded-[11px] border border-[#e2dfe8] bg-[#f1eff5] px-2.5 py-2 dark:border-[#34333c] dark:bg-[#202026]">
        <span
          className="grid size-7 place-items-center rounded-[9px]"
          style={{ color: folderColor, backgroundColor: `${folderColor}18` }}
        >
          <FolderGlyph
            folder={folder ?? { icon: "folder", color: accent }}
            size={15}
          />
        </span>
        <span
          className="truncate text-[10px] font-medium"
          style={{ color: folderColor }}
        >
          {folder?.name ?? (note.folder || "Unfiled")}
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-[9px] text-[#706e7c] dark:text-[#92919f]">
          <CalendarDays size={12} />
          {note.updated}
        </span>
      </div>

      <div className="mb-3 shrink-0 rounded-[13px] border border-[#e2dfe8] bg-[#fdfcff] px-3.5 py-3 dark:border-[#34333c] dark:bg-[#202026]">
        {note.isDeleted ? (
          <div
            className="break-words font-semibold tracking-[-.45px]"
            style={{ fontSize: `${fontSize * 1.42}px`, lineHeight: 1.2, fontFamily }}
          >
            {note.title || "Untitled note"}
          </div>
        ) : (
          <button
            className="group block w-full rounded-md text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--scribe-accent)]"
            style={{
              color: "inherit",
              fontSize: `${fontSize * 1.42}px`,
              lineHeight: 1.2,
              fontFamily,
            }}
            onClick={() => onEdit("title")}
          >
            <span className="block break-words font-semibold tracking-[-.45px] transition-colors group-hover:text-[var(--scribe-accent)]">
              {note.title || "Untitled note"}
            </span>
            <span className="mt-2 flex items-center gap-1.5 text-[9px] font-normal text-[#706e7c] transition-colors group-hover:text-[var(--scribe-accent)] dark:text-[#92919f]">
              <Edit3 size={12} />
              Click to edit
            </span>
          </button>
        )}
        <div
          className="mt-2 h-px w-10 rounded-full"
          style={{ backgroundColor: accent }}
        />
      </div>

      <div
        role={note.isDeleted ? undefined : "button"}
        tabIndex={note.isDeleted ? undefined : 0}
        onClick={() => !note.isDeleted && onEdit("body")}
        onKeyDown={note.isDeleted ? undefined : editFromBody}
        className={`group min-h-0 flex-1 overflow-y-auto rounded-[13px] border border-[#e2dfe8] bg-[#f1eff5] p-3.5 ${note.isDeleted ? "" : "cursor-text text-left transition hover:border-[color-mix(in_srgb,var(--scribe-accent)_36%,transparent)] hover:bg-[color-mix(in_srgb,var(--scribe-accent)_5%,transparent)] focus-visible:border-[var(--scribe-accent)]"} dark:border-[#34333c] dark:bg-[#202026] dark:text-[#dedce9]`}
        style={{ fontSize, fontFamily }}
      >
        {!note.isDeleted && (
          <div className="mb-2 flex justify-end">
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md px-1.5 py-1 text-[9px] text-[#92919f] transition-colors hover:bg-black/[0.04] hover:text-[var(--scribe-accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--scribe-accent)] dark:hover:bg-white/[0.05]"
              onClick={(event) => {
                event.stopPropagation();
                onEdit("body");
              }}
            >
              <Edit3 size={12} />
              Click to edit
            </button>
          </div>
        )}
        {note.body ? (
          <MarkdownPreview markdown={note.body} />
        ) : (
          <p className="italic text-[#74727f] dark:text-[#9998a5]">
            This note is empty. Click here to start writing.
          </p>
        )}
      </div>
    </section>
  );
}
