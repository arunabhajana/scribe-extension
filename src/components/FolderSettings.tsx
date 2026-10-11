import { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  BriefcaseBusiness,
  Check,
  Code2,
  FilePenLine,
  Folder,
  Heart,
  Lightbulb,
  Music2,
  Plane,
  Plus,
  Star,
  Trash2,
  X,
} from "lucide-react";
import type { Folder as FolderType } from "../types";
import { folderColors, folderIcons } from "../data/folders";
import { FolderGlyph } from "./FolderGlyph";
import { Tooltip } from "./Tooltip";

const iconMap = {
  folder: Folder,
  briefcase: BriefcaseBusiness,
  book: BookOpen,
  lightbulb: Lightbulb,
  heart: Heart,
  code: Code2,
  star: Star,
  plane: Plane,
  music: Music2,
};
type Props = {
  folders: FolderType[];
  folderOrder: string[];
  dark: boolean;
  accent: string;
  onCreate: (folder: FolderType) => void;
  onUpdate: (id: string, folder: FolderType) => void;
  onDelete: (folder: FolderType) => void;
  onMove: (id: string, direction: -1 | 1) => void;
};

export function FolderSettings({
  folders,
  folderOrder,
  dark,
  accent,
  onCreate,
  onUpdate,
  onDelete,
  onMove,
}: Props) {
  const [editing, setEditing] = useState<FolderType | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("folder");
  const [color, setColor] = useState(folderColors[0].value);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState("");
  const muted = dark ? "text-[#a5a3ae]" : "text-[#777684]";
  const inputClass = `mt-1.5 h-9 w-full rounded-lg border px-2.5 text-[11px] outline-none focus:border-[var(--scribe-accent)] ${dark ? "border-[#3c3b44] bg-[#151519] text-[#f1f0f4]" : "border-[#e4e2e9] bg-[#fbfafc] text-[#20202a]"}`;

  function openCreate() {
    setEditing(null);
    setName("");
    setIcon("folder");
    setColor(folderColors[0].value);
    setError("");
    setDialogOpen(true);
  }
  function openEdit(folder: FolderType) {
    setEditing(folder);
    setName(folder.name);
    setIcon(folder.icon);
    setColor(folder.color);
    setError("");
    setDialogOpen(true);
  }
  function closeDialog() {
    setEditing(null);
    setDialogOpen(false);
    setError("");
  }
  function submit() {
    const cleanName = name.trim();
    if (!cleanName) {
      setError("Enter a folder name.");
      return;
    }
    if (
      folders.some(
        (folder) =>
          folder.id !== editing?.id &&
          folder.name.toLowerCase() === cleanName.toLowerCase(),
      )
    ) {
      setError("A folder with that name already exists.");
      return;
    }
    if (editing)
      onUpdate(editing.id, { ...editing, name: cleanName, icon, color });
    else
      onCreate({
        id: crypto.randomUUID(),
        name: cleanName,
        icon,
        color,
      });
    closeDialog();
  }

  return (
    <>
      <section className="relative mt-4 overflow-hidden rounded-[14px] border border-[#dedbe5] bg-[#fdfcff] dark:border-[#34333b] dark:bg-[#1d1d22]">
        <span
          aria-hidden="true"
          className="absolute bottom-0 left-0 top-0 w-[3px]"
          style={{ backgroundColor: accent }}
        />
        <div className="flex items-center justify-between px-3.5 py-3">
          <div>
            <h2 className="text-[12px] font-semibold">Your folders</h2>
            <p className={`mt-1 text-[9px] ${muted}`}>
              {folders.length} {folders.length === 1 ? "folder" : "folders"} ·
              Drafts and Trash can be rearranged too
            </p>
          </div>
          <button
            onClick={openCreate}
            className="flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[10px] font-semibold text-white transition hover:brightness-105"
            style={{ backgroundColor: accent }}
          >
            <Plus size={14} />
            New
          </button>
        </div>
        <div className="border-t border-[#e6e3eb] dark:border-[#35343b]">
          {folderOrder.map((key, index) => {
            const folder = key.startsWith("folder:")
              ? folders.find((item) => `folder:${item.id}` === key)
              : undefined;
            const isDrafts = key === "system:drafts";
            const label = folder?.name ?? (isDrafts ? "Drafts" : "Trash");
            const color = folder?.color ?? (isDrafts ? "#8970ed" : "#e46d78");
            return (
              <div
                key={key}
                className="relative flex min-h-[54px] items-center gap-2 border-b border-[#e8e5ed] px-3 py-2 last:border-0 dark:border-[#35343b]"
              >
                <span
                  className="grid size-8 shrink-0 place-items-center rounded-[10px]"
                  style={{ color, backgroundColor: `${color}18` }}
                >
                  {folder ? (
                    <FolderGlyph folder={folder} size={16} />
                  ) : isDrafts ? (
                    <FilePenLine size={16} />
                  ) : (
                    <Trash2 size={16} />
                  )}
                </span>
                <span className="min-w-0 flex-1 truncate text-[11px] font-medium">
                  {label}
                  <span className={`ml-1.5 text-[8px] font-normal ${muted}`}>
                    {folder ? "" : "System folder"}
                  </span>
                </span>
                <div className="flex shrink-0 items-center gap-0.5">
                  <button
                    aria-label={`Move ${label} up`}
                    disabled={index === 0}
                    onClick={() => onMove(key, -1)}
                    className="grid size-7 place-items-center rounded-md text-[#858491] transition hover:bg-[color-mix(in_srgb,var(--scribe-accent)_12%,transparent)] hover:text-[var(--scribe-accent)] disabled:opacity-30"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    aria-label={`Move ${label} down`}
                    disabled={index === folderOrder.length - 1}
                    onClick={() => onMove(key, 1)}
                    className="grid size-7 place-items-center rounded-md text-[#858491] transition hover:bg-[color-mix(in_srgb,var(--scribe-accent)_12%,transparent)] hover:text-[var(--scribe-accent)] disabled:opacity-30"
                  >
                    <ArrowDown size={14} />
                  </button>
                  {folder && (
                    <>
                      <button
                        aria-label={`Edit ${folder.name}`}
                        onClick={() => openEdit(folder)}
                        className="rounded-md px-2 py-1.5 text-[9px] font-medium text-[var(--scribe-accent)] transition hover:bg-[color-mix(in_srgb,var(--scribe-accent)_12%,transparent)]"
                      >
                        Edit
                      </button>
                      <button
                        aria-label={`Delete ${folder.name}`}
                        onClick={() => setConfirmDelete(folder.id)}
                        className="grid size-7 place-items-center rounded-md text-[#92919f] transition hover:bg-[#ed526018] hover:text-[#ed5260]"
                      >
                        <Trash2 size={13} />
                      </button>
                    </>
                  )}
                </div>
                {folder && confirmDelete === folder.id && (
                  <div className="absolute inset-x-6 top-1/2 z-10 -translate-y-1/2 rounded-xl border border-[#e8e6ef] bg-white p-3 shadow-xl dark:border-[#393841] dark:bg-[#242329]">
                    <p className="text-[11px] font-semibold">
                      Delete “{folder.name}”?
                    </p>
                    <p className={`mt-1 text-[9px] ${muted}`}>
                      Notes in it will become unfiled.
                    </p>
                    <div className="mt-3 flex justify-end gap-2">
                      <button
                        className="rounded-md px-2.5 py-1.5 text-[9px] text-[#858491]"
                        onClick={() => setConfirmDelete(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="rounded-md bg-[#ed5260] px-2.5 py-1.5 text-[9px] font-semibold text-white"
                        onClick={() => {
                          onDelete(folder);
                          setConfirmDelete(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className={`px-3.5 py-2.5 text-[9px] ${muted}`}>
          Changes update your note filters immediately.
        </p>
      </section>

      {dialogOpen && (
        <div
          className="absolute inset-0 z-30 grid place-items-center bg-black/45 p-4"
          onMouseDown={(event) =>
            event.target === event.currentTarget && closeDialog()
          }
        >
          <div
          className={`w-full max-w-[340px] rounded-2xl border p-4 shadow-2xl ${dark ? "border-[#34343b] bg-[#19191d] text-[#f1f0f4]" : "border-[#dedbe5] bg-[#fdfcff] text-[#20202a]"}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[13px] font-semibold">
                  {editing ? "Edit folder" : "Create a folder"}
                </h2>
                <p className={`mt-1 text-[9px] ${muted}`}>
                  Choose a name, icon, and color.
                </p>
              </div>
              <button
                aria-label="Close dialog"
                className={`rounded-md p-1 ${dark ? "text-[#aaa8b3] hover:bg-white/10" : "text-[#858491] hover:bg-black/5"}`}
                onClick={closeDialog}
              >
                <X size={15} />
              </button>
            </div>
            <label className={`mt-4 block text-[9px] ${muted}`}>
              Folder name
              <input
                autoFocus
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setError("");
                }}
                onKeyDown={(event) => event.key === "Enter" && submit()}
                placeholder="e.g. Projects"
                className={inputClass}
              />
            </label>
            <p
              className={`mb-1.5 mt-3 text-[8px] font-semibold tracking-[.7px] ${muted}`}
            >
              ICON
            </p>
            <div
              className={`flex flex-wrap gap-1 rounded-lg border p-1.5 ${dark ? "border-[#34343b] bg-[#202025]" : "border-[#eceaf0] bg-[#faf9fc]"}`}
            >
              {folderIcons.map((id) => {
                const Icon = iconMap[id as keyof typeof iconMap];
                return (
                  <Tooltip key={id} label={id} accent={accent} dark={dark}>
                    <button
                      aria-label={`Choose ${id} icon`}
                      className="grid size-7 place-items-center rounded-md transition"
                      style={{
                        color: icon === id ? color : undefined,
                        backgroundColor: icon === id ? `${color}20` : undefined,
                      }}
                      onClick={() => setIcon(id)}
                    >
                      <Icon size={15} />
                    </button>
                  </Tooltip>
                );
              })}
            </div>
            <p
              className={`mb-2 mt-3 text-[8px] font-semibold tracking-[.7px] ${muted}`}
            >
              COLOR
            </p>
            <div className="flex gap-2">
              {folderColors.map((item) => (
                <Tooltip
                  key={item.value}
                  label={item.name}
                  accent={accent}
                  dark={dark}
                >
                  <button
                    aria-label={`Choose ${item.name} color`}
                    className={`grid size-6 place-items-center rounded-full transition ${color === item.value ? "ring-2 ring-offset-2 dark:ring-offset-[#19191d]" : ""}`}
                    style={
                      {
                        backgroundColor: item.value,
                        ["--tw-ring-color" as string]: item.value,
                      } as React.CSSProperties
                    }
                    onClick={() => setColor(item.value)}
                  >
                    {color === item.value && (
                      <Check size={13} className="text-white" />
                    )}
                  </button>
                </Tooltip>
              ))}
            </div>
            {error && <p className="mt-2 text-[9px] text-[#ed5260]">{error}</p>}
            <div className="mt-4 flex justify-end gap-2">
              <button
                className={`rounded-lg border px-3 py-2 text-[9px] ${dark ? "border-[#3b3944] text-[#bbb9c4]" : "border-[#e5e3eb] text-[#777684]"}`}
                onClick={closeDialog}
              >
                Cancel
              </button>
              <button
                className="rounded-lg px-3 py-2 text-[9px] font-semibold text-white transition hover:brightness-105"
                style={{ backgroundColor: accent }}
                onClick={submit}
              >
                {editing ? "Save changes" : "Create folder"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
