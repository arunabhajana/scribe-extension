import { useState } from "react";
import {
  ArrowLeft,
  Camera,
  ChevronRight,
  FolderOpen,
  LockKeyhole,
  Monitor,
  Moon,
  Palette,
  Search,
  Sun,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import type { Folder, Screen } from "../types";
import { FolderSettings } from "./FolderSettings";
import { noteFontFamilies, noteFontSizes, type NoteFontFamily, type NoteFontSize } from "../data/noteFontSizes";

type Props = {
  dark: boolean;
  accent: string;
  folders: Folder[];
  folderOrder: string[];
  noteFontSize: NoteFontSize;
  onNoteFontSizeChange: (size: NoteFontSize) => void;
  noteFontFamily: NoteFontFamily;
  onNoteFontFamilyChange: (family: NoteFontFamily) => void;
  onCreateFolder: (folder: Folder) => void;
  onUpdateFolder: (id: string, folder: Folder) => void;
  onDeleteFolder: (folder: Folder) => void;
  onMoveFolder: (id: string, direction: -1 | 1) => void;
  onAccentChange: (color: string) => void;
  onThemeToggle: () => void;
  onNavigate: (screen: Screen) => void;
  onOpenApp: () => void;
  onClearNotes: () => void;
  onMessage: (message: string) => void;
  name: string;
  email: string;
  setName: (name: string) => void;
  avatar: string;
  setAvatar: (avatar: string) => void;
};
const categories = [
  {
    id: "account",
    label: "Account",
    icon: UserRound,
    color: "#f05a9d",
  },
  {
    id: "appearance",
    label: "Appearance",
    icon: Palette,
    color: "#a578ff",
  },
  {
    id: "folders",
    label: "Folders",
    icon: FolderOpen,
    color: "#f6a623",
  },
  {
    id: "general",
    label: "General",
    icon: Monitor,
    color: "#4d9aff",
  },
];

export function SettingsView({
  dark,
  accent,
  folders,
  folderOrder,
  noteFontSize,
  onNoteFontSizeChange,
  noteFontFamily,
  onNoteFontFamilyChange,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
  onMoveFolder,
  onAccentChange,
  onThemeToggle,
  onNavigate,
  onOpenApp,
  onClearNotes,
  onMessage,
  name,
  email,
  setName,
  avatar,
  setAvatar,
}: Props) {
  const [active, setActive] = useState("account");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const current =
    categories.find((category) => category.id === active) ?? categories[0];
  const Icon = current.icon;
  const settingsMatches = [
    {
      label: "Theme",
      detail: "Switch between light and dark theme",
      category: "appearance",
    },
    {
      label: "Accent color",
      detail: "Change the extension accent color",
      category: "appearance",
    },
    {
      label: "Typography",
      detail: "Choose a font family and text size for notes",
      category: "appearance",
    },
    {
      label: "Open Scribe App",
      detail: "Open the full notes experience",
      category: "general",
    },
    {
      label: "Folders",
      detail: "Create and browse folders",
      category: "folders",
    },
    {
      label: "Manage folders",
      detail: "Create edit rearrange or delete folders",
      category: "folders",
    },
    {
      label: "Search notes",
      detail: "Find a note by its title or content",
      category: "general",
    },
    {
      label: "Default folder",
      detail: "Choose where new notes are created",
      category: "general",
    },
    {
      label: "Pinned notes",
      detail: "Filter pinned notes",
      category: "general",
    },
    {
      label: "Clear notes",
      detail: "Remove notes from local preview",
      category: "general",
    },
    {
      label: "Display name",
      detail: "Update your profile name",
      category: "account",
    },
    {
      label: "Avatar color",
      detail: "Choose your profile color",
      category: "account",
    },
    {
      label: "Password reset",
      detail: "Reset account password",
      category: "account",
    },
    {
      label: "Signed-in devices",
      detail: "Manage account sessions",
      category: "account",
    },
  ].filter((item) =>
    `${item.label} ${item.detail}`.toLowerCase().includes(search.toLowerCase()),
  );
  function chooseSearchResult(category: string) {
    setActive(category);
    setSearch("");
    setSearchOpen(false);
  }
  return (
    <div className="-mx-[19px] -mb-2 flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center gap-2.5 px-[19px] pb-3 pt-5">
        <button
          className="grid size-8 place-items-center rounded-lg text-[var(--scribe-accent)] transition hover:bg-[color-mix(in_srgb,var(--scribe-accent)_12%,transparent)] hover:-translate-x-0.5"
          aria-label="Back to notes"
          onClick={() => onNavigate("notes")}
        >
          <ArrowLeft size={18} />
        </button>
        <span className="text-[15px] font-semibold tracking-[-.2px]">
          Settings
        </span>
      </div>
      <div className="flex shrink-0 items-center justify-between gap-1 px-[19px] py-2.5">
        {categories.map((category) => {
          const CategoryIcon = category.icon;
          const selected = active === category.id;
          return (
            <button
              key={category.id}
              className={`flex h-[36px] min-w-0 items-center justify-center gap-1.5 rounded-[10px] border px-2 text-[10px] transition duration-200 hover:-translate-y-px ${selected ? "font-semibold shadow-sm" : "font-medium"}`}
              style={{
                color: category.color,
                backgroundColor: dark
                  ? `${category.color}${selected ? "30" : "16"}`
                  : `${category.color}${selected ? "22" : "12"}`,
                borderColor: `${category.color}${selected ? "65" : "25"}`,
              }}
              onClick={() => setActive(category.id)}
            >
              <CategoryIcon size={14} />
              {category.label}
            </button>
          );
        })}
      </div>
      <section className="min-h-0 flex-1 overflow-y-auto px-[19px] py-4 [scrollbar-width:thin]">
        <div
          className="mb-3 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.7px]"
          style={{ color: current.color }}
        >
          <Icon size={15} />
          {current.label}
        </div>
        {active === "general" && (
          <>
            <h1 className="text-[18px] font-bold tracking-[-.45px]">General</h1>
            <p className="mt-1 text-[10px] text-[#6f6d7b]">
              Quick access and note preferences.
            </p>
            <SettingsCard
              title="Quick access"
              subtitle="Open the full Scribe notes experience."
              accent={current.color}
            >
              <SettingRow
                title="Open Scribe App"
                subtitle="Continue in the full notes experience"
                action="Open"
                onClick={onOpenApp}
              />
            </SettingsCard>
            <SettingsCard
              title="Note behavior"
              subtitle="A few useful controls for your notes."
              accent={current.color}
            >
              <SettingRow
                title="Default folder"
                subtitle="New notes use the selected folder, or Work by default"
                action="Work"
                onClick={() =>
                  onMessage(
                    "New notes use the selected folder, or Work by default.",
                  )
                }
              />
              <SettingRow
                title="Pinned notes"
                subtitle="Pin notes from their cards and use the pin filter"
                action="Ready"
                onClick={() =>
                  onMessage(
                    "Pinned notes are available from the pin filter on Notes.",
                  )
                }
              />
            </SettingsCard>
            <button
              className="mt-4 flex w-full items-center justify-between rounded-xl border border-[#f0dfe0] px-3 py-3 text-left transition hover:bg-[#fff8f8] dark:border-[#493337] dark:hover:bg-[#2a2024]"
              onClick={onClearNotes}
            >
              <span>
                <strong className="block text-[11px] font-semibold text-[#b45c65]">
                  Clear notes
                </strong>
                <span className="mt-1 block text-[9px] text-[#6f6d7b]">
                  Remove all notes from this device
                </span>
              </span>
              <Trash2 size={16} className="text-[#b45c65]" />
            </button>
          </>
        )}
        {active === "folders" && (
          <>
            <h1 className="text-[18px] font-bold tracking-[-.45px]">
              Manage folders
            </h1>
            <p className="mt-1 text-[10px] text-[#6f6d7b]">
              Organize your notes from this compact folder list.
            </p>
            <FolderSettings
              folders={folders}
              folderOrder={folderOrder}
              dark={dark}
              accent={current.color}
              onCreate={onCreateFolder}
              onUpdate={onUpdateFolder}
              onDelete={onDeleteFolder}
              onMove={onMoveFolder}
            />
          </>
        )}
        {active === "appearance" && (
          <>
            <h1 className="text-[18px] font-bold tracking-[-.45px]">
              Appearance
            </h1>
            <p className="mt-1 text-[10px] text-[#6f6d7b]">
              Choose a comfortable popup theme.
            </p>
            <SettingsCard
              title="Theme"
              subtitle="This changes the entire extension popup."
              accent={current.color}
            >
              <button
                className="flex min-h-[58px] w-full items-center gap-2.5 py-2 text-left"
                onClick={onThemeToggle}
              >
                <span
                  className="grid size-8 place-items-center rounded-lg"
                  style={{ color: accent, backgroundColor: `${accent}18` }}
                >
                  {dark ? <Moon size={17} /> : <Sun size={17} />}
                </span>
                <span className="min-w-0 flex-1">
                  <strong className="block text-[10px] font-semibold">
                    {dark ? "Dark theme" : "Light theme"}
                  </strong>
                  <span className="mt-1 block text-[9px] text-[#6f6d7b]">
                    Click to switch to {dark ? "light" : "dark"}
                  </span>
                </span>
                <span
                  className={`relative h-[19px] w-[34px] rounded-full p-[2px] transition ${dark ? "bg-[var(--scribe-accent)]" : "bg-[#d8d7df]"}`}
                >
                  <i
                    className={`block size-[15px] rounded-full bg-white shadow-sm transition-transform ${dark ? "translate-x-[15px]" : ""}`}
                  />
                </span>
              </button>
              <div className="border-t border-[#e6e3eb] py-3 dark:border-[#35343b]">
                <p className="mb-2 text-[10px] font-semibold">Accent color</p>
                <p className="mb-3 text-[9px] text-[#6f6d7b]">
                  Used for selection, buttons, and highlights.
                </p>
                <div className="flex gap-2">
                  {[
                    "#8970ed",
                    "#379be9",
                    "#22b893",
                    "#e7a642",
                    "#df69a2",
                    "#20bfcc",
                  ].map((color) => (
                    <button
                      key={color}
                      className={`size-6 rounded-full transition hover:scale-110 ${accent === color ? "ring-2 ring-offset-2 dark:ring-offset-[#1d1d22]" : ""}`}
                      style={
                        {
                          backgroundColor: color,
                          ["--tw-ring-color" as string]: color,
                        } as React.CSSProperties
                      }
                      aria-label={`Set accent color ${color}`}
                      onClick={() => onAccentChange(color)}
                    />
                  ))}
                </div>
              </div>
            </SettingsCard>
            <SettingsCard
              title="Typography"
              subtitle="Choose a comfortable typeface and size for your notes."
              accent={current.color}
            >
              <div className="divide-y divide-[#e8e5ed] py-1 dark:divide-[#35343b]">
                <TypographySelect
                  label="Font family"
                  detail="Choose the voice of your notes."
                  value={noteFontFamily}
                  options={noteFontFamilies}
                  dark={dark}
                  accent={current.color}
                  onChange={(value) => onNoteFontFamilyChange(value as NoteFontFamily)}
                />
                <TypographySelect
                  label="Text size"
                  detail="Adjust reading and editor text."
                  value={noteFontSize}
                  options={noteFontSizes.map((option) => option.label)}
                  dark={dark}
                  accent={current.color}
                  onChange={(value) => onNoteFontSizeChange(value as NoteFontSize)}
                />
              </div>
            </SettingsCard>
          </>
        )}
        {active === "account" && (
          <>
            <h1 className="text-[18px] font-bold tracking-[-.45px]">
              Your account
            </h1>
            <p className="mt-1 text-[10px] text-[#6f6d7b]">
              Manage the profile shown in your extension.
            </p>
            <SettingsCard
              title="Profile"
              subtitle={email || "Signed-in account profile"}
              accent={current.color}
            >
              <div className="flex items-center gap-3 py-3">
                <span
                  className="relative grid size-12 shrink-0 place-items-center rounded-2xl text-lg font-bold text-white"
                  style={{
                    backgroundColor: avatar.startsWith("#")
                      ? avatar
                      : accent,
                  }}
                >
                  {name.trim().charAt(0).toUpperCase() || "A"}
                  <Camera
                    className="absolute -bottom-1 -right-1 rounded-full bg-white p-1 shadow dark:bg-[#282730]"
                    style={{ color: accent }}
                    size={18}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-[9px] font-semibold text-[#686674]">Display name</label>
                  <input
                    value={name}
                    maxLength={40}
                    onChange={(event) => setName(event.target.value)}
                    className="h-9 w-full rounded-lg border border-[#e7e5ed] bg-transparent px-2.5 text-[11px] outline-none focus:border-[var(--scribe-accent)] dark:border-[#3a3941]"
                    placeholder="Your name"
                  />
                </div>
              </div>
              <p className="pb-2 text-[9px] text-[#6f6d7b]">{email || "Email unavailable"}</p>
              <div className="border-t border-[#e6e3eb] py-2.5 dark:border-[#35343b]">
                <p className="mb-2 text-[9px] font-semibold text-[#686674]">
                  Avatar color
                </p>
                <div className="flex gap-2">
                  {[
                    "#8970ed",
                    "#379be9",
                    "#22b893",
                    "#e7a642",
                    "#df69a2",
                    "#20bfcc",
                  ].map((color) => (
                    <button
                      key={color}
                      className={`size-6 rounded-full transition hover:scale-110 ${avatar === color ? "ring-2 ring-offset-2 dark:ring-offset-[#1d1d22]" : ""}`}
                      style={{
                        backgroundColor: color,
                        ["--tw-ring-color" as string]: accent,
                      }}
                      aria-label="Choose avatar color"
                      onClick={() => setAvatar(color)}
                    />
                  ))}
                </div>
              </div>
            </SettingsCard>
            <SettingsCard
              title="Password & security"
              subtitle="Account security controls need sign-in to be connected."
              accent={current.color}
            >
              <SettingRow
                title="Password reset"
                subtitle="Request a reset link for your account"
                action="Not connected"
                icon={LockKeyhole}
                onClick={() =>
                  onMessage(
                    "Password reset will be available after account sign-in is connected.",
                  )
                }
              />
              <SettingRow
                title="Signed-in devices"
                subtitle="Review and manage your active sessions"
                action="Not connected"
                icon={LockKeyhole}
                onClick={() =>
                  onMessage(
                    "Device management will be available after account sign-in is connected.",
                  )
                }
              />
            </SettingsCard>
          </>
        )}
      </section>
      <div className="relative shrink-0 border-t border-[#e5e2eb] px-[19px] pb-2 pt-2 dark:border-[#33323a]">
        <div
          className={`relative flex h-[38px] items-center rounded-[10px] border bg-[#f1eff5] transition-all duration-200 ${searchOpen ? "border-[var(--scribe-accent)] shadow-[0_0_0_3px_color-mix(in_srgb,var(--scribe-accent)_16%,transparent)]" : "border-[#dfdce6] dark:border-[#3a3941] dark:bg-transparent"}`}
        >
          <Search
            size={15}
            className="ml-3 shrink-0 text-[#706e7c] transition-colors"
            style={{ color: searchOpen ? accent : undefined }}
          />
          <input
            value={search}
            onFocus={() => setSearchOpen(true)}
            onChange={(event) => {
              setSearch(event.target.value);
              setSearchOpen(true);
            }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setSearch("");
                setSearchOpen(false);
              }
              if (event.key === "Enter" && settingsMatches[0])
                chooseSearchResult(settingsMatches[0].category);
            }}
            placeholder="Search categories and settings"
            className="h-full min-w-0 flex-1 bg-transparent px-2.5 text-[11px] outline-none ring-0 focus:outline-none focus:ring-0 placeholder:text-[#74727f]"
          />
          {search && (
            <button
              className="mr-2 rounded p-1 text-[#706e7c] hover:bg-[#eae7f0] dark:hover:bg-[#2a2931]"
              aria-label="Clear search"
              onClick={() => setSearch("")}
            >
              <X size={13} />
            </button>
          )}
        </div>
        {searchOpen && search && (
          <div className="absolute bottom-[48px] left-[19px] right-[19px] z-20 max-h-48 overflow-y-auto rounded-xl border border-[#dedbe5] bg-[#fdfcff] p-1.5 shadow-[0_12px_34px_#28263c20] animate-[toastIn_.14s_ease-out] dark:border-[#393841] dark:bg-[#242329]">
            {settingsMatches.length ? (
              settingsMatches.map((item) => {
                const category = categories.find(
                  (entry) => entry.id === item.category,
                )!;
                const ResultIcon = category.icon;
                return (
                  <button
                    key={item.label}
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-[#f7f6fa] dark:hover:bg-[#302e36]"
                    onClick={() => chooseSearchResult(item.category)}
                  >
                    <span
                      className="grid size-7 shrink-0 place-items-center rounded-lg"
                      style={{
                        color: accent,
                        backgroundColor: `${accent}18`,
                      }}
                    >
                      <ResultIcon size={14} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[10px] font-semibold">
                        {item.label}
                      </strong>
                      <span className="block truncate text-[9px] text-[#6f6d7b]">
                        {item.detail}
                      </span>
                    </span>
                    <span
                      className="text-[8px]"
                      style={{ color: accent }}
                    >
                      {category.label}
                    </span>
                  </button>
                );
              })
            ) : (
              <p className="px-2 py-3 text-center text-[10px] text-[#706e7c]">
                No matching settings
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SettingsCard({
  title,
  subtitle,
  accent,
  children,
}: {
  title: string;
  subtitle: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <section className="relative mt-4 overflow-hidden rounded-[14px] border border-[#dedbe5] bg-[#fdfcff] px-3.5 transition-colors duration-200 dark:border-[#34333b] dark:bg-[#1d1d22]">
      <span
        className="absolute bottom-0 left-0 top-0 w-[3px]"
        style={{ background: accent }}
      />
      <div className="pb-2.5 pt-3.5">
        <h2 className="text-[12px] font-semibold tracking-[-.1px]">{title}</h2>
        <p className="mt-1 text-[10px] leading-4 text-[#6f6d7b]">{subtitle}</p>
      </div>
      <div className="border-t border-[#e6e3eb] dark:border-[#35343b]">
        {children}
      </div>
    </section>
  );
}

function SettingRow({
  title,
  subtitle,
  action,
  icon: ActionIcon = ChevronRight,
  onClick,
}: {
  title: string;
  subtitle: string;
  action: string;
  icon?: typeof ChevronRight;
  onClick?: () => void;
}) {
  return (
    <button
      className="flex min-h-[58px] w-full items-center gap-2.5 border-b border-[#e8e5ed] py-2.5 text-left transition-colors last:border-0 hover:bg-[#f1eff5] dark:border-[#35343b] dark:hover:bg-[#232229]"
      onClick={onClick}
    >
      <span className="min-w-0 flex-1">
        <strong className="block text-[11px] font-semibold">{title}</strong>
        <span className="mt-1 block text-[10px] leading-4 text-[#6f6d7b]">
          {subtitle}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-1 rounded-lg border border-[#dedbe5] px-2.5 py-2 text-[9px] font-medium text-[#656370] transition-colors dark:border-[#3a3941]">
        {action}
        <ActionIcon size={13} />
      </span>
    </button>
  );
}

function TypographySelect({
  label,
  detail,
  value,
  options,
  dark,
  accent,
  onChange,
}: {
  label: string;
  detail: string;
  value: string;
  options: readonly string[];
  dark: boolean;
  accent: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex min-h-[59px] items-center gap-2.5 py-2.5">
      <span className="min-w-0 flex-1">
        <strong className="block text-[10px] font-semibold">{label}</strong>
        <span className="mt-1 block text-[9px] leading-4 text-[#6f6d7b]">
          {detail}
        </span>
      </span>
      <select
        aria-label={label}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`h-[33px] max-w-[145px] min-w-[105px] rounded-[9px] border px-2 text-[9px] outline-none transition focus:ring-2 ${dark ? "border-[#3a3941] bg-[#222128] text-[#e9e6f1]" : "border-[#dedbe5] bg-[#f8f7fa] text-[#45434f]"}`}
        style={{ borderColor: `${accent}55`, "--tw-ring-color": `${accent}28` } as React.CSSProperties}
      >
        {options.map((option) => <option key={option} value={option}>{option}</option>)}
      </select>
    </div>
  );
}
