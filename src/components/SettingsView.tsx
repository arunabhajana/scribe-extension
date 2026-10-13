import { useState } from "react";
import {
  ArrowLeft,
  Database,
  FolderOpen,
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
import { MfaSettings } from "./mfa/MfaSettings";
import type { MfaController } from "../hooks/useMfa";
import type { DeviceInventory } from "../hooks/useDeviceSessions";
import { SignedInDevices } from "./SignedInDevices";
import { noteFontFamilies, noteFontSizes, type NoteFontFamily, type NoteFontSize } from "../data/noteFontSizes";

type Props = {
  deviceInventory: DeviceInventory;
  mfa: MfaController;
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
  onClearNotes: () => void;
  onMessage: (message: string) => void;
  name: string;
  email: string;
  onSaveName: (name: string) => Promise<string | null>;
  avatar: string;
  setAvatar: (avatar: string) => void;
  linkedAccounts: { provider: string; name?: string; email?: string }[];
  linkedIdentityCount: number;
  onLinkAccount: (provider: "google" | "github") => Promise<string | null>;
  onUnlinkAccount: (provider: "google" | "github") => Promise<string | null>;
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
    label: "Data",
    icon: Database,
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
  onClearNotes,
  onMessage,
  name,
  email,
  onSaveName,
  avatar,
  setAvatar,
  linkedAccounts,
  linkedIdentityCount,
  onLinkAccount,
  onUnlinkAccount,
  mfa,
  deviceInventory,
}: Props) {
  const [active, setActive] = useState("account");
  const [search, setSearch] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [providerPending, setProviderPending] = useState<"google" | "github" | null>(null);
  const [nameDraft, setNameDraft] = useState(name);
  const [savingName, setSavingName] = useState(false);
  const current =
    categories.find((category) => category.id === active) ?? categories[0];
  const Icon = current.icon;

  async function saveDisplayName() {
    const nextName = nameDraft.trim();
    if (!nextName || nextName.length > 40) {
      onMessage("Enter a name between 1 and 40 characters.");
      return;
    }
    if (nextName === name.trim()) return;
    setSavingName(true);
    try {
      const error = await onSaveName(nextName);
      if (error) onMessage(error);
      else onMessage("Display name updated.");
    } catch (error) {
      onMessage(error instanceof Error ? error.message : "Could not update your display name.");
    } finally {
      setSavingName(false);
    }
  }
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
      label: "Manage folders",
      detail: "Create edit rearrange or delete folders",
      category: "folders",
    },
    {
      label: "Clear notes",
      detail: "Remove notes from the extension",
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
      label: "Linked accounts",
      detail: "Link or unlink Google and GitHub",
      category: "account",
    },
    { label: "Two-step verification", detail: "Set up or remove Authy and two-factor authentication (2FA / MFA)", category: "account" },
    {
      label: "Signed-in devices",
      detail: "View real account sessions and last-seen activity",
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
  async function toggleProvider(provider: "google" | "github", isLinked: boolean) {
    setProviderPending(provider);
    const providerName = provider === "google" ? "Google" : "GitHub";
    try {
      const error = await (isLinked ? onUnlinkAccount(provider) : onLinkAccount(provider));
      onMessage(error ?? `${providerName} ${isLinked ? "account unlinked" : "account linked"}.`);
    } catch (error) {
      onMessage(error instanceof Error ? error.message : `${providerName} account could not be updated.`);
    } finally {
      setProviderPending(null);
    }
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
            <h1 className="text-[18px] font-bold tracking-[-.45px]">Data</h1>
            <p className="mt-1 text-[10px] text-[#6f6d7b]">
              Manage your extension notes.
            </p>
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
                </span>
                <div className="min-w-0 flex-1">
                  <label className="mb-1 block text-[9px] font-semibold text-[#686674]">Display name</label>
                  <div className="flex gap-1.5">
                    <input
                      value={nameDraft}
                      maxLength={40}
                      disabled={savingName}
                      onChange={(event) => setNameDraft(event.target.value)}
                      onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); void saveDisplayName(); } }}
                      className="h-9 min-w-0 flex-1 rounded-lg border border-[#e7e5ed] bg-transparent px-2.5 text-[11px] outline-none focus:border-[var(--scribe-accent)] dark:border-[#3a3941]"
                      placeholder="Your name"
                      aria-label="Display name"
                    />
                    <button
                      type="button"
                      disabled={savingName || !nameDraft.trim() || nameDraft.trim() === name.trim()}
                      onClick={() => void saveDisplayName()}
                      className="rounded-lg px-2.5 text-[10px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
                      style={{ backgroundColor: accent }}
                    >
                      {savingName ? "Saving…" : "Save"}
                    </button>
                  </div>
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
                      aria-label={`Choose avatar color ${color}`}
                      aria-pressed={avatar === color}
                      onClick={() => setAvatar(color)}
                    />
                  ))}
                </div>
              </div>
            </SettingsCard>
            <SettingsCard title="Two-step verification" subtitle="Add an authenticator for extra sign-in protection." accent={current.color}>
              <MfaSettings mfa={mfa} />
            </SettingsCard>
            <SettingsCard
              title="Linked accounts"
              subtitle="Connect providers to sign in to this account."
              accent={current.color}
            >
              {(["google", "github"] as const).map((provider) => {
                const isLinked = linkedAccounts.some((item) => item.provider === provider);
                const cannotUnlink = isLinked && linkedIdentityCount <= 1;
                const providerName = provider === "google" ? "Google" : "GitHub";
                const identity = linkedAccounts.find((item) => item.provider === provider);
                return (
                  <div key={provider} className="flex min-h-[63px] items-center gap-2.5 border-b border-[#e8e5ed] py-2.5 last:border-0 dark:border-[#35343b]">
                    <span className={`grid size-8 shrink-0 place-items-center rounded-[9px] ${dark ? "bg-[#2a2931]" : "bg-[#f1eff5]"}`}>
                      <ProviderLogo provider={provider} dark={dark} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <strong className="block text-[10px] font-semibold">{providerName}</strong>
                      <span className="mt-0.5 block truncate text-[9px] text-[#6f6d7b]">
                        {isLinked ? (identity?.email ?? "Linked to your account") : "Not linked"}
                      </span>
                    </span>
                    <button
                      type="button"
                      disabled={providerPending !== null || cannotUnlink}
                      title={cannotUnlink ? "Keep at least one sign-in method linked to your account." : undefined}
                      onClick={() => void toggleProvider(provider, isLinked)}
                      className={`h-[29px] shrink-0 rounded-lg border px-2.5 text-[9px] font-semibold transition hover:-translate-y-px ${isLinked ? "border-[#e5c8ca] text-[#bb5963] hover:bg-[#fff2f2] dark:border-[#51353a] dark:hover:bg-[#342327]" : "border-[var(--scribe-accent)]/40 text-[var(--scribe-accent)] hover:bg-[color-mix(in_srgb,var(--scribe-accent)_8%,transparent)]"}`}
                    >
                      {providerPending === provider ? "Working…" : isLinked ? "Unlink" : "Link"}
                    </button>
                  </div>
                );
              })}
            </SettingsCard>
            <SettingsCard title="Signed-in devices" subtitle="Sign-in sessions associated with your account." accent={current.color}>
              <SignedInDevices inventory={deviceInventory} dark={dark} accent={current.color} onMessage={onMessage} />
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

function ProviderLogo({ provider, dark }: { provider: "google" | "github"; dark: boolean }) {
  if (provider === "google") return (
    <svg aria-hidden="true" viewBox="0 0 48 48" className="size-[17px]">
      <path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.7c3.9-3.6 6-8.9 6-14.9Z" />
      <path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5c-1.8 1.2-4.1 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.2A20 20 0 0 0 24 44Z" />
      <path fill="#FBBC05" d="M12.8 27.9a12 12 0 0 1 0-7.7V15H5.9a20 20 0 0 0 0 18.1l6.9-5.2Z" />
      <path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.3 19.3 0 0 0 24 4 20 20 0 0 0 5.9 15l6.9 5.2C14.4 15.5 18.8 12 24 12Z" />
    </svg>
  );
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className={`size-[17px] ${dark ? "text-white" : "text-[#24292f]"}`} fill="currentColor">
      <path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.6-1.3-1.6-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.3.8 1 .8 2v3.1c0 .3.2.7.8.6A11.1 11.1 0 0 0 12 .9Z" />
    </svg>
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
