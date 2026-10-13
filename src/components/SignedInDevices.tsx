import { useEffect, useState } from "react";
import { Globe, LoaderCircle, Monitor, RefreshCw, Smartphone } from "lucide-react";
import type { DeviceInventory } from "../hooks/useDeviceSessions";
import type { SignOutScope } from "../lib/deviceSessions";
import { Tooltip } from "./Tooltip";

function lastSeen(value: string) {
  const time = Date.parse(value);
  if (!Number.isFinite(time)) return "Last seen unavailable";
  const seconds = Math.max(0, Math.floor((Date.now() - time) / 1000));
  if (seconds < 60) return "Last seen just now";
  const unit = seconds < 3600 ? "minute" : seconds < 86400 ? "hour" : "day";
  const divisor = unit === "minute" ? 60 : unit === "hour" ? 3600 : 86400;
  return `Last seen ${new Intl.RelativeTimeFormat(undefined, { numeric: "auto" }).format(-Math.floor(seconds / divisor), unit)}`;
}

const clientLabels = { windows: "Scribe for Windows", extension: "Scribe extension", mobile: "Scribe mobile", web: "Scribe in browser", unknown: "Client details unavailable" };

export function SignedInDevices({ inventory, dark, accent, onMessage }: { inventory: DeviceInventory; dark: boolean; accent: string; onMessage: (message: string) => void }) {
  const [confirmation, setConfirmation] = useState<{ scope: SignOutScope; id?: string; name?: string } | null>(null);
  const busy = Boolean(inventory.action);
  const notice = inventory.notice;
  const clearNotice = inventory.clearNotice;
  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => { onMessage(notice); clearNotice(); }, 0);
    return () => window.clearTimeout(timer);
  }, [notice, clearNotice, onMessage]);
  async function confirmSignOut() {
    if (!confirmation) return;
    const error = await inventory.revoke(confirmation.scope, confirmation.id);
    if (!error) setConfirmation(null);
  }
  const refresh = inventory.refresh;
  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    const visibleRefresh = () => { if (document.visibilityState === "visible") void refresh(); };
    const interval = window.setInterval(visibleRefresh, 60_000);
    window.addEventListener("focus", visibleRefresh);
    window.addEventListener("online", visibleRefresh);
    return () => {
      window.clearTimeout(timer); window.clearInterval(interval);
      window.removeEventListener("focus", visibleRefresh); window.removeEventListener("online", visibleRefresh);
    };
  }, [refresh]);

  return <div className="pb-2" aria-busy={inventory.loading}>
    <div className="flex items-center justify-between gap-2 py-2">
      <span className="text-[8px] text-[#747080] dark:text-[#aaa4b5]">{inventory.checkedAt ? `Checked ${new Date(inventory.checkedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Checking sessions"}</span>
      <button type="button" disabled={inventory.loading} onClick={() => void refresh()} className="extension-device-button flex h-7 items-center gap-1.5 rounded-lg border border-[#dfdce6] px-2 text-[#747080] transition hover:bg-[#f1eff5] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#3a3944] dark:text-[#aaa4b5] dark:hover:bg-[#292830]">{inventory.loading ? <LoaderCircle size={12} className="animate-spin" /> : <RefreshCw size={12} />}Refresh</button>
    </div>
    {(inventory.error || inventory.actionError) && <p role="alert" className="mb-2 rounded-lg border border-[#edcbd0] bg-[#fff2f4] p-2 text-[9px] leading-4 text-[#a84455] dark:border-[#57333a] dark:bg-[#321f24] dark:text-[#f3aab4]">{inventory.actionError || inventory.error}</p>}
    {inventory.loading && !inventory.devices.length && <div role="status" className="flex items-center gap-2 py-3 text-[9px] text-[#747080] dark:text-[#aaa4b5]"><LoaderCircle size={13} className="animate-spin" />Loading signed-in devices…</div>}
    {!inventory.loading && !inventory.error && !inventory.devices.length && <p className="py-3 text-[9px] leading-4 text-[#747080] dark:text-[#aaa4b5]">No sign-in sessions were found. Refresh or sign in again.</p>}
    {inventory.devices.map((device) => {
      const DeviceIcon = device.clientType === "windows" ? Monitor : device.clientType === "mobile" ? Smartphone : Globe;
      return <div key={device.sessionId} className="flex min-h-[62px] items-center gap-2 border-t border-[#e8e5ed] py-2.5 dark:border-[#35343b]">
        <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-[#f1eff5] text-[#706d7b] dark:bg-[#2a2931] dark:text-[#c7c3d0]"><DeviceIcon size={16} /></span>
        <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-1.5"><strong className="break-words text-[10px] font-semibold">{device.name}</strong>{device.current && <span className="shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-semibold" style={{ color: accent, background: `${accent}18` }}>Current</span>}</span><span className="mt-0.5 block text-[8px] leading-3 text-[#747080] dark:text-[#aaa4b5]">{clientLabels[device.clientType]} · {device.platform}</span><span title={`Signed in: ${new Date(device.signedInAt).toLocaleString()} · Last seen: ${new Date(device.lastSeenAt).toLocaleString()}`} className="mt-1 block text-[8px] text-[#747080] dark:text-[#aaa4b5]">{lastSeen(device.lastSeenAt)}</span></span>
        {!device.current && <Tooltip dark={dark} accent={accent} label="Sign out this device"><button type="button" disabled={busy || inventory.loading} onClick={() => setConfirmation({ scope: "single", id: device.sessionId, name: device.name })} className="extension-device-button flex min-h-7 shrink-0 items-center gap-1 rounded-lg border border-[#e5c8ca] px-2 text-[#bb5963] transition hover:bg-[#fff2f2] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#51353a] dark:hover:bg-[#342327]">{inventory.action === device.sessionId ? <LoaderCircle size={11} className="animate-spin" /> : "Sign out"}</button></Tooltip>}
      </div>;
    })}
    <p className="mt-2 text-[8px] leading-3 text-[#747080] dark:text-[#aaa4b5]">Last seen reflects app check-ins and session refreshes.</p>
    {confirmation && <div className="mt-3 grid gap-2 rounded-lg border border-[#dfdce6] bg-[#f1eff5] p-3 dark:border-[#3a3944] dark:bg-[#25242b]" role="group" aria-label="Confirm device sign-out"><strong className="break-words text-[10px]">{confirmation.scope === "single" ? `Sign out ${confirmation.name}?` : confirmation.scope === "others" ? "Sign out other devices?" : "Sign out from all devices?"}</strong><p className="text-[9px] leading-4 text-[#747080] dark:text-[#aaa4b5]">{confirmation.scope === "all" ? "This includes this extension. You’ll need to sign in again everywhere." : "Those devices will lose cloud access and need to sign in again. This extension stays signed in."}</p><div className="flex gap-2"><button type="button" autoFocus disabled={busy} onClick={() => void confirmSignOut()} className="extension-device-button flex min-h-8 items-center gap-1 rounded-lg border border-[#e5c8ca] px-2 text-[#bb5963] disabled:opacity-50 dark:border-[#51353a]">{busy && <LoaderCircle size={12} className="animate-spin" />}{busy ? "Signing out…" : "Confirm sign out"}</button><button type="button" disabled={busy} onClick={() => setConfirmation(null)} className="extension-device-button rounded-lg border border-[#dfdce6] px-2 dark:border-[#3a3944]">Cancel</button></div></div>}
    <div className="mt-2 grid gap-2">{(["others", "all"] as const).map((scope) => <button key={scope} type="button" disabled={busy || inventory.loading || (scope === "others" ? !inventory.devices.some((device) => !device.current) : !inventory.devices.length)} onClick={() => setConfirmation({ scope })} className="extension-device-button min-h-[32px] w-full rounded-lg border border-[#e5c8ca] px-2.5 text-[#bb5963] transition hover:bg-[#fff2f2] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#51353a] dark:hover:bg-[#342327]">{scope === "all" ? "Sign out from all devices" : "Sign out other devices"}</button>)}</div>
  </div>;
}
