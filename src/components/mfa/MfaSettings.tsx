import { useEffect, useRef, useState, type FormEvent } from "react";
import { Check, LoaderCircle, Plus, ShieldCheck, Smartphone, Trash2 } from "lucide-react";
import type { MfaController, TotpEnrollment, TotpFactor } from "../../hooks/useMfa";
import { MfaButton, MfaError, TotpCodeField } from "./MfaControls";

export function MfaSettings({ mfa }: { mfa: MfaController }) {
  const [setup, setSetup] = useState<TotpEnrollment | null>(null);
  const [removing, setRemoving] = useState<TotpFactor | null>(null);
  const [name, setName] = useState("Authy");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pendingSetup = useRef<string | null>(null);
  const mounted = useRef(true);
  const cancelEnrollment = mfa.cancelEnrollment;
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      if (pendingSetup.current) void cancelEnrollment(pendingSetup.current);
    };
  }, [cancelEnrollment]);

  async function startSetup() {
    if (busy) return;
    if (mfa.factors.length) { setError("Remove your current authenticator before setting up another."); return; }
    setBusy(true); setError("");
    try {
      const result = await mfa.enroll(name);
      if (!mounted.current) {
        if (result.enrollment) await mfa.cancelEnrollment(result.enrollment.id);
        return;
      }
      if (result.error) setError(result.error);
      else if (result.enrollment) {
        pendingSetup.current = result.enrollment.id;
        setSetup(result.enrollment); setCode("");
      }
    } finally { if (mounted.current) setBusy(false); }
  }

  async function cancel() {
    if (busy) return;
    setBusy(true); setError("");
    try {
      if (setup) {
        const result = await mfa.cancelEnrollment(setup.id);
        if (result) { setError(result); return; }
      }
      pendingSetup.current = null;
      setSetup(null); setRemoving(null); setCode("");
    } finally { if (mounted.current) setBusy(false); }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const result = setup ? await mfa.verify(setup.id, code) : removing ? await mfa.remove(removing.id, code) : "Choose an authenticator first.";
      if (result) { if (mounted.current) { setError(result); setCode(""); } return; }
      if (setup) { pendingSetup.current = null; mfa.announceEnabled(); }
      if (mounted.current) { setSetup(null); setRemoving(null); setCode(""); }
      await mfa.refresh();
    } finally { if (mounted.current) setBusy(false); }
  }

  return <div className="grid min-w-0 gap-3 py-3" aria-label="Two-step verification">
    <div className="flex items-center justify-between gap-2">
      <span className="flex items-center gap-1.5 text-[10px] font-semibold"><ShieldCheck size={14} />Authenticator app</span>
      <span className={`rounded-full px-2 py-1 text-[8px] font-semibold ${mfa.factors.length ? "bg-[#21a87a]/10 text-[#17865f] dark:text-[#60d9ae]" : "bg-[#f1eff5] text-[#747080] dark:bg-[#2a2931] dark:text-[#aaa4b5]"}`}>{mfa.factors.length ? "Enabled" : "Not enabled"}</span>
    </div>
    {mfa.factors.map((factor) => <div key={factor.id} className="flex items-center gap-2 rounded-lg border border-[#e6e3eb] bg-[#f6f4fa] p-2 dark:border-[#35343b] dark:bg-[#25242b]">
      <Smartphone size={17} className="shrink-0 text-[#8d869c]" /><div className="min-w-0 flex-1"><strong className="block break-words text-[10px] font-semibold">{factor.name}</strong><span className="text-[8px] text-[#747080] dark:text-[#aaa4b5]">Protects your Scribe sign-in</span></div>
      <MfaButton secondary danger type="button" className="min-h-[29px] px-2 py-1 text-[9px]" disabled={busy || Boolean(setup || removing)} onClick={() => { setRemoving(factor); setCode(""); setError(""); }}><Trash2 size={12} />Remove</MfaButton>
    </div>)}
    {mfa.factors.length === 0 && !setup && !removing && <div className="grid gap-2">
      <label className="grid gap-1 text-[9px] font-semibold"><span>Authenticator name</span><input type="text" maxLength={60} value={name} disabled={busy} onChange={(event) => setName(event.target.value)} placeholder="e.g. Authy" className="h-[34px] w-full min-w-0 rounded-lg border border-[#dfdce6] bg-[#f1eff5] px-2.5 text-[10px] focus:border-[var(--scribe-accent)] focus:ring-2 focus:ring-[var(--scribe-accent)]/15 dark:border-[#3a3944] dark:bg-[#26252d]" /></label>
      <MfaButton type="button" disabled={busy || Boolean(mfa.error)} onClick={() => void startSetup()}>{busy ? <LoaderCircle size={13} className="animate-spin" /> : <Plus size={13} />}{busy ? "Setting up…" : "Set up authenticator"}</MfaButton>
    </div>}
    {(setup || removing) && <form className="grid min-w-0 gap-3 rounded-[10px] border border-[#e6e3eb] bg-[#f6f4fa] p-3 dark:border-[#35343b] dark:bg-[#25242b]" onSubmit={(event) => void submit(event)}>
      {setup ? <><strong className="text-[10px]">1. Scan with your authenticator</strong><p className="text-[9px] leading-4 text-[#747080] dark:text-[#aaa4b5]">In Authy or your authenticator app, choose Add account and scan this QR code.</p><img src={setup.qrCode} alt="Scan this QR code in your authenticator app" className="mx-auto size-[148px] rounded-lg bg-white p-2" /><details className="text-[9px] text-[#747080] dark:text-[#aaa4b5]"><summary className="cursor-pointer font-semibold">Can’t scan? Use a setup key</summary><code className="mt-2 block select-text break-all rounded-lg border border-[#dfdce6] bg-white p-2 font-mono text-[10px] text-[#373443] dark:border-[#3a3944] dark:bg-[#1d1c23] dark:text-[#eeeaf5]">{setup.secret}</code></details><strong className="border-t border-[#e6e3eb] pt-3 text-[10px] dark:border-[#35343b]">2. Confirm setup</strong></> : <><strong className="break-words text-[10px]">Remove {removing!.name}?</strong><p className="text-[9px] leading-4 text-[#747080] dark:text-[#aaa4b5]">{mfa.factors.length === 1 ? "This turns off two-step verification. " : "Your other authenticators stay enabled. "}Enter a code to confirm.</p></>}
      <TotpCodeField code={code} onChange={setCode} disabled={busy} />
      <div className="flex flex-wrap gap-2"><MfaButton type="submit" danger={!setup} className="flex-1" disabled={busy || code.length !== 6}>{busy ? <LoaderCircle size={13} className="animate-spin" /> : <Check size={13} />}{busy ? "Verifying…" : setup ? "Enable verification" : "Confirm removal"}</MfaButton><MfaButton secondary type="button" disabled={busy} onClick={() => void cancel()}>Cancel</MfaButton></div>
      {setup && <p className="text-[8px] leading-3 text-[#747080] dark:text-[#aaa4b5]">Keep your authenticator backed up if you change phones.</p>}
    </form>}
    <MfaError message={error || mfa.error} />
  </div>;
}
