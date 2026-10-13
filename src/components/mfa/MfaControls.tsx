import { useId, type ButtonHTMLAttributes } from "react";

export function MfaButton({ secondary = false, danger = false, className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { secondary?: boolean; danger?: boolean }) {
  return <button {...props} className={`extension-mfa-button inline-flex min-h-[34px] items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[10px] font-semibold transition hover:-translate-y-px motion-reduce:transform-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 ${danger ? "border-[#e5c8ca] bg-transparent text-[#bb5963] hover:bg-[#fff2f2] dark:border-[#51353a] dark:text-[#f3aab4] dark:hover:bg-[#342327]" : secondary ? "border-[#dfdce6] bg-[#f1eff5] text-[#524f60] hover:bg-[#e9e6ef] dark:border-[#3a3944] dark:bg-[#292830] dark:text-[#e5e0ed] dark:hover:bg-[#33313c]" : "border-transparent bg-[var(--scribe-accent)] text-white shadow-sm hover:brightness-110"} ${className}`} />;
}

export function TotpCodeField({ code, onChange, disabled = false }: { code: string; onChange: (code: string) => void; disabled?: boolean }) {
  const helpId = useId();
  return <label className="grid gap-1.5 text-[10px] font-semibold">
    <span>Authenticator code</span>
    <input autoFocus required type="text" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6}
      disabled={disabled} value={code} onChange={(event) => onChange(event.target.value.replace(/\D/g, "").slice(0, 6))}
      placeholder="000000" aria-describedby={helpId}
      className="extension-totp-code h-[40px] w-full min-w-0 rounded-[9px] border border-[#dfdce6] bg-[#f1eff5] px-3 text-center text-[17px] font-bold tracking-[.35em] text-[#292631] focus:border-[var(--scribe-accent)] focus:ring-2 focus:ring-[var(--scribe-accent)]/15 disabled:opacity-60 dark:border-[#3a3944] dark:bg-[#26252d] dark:text-[#f4f2fb]" />
    <span id={helpId} className="text-[9px] font-normal leading-4 text-[#747080] dark:text-[#aaa4b5]">Enter the latest six-digit code from your authenticator.</span>
  </label>;
}

export function MfaError({ message }: { message: string }) {
  if (!message) return null;
  return <div role="alert" className="rounded-lg border border-[#edcbd0] bg-[#fff2f4] px-3 py-2 text-[10px] leading-4 text-[#a84455] dark:border-[#57333a] dark:bg-[#321f24] dark:text-[#f3aab4]">{message}</div>;
}
