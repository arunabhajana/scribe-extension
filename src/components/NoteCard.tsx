import { Pin, RotateCcw, Trash2 } from "lucide-react";
import type { Folder, Note } from "../types";
import { FolderGlyph } from "./FolderGlyph";
import { markdownToPlainText } from "../data/richTextDocument";
import { Tooltip } from "./Tooltip";
import { ContextMenu, type ContextMenuItem } from "./ContextMenu";

export function NoteCard({
  note,
  folder,
  active,
  accent,
  dark,
  onOpen,
  onTogglePin,
  onRestore,
  onDeletePermanently,
  contextItems,
}: {
  note: Note;
  folder?: Folder;
  active: boolean;
  accent: string;
  dark: boolean;
  onOpen: () => void;
  onTogglePin: () => void;
  onRestore: () => void;
  onDeletePermanently: () => void;
  contextItems: ContextMenuItem[];
}) {
  const preview = markdownToPlainText(note.body);
  return (
    <ContextMenu items={contextItems} accent={accent} dark={dark}>
    <article
      className={`group relative flex min-h-[71px] shrink-0 cursor-pointer items-start gap-[11px] rounded-xl border px-[11px] py-3 transition hover:-translate-y-px hover:border-[var(--note-hover-border)] hover:bg-[#f7f5fb] dark:hover:bg-[#25232d] ${active ? "dark:border-[#554d78]" : "border-[#e4e1ea] dark:border-[#34333c]"} bg-white dark:bg-[#212127]`}
      style={{
        borderColor: active ? `${accent}66` : undefined,
        ["--note-hover-border" as string]: `${accent}80`,
      }}
      onClick={onOpen}
    >
      <span
        className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-[9px]"
        style={{ backgroundColor: `${folder?.color ?? note.color}18` }}
      >
        <FolderGlyph
          folder={folder ?? { icon: "folder", color: note.color }}
          size={16}
        />
      </span>
      <div className="min-w-0 flex-1">
        <h2
          className={`mb-[3px] overflow-hidden text-ellipsis whitespace-nowrap text-xs font-semibold tracking-[-.15px] text-[#23232c] dark:text-[#f3f1f8] ${note.isDeleted ? "mr-14" : "mr-5"}`}
        >
          {note.title || "Untitled note"}
        </h2>
        <p className="mb-1 overflow-hidden text-ellipsis whitespace-nowrap text-[10.5px] leading-[1.35] text-[#696877] dark:text-[#b3b1c0]">
          {preview.slice(0, 58)}
          {preview.length > 58 ? "…" : ""}
        </p>
        <time className="text-[9.5px] text-[#706f7d] dark:text-[#9b9baa]">
          {note.isDraft ? "Draft · " : ""}
          {note.updated}
        </time>
      </div>
      {note.isDeleted ? (
        <div className="absolute right-[7px] top-[7px] flex items-center gap-0.5">
          <Tooltip label="Restore note" accent={accent} dark={dark}>
            <button
              className="grid size-7 place-items-center rounded-md text-[#39a978] transition hover:bg-[#39a97818]"
              aria-label="Restore note"
              onClick={(event) => {
                event.stopPropagation();
                onRestore();
              }}
            >
              <RotateCcw size={15} />
            </button>
          </Tooltip>
          <Tooltip label="Delete permanently" accent={accent} dark={dark}>
            <button
              className="grid size-7 place-items-center rounded-md text-[#e46d78] transition hover:bg-[#e46d7818]"
              aria-label="Delete permanently"
              onClick={(event) => {
                event.stopPropagation();
                onDeletePermanently();
              }}
            >
              <Trash2 size={15} />
            </button>
          </Tooltip>
        </div>
      ) : (
        <Tooltip
          label={note.pinned ? "Unpin note" : "Pin note"}
          accent={accent}
          dark={dark}
        >
          <button
            style={
              note.pinned
                ? { color: accent, backgroundColor: `${accent}16` }
                : undefined
            }
            className={`absolute right-[9px] top-[9px] grid size-[25px] place-items-center rounded-md transition-colors hover:bg-[#eeeaf8] dark:hover:bg-[#302d39] ${note.pinned ? "" : "text-[#777583] hover:text-[#5d5b68]"}`}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
            onClick={(event) => {
              event.stopPropagation();
              onTogglePin();
            }}
          >
            <Pin
              size={16}
              fill={note.pinned ? "currentColor" : "none"}
              strokeWidth={note.pinned ? 1.8 : 1.6}
            />
          </button>
        </Tooltip>
      )}
    </article>
    </ContextMenu>
  );
}
