import { useState, type FormEvent } from "react";
import { ArrowLeft, Check, LoaderCircle } from "lucide-react";
import { AppLogo } from "../AppLogo";
import type { MfaController } from "../../hooks/useMfa";
import { MfaButton, MfaError, TotpCodeField } from "./MfaControls";

export function MfaChallengeView({ mfa, onSignOut }: { mfa: MfaController; onSignOut: () => Promise<string | null> }) {
  const [code, setCode] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const factorId = mfa.factors.find((factor) => factor.id === selectedId)?.id ?? mfa.factors[0]?.id;

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !factorId) return;
    setBusy(true); setError("");
    try {
      const result = await mfa.verify(factorId, code);
      if (result) { setError(result); setCode(""); }
      else await mfa.refresh();
    } finally { setBusy(false); }
  }

  async function back() {
    setBusy(true); setError("");
    try {
      const result = await onSignOut();
      if (result) setError(result);
    } finally { setBusy(false); }
  }

  return <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-1 py-5" aria-label="Two-step verification">
    <div className="mx-auto flex w-full max-w-[330px] flex-col gap-4">
      <div className="flex flex-col items-center text-center">
        <AppLogo className="mb-3 size-[48px]" />
        <span className="text-[9px] font-bold uppercase tracking-[1.4px] text-[var(--scribe-accent)]">Two-step verification</span>
        <h1 className="mt-1 text-[21px] font-bold tracking-[-.5px]">Verify it’s you</h1>
        <p className="mt-2 text-[11px] leading-4 text-[#747080] dark:text-[#aaa4b5]">Use Authy or your authenticator app to finish signing in to Scribe.</p>
      </div>
      {mfa.error ? <><MfaError message={mfa.error} /><MfaButton disabled={busy} onClick={async () => { setBusy(true); try { await mfa.refresh(); } finally { setBusy(false); } }}>{busy && <LoaderCircle size={13} className="animate-spin" />}{busy ? "Checking…" : "Try again"}</MfaButton></> :
        <form className="grid gap-3" onSubmit={(event) => void submit(event)}>
          {mfa.factors.length > 1 && <label className="grid gap-1 text-[10px] font-semibold"><span>Authenticator</span><select value={factorId} disabled={busy} onChange={(event) => { setSelectedId(event.target.value); setCode(""); }} className="h-9 rounded-lg border border-[#dfdce6] bg-[#f1eff5] px-2 dark:border-[#3a3944] dark:bg-[#26252d]">{mfa.factors.map((factor) => <option key={factor.id} value={factor.id}>{factor.name}</option>)}</select></label>}
          {factorId ? <TotpCodeField code={code} onChange={setCode} disabled={busy} /> : <MfaError message="No supported authenticator was found. Contact the account administrator to recover access." />}
          <MfaError message={error} />
          <MfaButton type="submit" disabled={busy || !factorId || code.length !== 6}>{busy ? <LoaderCircle size={14} className="animate-spin" /> : <Check size={14} />}{busy ? "Verifying…" : "Verify and continue"}</MfaButton>
        </form>}
      <p className="text-center text-[9px] leading-4 text-[#747080] dark:text-[#aaa4b5]">Lost your authenticator? Contact the account administrator to recover access.</p>
      {mfa.error && <MfaError message={error} />}
      <MfaButton type="button" secondary disabled={busy} onClick={() => void back()}><ArrowLeft size={13} />Back to sign in</MfaButton>
    </div>
  </section>;
}
