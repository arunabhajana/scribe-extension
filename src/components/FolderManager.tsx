import { useState } from "react";
import {
  BookOpen,
  BriefcaseBusiness,
  Check,
  Code2,
  Folder,
  Heart,
  Lightbulb,
  Music2,
  Plane,
  Star,
  X,
} from "lucide-react";
import type { Folder as FolderType } from "../types";
import { folderColors, folderIcons } from "../data/folders";
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

export function FolderManager({
  folders,
  onCreate,
  dark,
  accent,
}: {
  folders: FolderType[];
  onCreate: (folder: FolderType) => void;
  dark: boolean;
  accent: string;
}) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("folder");
  const [color, setColor] = useState(folderColors[0].value);
  function submit() {
    const cleanName = name.trim();
    if (
      !cleanName ||
      folders.some(
        (folder) => folder.name.toLowerCase() === cleanName.toLowerCase(),
      )
    )
      return;
    onCreate({
      id: crypto.randomUUID(),
      name: cleanName,
      icon,
      color,
    });
    setName("");
    setDialogOpen(false);
  }
  return (
    <>
      <button
        id="folder-create-trigger"
        className="hidden"
        aria-label="Open create folder dialog"
        onClick={() => setDialogOpen(true)}
      />
      {dialogOpen && (
        <div
          className={`absolute inset-0 z-30 grid place-items-center p-4 ${dark ? "bg-black/65" : "bg-[#1b1930]/30"}`}
          onMouseDown={(event) =>
            event.target === event.currentTarget && setDialogOpen(false)
          }
        >
          <div
            className={`w-full max-w-[340px] rounded-2xl border p-5 shadow-2xl ${dark ? "border-[#34343b] bg-[#19191d] text-[#f1f0f4]" : "border-[#e8e6ee] bg-white text-[#20202a]"}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-sm font-semibold">Create a folder</h2>
                <p
                  className={`mt-1 text-[10px] ${dark ? "text-[#a5a3ae]" : "text-[#777684]"}`}
                >
                  Keep related notes together.
                </p>
              </div>
              <button
                aria-label="Close dialog"
                className={`rounded-md p-1 ${dark ? "text-[#aaa8b3] hover:bg-white/10" : "text-[#858491] hover:bg-black/5"}`}
                onClick={() => setDialogOpen(false)}
              >
                <X size={16} />
              </button>
            </div>
            <label
              className={`mt-5 block text-[10px] ${dark ? "text-[#aaa8b3]" : "text-[#666572]"}`}
            >
              Folder name
              <input
                autoFocus
                value={name}
                onChange={(event) => setName(event.target.value)}
                onKeyDown={(event) => event.key === "Enter" && submit()}
                placeholder="e.g. Projects"
                className={`mt-2 h-[38px] w-full rounded-lg border px-2.5 text-xs outline-none focus:border-[var(--scribe-accent)] ${dark ? "border-[#3c3b44] bg-[#101012] text-[#f1f0f4] placeholder:text-[#666570]" : "border-[#e4e2e9] bg-[#fbfafc] text-[#20202a] placeholder:text-[#9a99a5]"}`}
              />
            </label>
            <div
              className={`my-4 border-t ${dark ? "border-[#35343c]" : "border-[#eeedf2]"}`}
            />
            <p className="text-[10px] font-semibold">Make it yours</p>
            <p
              className={`mt-1 text-[9px] ${dark ? "text-[#a5a3ae]" : "text-[#777684]"}`}
            >
              Choose an icon and color
            </p>
            <div
              className={`mt-3 flex flex-wrap gap-1.5 rounded-lg border p-2 ${dark ? "border-[#34343b] bg-[#202025]" : "border-[#eceaf0] bg-[#faf9fc]"}`}
            >
              {folderIcons.map((id) => {
                const Icon = iconMap[id as keyof typeof iconMap];
                return (
                  <Tooltip key={id} label={id} accent={accent} dark={dark}>
                    <button
                      aria-label={`Choose ${id} icon`}
                      className="grid size-[31px] place-items-center rounded-lg border transition"
                      style={{
                        borderColor:
                          icon === id ? `${accent}99` : "transparent",
                        backgroundColor:
                          icon === id ? `${accent}1b` : undefined,
                        color: icon === id ? accent : undefined,
                      }}
                      onClick={() => setIcon(id)}
                    >
                      <Icon size={16} />
                    </button>
                  </Tooltip>
                );
              })}
            </div>
            <p
              className={`mb-2 mt-4 text-[9px] font-semibold tracking-[.8px] ${dark ? "text-[#a5a3ae]" : "text-[#777684]"}`}
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
                        ["--tw-ring-color" as string]: accent,
                      } as React.CSSProperties
                    }
                    onClick={() => setColor(item.value)}
                  >
                    {color === item.value && (
                      <Check size={14} className="text-white" />
                    )}
                  </button>
                </Tooltip>
              ))}
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button
                className={`rounded-lg border px-3 py-2 text-[10px] ${dark ? "border-[#3b3944] text-[#bbb9c4] hover:bg-white/5" : "border-[#e5e3eb] text-[#777684] hover:bg-black/5"}`}
                onClick={() => setDialogOpen(false)}
              >
                Cancel
              </button>
              <button
                disabled={
                  !name.trim() ||
                  folders.some(
                    (folder) =>
                      folder.name.toLowerCase() === name.trim().toLowerCase(),
                  )
                }
                style={{ backgroundColor: accent }}
                className="rounded-lg px-3 py-2 text-[10px] font-semibold text-white transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-45"
                onClick={submit}
              >
                Create folder
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
