import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Image,
  Italic,
  Link,
  List,
  ListOrdered,
  Pin,
  Trash2,
  Bold,
} from "lucide-react";
import type { Folder as FolderType, Note } from "../types";
import { Tooltip } from "./Tooltip";
import { FolderGlyph } from "./FolderGlyph";

type Props = {
  note: Note | undefined;
  folders: FolderType[];
  saved: boolean;
  accent: string;
  dark: boolean;
  focusField: "title" | "body";
  fontSize: number;
  fontFamily: string;
  onBack: () => void;
  onDiscard: () => void;
  onDelete: () => void;
  onUpdate: (field: "title" | "body" | "folder", value: string) => void;
  onSave: () => void;
  onTogglePin: () => void;
};

export function NoteEditor({
  note,
  folders,
  saved,
  accent,
  dark,
  focusField,
  fontSize,
  fontFamily,
  onBack,
  onDiscard,
  onDelete,
  onUpdate,
  onSave,
  onTogglePin,
}: Props) {
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const folderMenuRef = useRef<HTMLDivElement>(null);
  const [folderOpen, setFolderOpen] = useState(false);
  const noteFolder = folders.find((folder) => folder.name === note?.folder);
  useEffect(() => {
    if (focusField === "title") titleRef.current?.focus();
    else bodyRef.current?.focus();
  }, [note?.id, focusField]);
  useEffect(() => {
    if (!folderOpen) return;
    function closeFolderMenu(event: MouseEvent) {
      if (
        folderMenuRef.current &&
        !folderMenuRef.current.contains(event.target as Node)
      )
        setFolderOpen(false);
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setFolderOpen(false);
    }
    document.addEventListener("mousedown", closeFolderMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeFolderMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [folderOpen]);
  return (
    <section
      style={{ "--editor-accent": accent } as React.CSSProperties}
      className="flex min-h-0 flex-1 flex-col pt-2"
    >
      <div className="mb-3 flex h-[43px] shrink-0 items-center gap-2.5 text-[15px] font-semibold tracking-[-.2px]">
        <button
          className="-ml-1.5 grid size-8 place-items-center rounded-lg text-[#494957] hover:bg-[#f5f4fa] dark:text-[#ebe9f5]"
          aria-label="Back to notes"
          onClick={onBack}
        >
          <ArrowLeft size={20} />
        </button>
        <span>
          {note?.isNew
            ? "Add note"
            : note?.isDraft
              ? "Edit draft"
              : "Edit note"}
        </span>
        <div className="flex-1" />
        <button
          className="grid size-[34px] place-items-center rounded-[10px] text-[#ed5260] hover:bg-[#fff0f1] dark:hover:bg-[#3a252a]"
          aria-label="Move note to Trash"
          onClick={onDelete}
        >
          <Trash2 size={19} />
        </button>
      </div>
      <input
        ref={titleRef}
        style={{ fontSize: fontSize + 1, fontFamily }}
        className="h-12 shrink-0 rounded-[11px] border border-[#e5e3ed] bg-transparent px-3 font-medium tracking-[-.35px] outline-none transition focus:border-[var(--editor-accent)] focus:shadow-[0_0_0_3px_color-mix(in_srgb,var(--editor-accent)_16%,transparent)] dark:border-[#3b3944]"
        aria-label="Note title"
        value={note?.title ?? ""}
        onChange={(event) => onUpdate("title", event.target.value)}
        placeholder="Note title"
      />
      <div className="my-[11px] flex items-center justify-between">
        <div className="relative" ref={folderMenuRef}>
          <button
            type="button"
            aria-label={`Folder: ${noteFolder?.name ?? (note?.folder || "Unfiled")}`}
            aria-haspopup="listbox"
            aria-expanded={folderOpen}
            style={{
              color: noteFolder?.color ?? accent,
              borderColor: folderOpen ? `${accent}80` : undefined,
              boxShadow: folderOpen ? `0 0 0 2px ${accent}20` : undefined,
            }}
            className="flex h-[36px] max-w-[245px] items-center gap-2 rounded-[10px] border border-[#e7e5ee] px-2.5 text-left transition-colors hover:bg-[color-mix(in_srgb,var(--editor-accent)_7%,transparent)] dark:border-[#3b3944]"
            onClick={() => setFolderOpen((open) => !open)}
          >
            <FolderGlyph
              folder={noteFolder ?? { icon: "folder", color: accent }}
              size={18}
            />
            <span className="max-w-[150px] truncate text-[11px] font-medium text-[#4c4c5b] dark:text-[#e3e0ef]">
              {noteFolder?.name ?? (note?.folder || "Unfiled")}
            </span>
            <ChevronDown
              size={14}
              className={`shrink-0 transition-transform ${folderOpen ? "rotate-180" : ""}`}
            />
          </button>
          {folderOpen && (
            <div
              role="listbox"
              aria-label="Choose note folder"
              className="absolute left-0 top-[42px] z-30 max-h-[230px] min-w-[190px] overflow-y-auto rounded-xl border border-[#e7e5ed] bg-white p-1.5 shadow-[0_12px_30px_#28263c24] animate-[toastIn_.14s_ease-out] dark:border-[#393841] dark:bg-[#242329]"
            >
              <button
                role="option"
                aria-selected={!note?.folder}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-[#686776] transition hover:bg-[#f6f4fb] dark:text-[#d2cfdb] dark:hover:bg-[#302e36]"
                onClick={() => {
                  onUpdate("folder", "");
                  setFolderOpen(false);
                }}
              >
                <span className="grid size-7 place-items-center rounded-lg bg-[#f0eff4] text-[#92919f] dark:bg-[#33313a]">
                  <FolderGlyph
                    folder={{ icon: "folder", color: "#92919f" }}
                    size={15}
                  />
                </span>
                <span className="flex-1">Unfiled</span>
                {!note?.folder && <Check size={14} style={{ color: accent }} />}
              </button>
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  role="option"
                  aria-selected={note?.folder === folder.name}
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-[#454451] transition hover:bg-[#f6f4fb] dark:text-[#e4e1eb] dark:hover:bg-[#302e36]"
                  onClick={() => {
                    onUpdate("folder", folder.name);
                    setFolderOpen(false);
                  }}
                >
                  <span
                    className="grid size-7 place-items-center rounded-lg"
                    style={{
                      color: folder.color,
                      backgroundColor: `${folder.color}18`,
                    }}
                  >
                    <FolderGlyph folder={folder} size={15} />
                  </span>
                  <span className="flex-1 truncate">{folder.name}</span>
                  {note?.folder === folder.name && (
                    <Check size={14} style={{ color: accent }} />
                  )}
                </button>
              ))}
              {note?.folder && !noteFolder && (
                <button
                  role="option"
                  aria-selected
                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-[11px] text-[#92919f] dark:text-[#aaa8b7]"
                >
                  <FolderGlyph
                    folder={{ icon: "folder", color: "#92919f" }}
                    size={15}
                  />
                  <span className="truncate">{note.folder} (unavailable)</span>
                </button>
              )}
            </div>
          )}
        </div>
        <button
          style={
            note?.pinned
              ? {
                  color: accent,
                  backgroundColor: `${accent}20`,
                  borderColor: `${accent}60`,
                }
              : undefined
          }
          className="grid size-[34px] place-items-center rounded-[10px] border border-[#e9e7f0] text-[#5d6070] transition-colors hover:bg-[color-mix(in_srgb,var(--editor-accent)_12%,transparent)] hover:text-[var(--editor-accent)] dark:border-[#3b3944] dark:text-[#aaa8b7]"
          aria-label={note?.pinned ? "Unpin note" : "Pin note"}
          onClick={onTogglePin}
        >
          <Pin size={18} />
        </button>
      </div>
      <div className="flex min-h-[42px] shrink-0 items-center gap-[3px] rounded-t-[10px] border border-[#e9e7ef] px-[9px] dark:border-[#3b3944]">
        {[
          [Bold, "Bold"],
          [Italic, "Italic"],
          [List, "Bulleted list"],
          [ListOrdered, "Numbered list"],
          [Link, "Add link"],
          [Image, "Add image"],
        ].map(([Icon, label]) => {
          const ToolIcon = Icon as typeof Bold;
          const toolLabel = label as string;
          return (
            <Tooltip
              key={toolLabel}
              label={toolLabel}
              accent={accent}
              dark={dark}
            >
              <button
                aria-label={toolLabel}
                className="grid size-[31px] place-items-center rounded-md text-[#484856] transition-colors hover:bg-[color-mix(in_srgb,var(--editor-accent)_12%,transparent)] hover:text-[var(--editor-accent)] dark:text-[#dddbe7]"
                onClick={() =>
                  onUpdate(
                    "body",
                    `${note?.body ?? ""}${toolLabel === "Bulleted list" ? "\n• " : toolLabel === "Numbered list" ? "\n1. " : toolLabel === "Add link" ? " [link](https://)" : toolLabel === "Add image" ? "\n[Image]" : toolLabel === "Bold" ? " **bold text**" : " *italic text*"}`,
                  )
                }
              >
                <ToolIcon size={17} />
              </button>
            </Tooltip>
          );
        })}
      </div>
      <textarea
        ref={bodyRef}
        style={{ fontSize, fontFamily }}
        className="min-h-[100px] flex-1 resize-none rounded-b-[10px] border border-t-0 border-[#e9e7ef] bg-transparent p-[13px] leading-[1.8] text-[#464655] outline-none transition focus:border-[var(--editor-accent)] focus:shadow-[inset_0_0_0_1px_var(--editor-accent)] dark:border-[#3b3944] dark:text-[#dedce9]"
        aria-label="Note content"
        value={note?.body ?? ""}
        onChange={(event) => onUpdate("body", event.target.value)}
        placeholder="Start writing…"
      />
      <div className="flex shrink-0 items-center justify-between gap-2 pt-3">
        <span
          className={`flex min-w-0 items-center gap-[7px] text-[10px] ${saved ? "text-[#73758b]" : "text-[#c18a3b]"}`}
        >
          <Check className={saved ? "text-[#37b883]" : ""} size={17} />
          {saved ? "Saved locally" : "Unsaved changes"}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          {note?.isDraft && (
            <button
              className="h-[39px] rounded-[10px] border border-[#edcbd0] px-3 text-[10px] font-semibold text-[#bd5c68] transition hover:bg-[#fff2f3] dark:border-[#54383e] dark:hover:bg-[#38242a]"
              onClick={onDiscard}
            >
              Discard
            </button>
          )}
          <button
            style={{
              backgroundColor: accent,
              boxShadow: `0 4px 12px ${accent}38`,
            }}
            className="h-[39px] min-w-[86px] rounded-[10px] px-[18px] text-xs font-semibold text-white transition hover:-translate-y-px hover:brightness-105"
            onClick={onSave}
          >
            {note?.isNew ? "Add note" : "Save"}
          </button>
        </div>
      </div>
    </section>
  );
}
