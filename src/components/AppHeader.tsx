import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ExternalLink,
  LogOut,
  Moon,
  Settings,
  Sparkles,
  Sun,
  X,
} from "lucide-react";
import { Tooltip } from "./Tooltip";
import { AppLogo } from "./AppLogo";

type Props = {
  onHome: () => void;
  onSettings: () => void;
  onOpenApp: () => void;
  profileOpen: boolean;
  onProfileToggle: () => void;
  dark: boolean;
  onThemeToggle: () => void;
  onSignOut: () => void;
  name: string;
  email: string;
  avatar: string;
  accent: string;
};

export function AppHeader({
  onHome,
  onSettings,
  onOpenApp,
  profileOpen,
  onProfileToggle,
  dark,
  onThemeToggle,
  onSignOut,
  name,
  email,
  avatar,
  accent,
}: Props) {
  const profileRef = useRef<HTMLDivElement>(null);
  const mascotTimer = useRef<number | null>(null);
  const dismissTimer = useRef<number | null>(null);
  const [mascotOpen, setMascotOpen] = useState(false);
  const [mascotLeaving, setMascotLeaving] = useState(false);
  const [messageIndex, setMessageIndex] = useState(-1);
  const mascotMessages = [
    "A thought worth keeping!",
    "Your notes are looking sharp.",
    "Tiny thought, big idea. Jot it down!",
    "You bring the ideas. I’ll keep the pages tidy.",
    "One little note can go a long way.",
  ];
  const mascotMessage = mascotMessages[messageIndex < 0 ? 0 : messageIndex];

  function hideMascot() {
    window.clearTimeout(mascotTimer.current ?? undefined);
    mascotTimer.current = null;
    setMascotLeaving(true);
    dismissTimer.current = window.setTimeout(() => setMascotOpen(false), 180);
  }
  function onLogoClick() {
    onHome();
    window.clearTimeout(mascotTimer.current ?? undefined);
    window.clearTimeout(dismissTimer.current ?? undefined);
    setMessageIndex((current) => (current + 1) % mascotMessages.length);
    setMascotLeaving(false);
    setMascotOpen(true);
    mascotTimer.current = window.setTimeout(hideMascot, 2800);
  }

  useEffect(() => {
    function closeOnOutside(event: MouseEvent) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target as Node)
      )
        onProfileToggle();
    }
    if (profileOpen) document.addEventListener("mousedown", closeOnOutside);
    return () => document.removeEventListener("mousedown", closeOnOutside);
  }, [profileOpen, onProfileToggle]);
  useEffect(
    () => () => {
      window.clearTimeout(mascotTimer.current ?? undefined);
      window.clearTimeout(dismissTimer.current ?? undefined);
    },
    [],
  );
  return (
    <header className="relative flex h-[38px] shrink-0 items-center gap-[10px]">
      <button
        className="grid size-9 shrink-0 place-items-center rounded-lg border-0 bg-transparent p-0 transition-all duration-200 hover:-translate-y-px hover:brightness-105"
        aria-label="Scribe home — click for a surprise"
        onClick={onLogoClick}
      >
        <AppLogo className="size-9" />
      </button>
      <button
        className="bg-transparent p-0 text-[18px] font-bold tracking-[-.55px]"
        onClick={onHome}
      >
        Scribe
      </button>
      {mascotOpen && (
        <div
          role="status"
          className={`absolute left-0 top-[45px] z-40 flex w-[264px] items-center gap-3 rounded-[15px] border p-3 shadow-[0_14px_34px_#211d3828] ${mascotLeaving ? "animate-[mascotTuck_.18s_ease-in_forwards]" : "animate-[mascotPeek_.28s_cubic-bezier(.2,.8,.2,1)_both]"} ${dark ? "border-[#403b50] bg-[#24222b] text-[#f5f2ff]" : "border-[#e7e2f4] bg-white text-[#25232d]"}`}
          style={{ borderColor: `${accent}55` }}
        >
          <span
            className="scribe-mascot relative grid size-11 shrink-0 place-items-center"
          >
            <AppLogo variant="tile" className="size-11" />
          </span>
          <span className="min-w-0 flex-1">
            <strong
              className="flex items-center gap-1 text-[10px] font-semibold"
              style={{ color: accent }}
            >
              <Sparkles size={12} />
              Scribe says
            </strong>
            <span className="mt-1 block text-[10px] leading-[1.4] text-[#6e6c7a] dark:text-[#b5b1c2]">
              {mascotMessage}
            </span>
          </span>
          <button
            aria-label="Dismiss Scribe surprise"
            className="-mr-1 -mt-1 self-start rounded-md p-1 text-[#908d9b] transition hover:bg-black/5 dark:hover:bg-white/10"
            onClick={hideMascot}
          >
            <X size={13} />
          </button>
        </div>
      )}
      <div className="flex-1" />
      <Tooltip label="Open Scribe App" accent={accent} dark={dark}>
        <button
          className="grid size-[34px] place-items-center rounded-[10px] text-[#5d6070] transition hover:bg-[#f5f4fa] dark:text-[#c0bdce] dark:hover:bg-[#292830]"
          aria-label="Open Scribe App"
          onClick={onOpenApp}
        >
          <ExternalLink size={18} />
        </button>
      </Tooltip>
      <Tooltip
        label={`Switch to ${dark ? "light" : "dark"} theme`}
        accent={accent}
        dark={dark}
      >
        <button
          className="grid size-[34px] place-items-center rounded-[10px] text-[#5d6070] transition hover:bg-[#f5f4fa] dark:text-[#c0bdce] dark:hover:bg-[#292830]"
          style={{ color: accent }}
          aria-label={`Switch to ${dark ? "light" : "dark"} theme`}
          onClick={onThemeToggle}
        >
          {dark ? <Sun size={18} /> : <Moon size={18} />}
        </button>
      </Tooltip>
      <div className="relative" ref={profileRef}>
        <button
          className="flex h-[38px] items-center gap-1 rounded-full border py-0.5 pl-0.5 pr-1.5 transition"
          style={{
            borderColor: `${accent}55`,
            backgroundColor: `color-mix(in srgb, ${accent} 10%, ${dark ? "#19191f" : "white"})`,
          }}
          aria-label="Open profile menu"
          aria-expanded={profileOpen}
          onClick={onProfileToggle}
        >
          <span
            className="grid size-[31px] place-items-center rounded-full text-[11px] font-bold text-white"
            style={{
              background: avatar.startsWith("#")
                ? avatar
                : "linear-gradient(135deg,#b49bff,#7d69f5)",
            }}
          >
            {name.trim().charAt(0).toUpperCase() || "A"}
          </span>
          <ChevronDown size={12} className="text-[#817b94]" />
        </button>
        {profileOpen && (
          <div className="absolute right-0 top-11 z-20 w-[238px] animate-[toastIn_.16s_ease-out] rounded-xl border border-[#eae8f1] bg-white p-2 shadow-[0_12px_34px_#28263c20] dark:border-[#383641] dark:bg-[#25242b]">
            <div className="flex items-center gap-3 border-b border-[#f0eff4] px-2 pb-3 pt-1 dark:border-[#383641]">
              <span
                className="grid size-11 shrink-0 place-items-center rounded-full text-base font-bold text-white"
                style={{
                  background: avatar.startsWith("#")
                    ? avatar
                    : "linear-gradient(135deg,#b49bff,#7d69f5)",
                }}
              >
                {name.trim().charAt(0).toUpperCase() || "A"}
              </span>
              <span className="min-w-0">
                <strong className="block truncate text-[13px] font-semibold">
                  {name || "Your profile"}
                </strong>
                <span className="mt-0.5 block truncate text-[11px] text-[#92919f]">
                  {email || "Signed in with Scribe"}
                </span>
              </span>
            </div>
            <button
              className="mt-1.5 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[11px] text-[#5a5967] transition hover:bg-[#f6f4ff] dark:text-[#d5d2df] dark:hover:bg-[#302d39]"
              onClick={onSettings}
            >
              <Settings size={16} />
              Settings
            </button>
            <button
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2.5 text-left text-[11px] text-[#a65f69] transition hover:bg-[#fff2f3] dark:hover:bg-[#38242a]"
              onClick={onSignOut}
            >
              <LogOut size={16} />
              Log out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
