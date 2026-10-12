import { useState } from "react";
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  FileText,
  LockKeyhole,
  Mail,
  Sparkles,
} from "lucide-react";

type Props = {
  dark: boolean;
  accent: string;
  onAuthenticated: (name: string, email: string) => void;
  onRegister: (name: string, email: string, password: string) => Promise<{ error: string | null; confirmationRequired: boolean }>;
  onResendVerification: (email: string) => Promise<string | null>;
  onSignIn: (email: string, password: string) => Promise<string | null>;
  onSignInWithProvider: (provider: "google" | "github") => Promise<string | null>;
  onMessage: (message: string) => void;
};

export function AuthView({ dark, accent, onAuthenticated, onRegister, onResendVerification, onSignIn, onSignInWithProvider, onMessage }: Props) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [remember, setRemember] = useState(true);
  const [pending, setPending] = useState(false);
  const [socialPending, setSocialPending] = useState<"google" | "github" | null>(null);
  const [error, setError] = useState("");
  const [verificationPending, setVerificationPending] = useState(false);
  const [lastEmail, setLastEmail] = useState("");
  const [notice, setNotice] = useState("");
  const registering = mode === "register";

  async function signInWithProvider(provider: "google" | "github") {
    setError("");
    setNotice("");
    setSocialPending(provider);
    try {
      const message = await onSignInWithProvider(provider);
      if (message) setError(message);
    } catch {
      setError(`Could not sign in with ${provider === "google" ? "Google" : "GitHub"}. Please try again.`);
    } finally {
      setSocialPending(null);
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setPending(true);
    try {
      if (registering) {
        const result = await onRegister(name.trim(), email.trim(), password);
        if (result.error) setError(result.error);
        else if (result.confirmationRequired) {
          setLastEmail(email.trim());
          setVerificationPending(true);
        } else onAuthenticated(name.trim(), email.trim());
      } else {
        const message = await onSignIn(email.trim(), password);
        if (message) setError(message);
        else onAuthenticated("", email.trim());
      }
    } catch {
      setError("Could not reach the account service. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  if (verificationPending) {
    return <VerificationPending email={lastEmail} dark={dark} accent={accent} onBack={() => setVerificationPending(false)} onResend={async () => {
      setPending(true); setError("");
      try {
        const message = await onResendVerification(lastEmail);
        if (message) setError(message);
        else setNotice("A new verification email has been sent.");
      } catch { setError("Could not resend the verification email. Try again shortly."); }
      finally { setPending(false); }
    }} pending={pending} error={error} notice={notice} />;
  }

  const fieldClass = `flex h-[43px] items-center gap-2.5 rounded-[11px] border px-3 transition focus-within:ring-2 ${dark ? "border-[#3a3944] bg-[#222128] focus-within:border-[var(--scribe-accent)] focus-within:ring-[var(--scribe-accent)]/15" : "border-[#dfdce6] bg-[#f1eff5] focus-within:border-[var(--scribe-accent)] focus-within:ring-[var(--scribe-accent)]/15"}`;

  return (
    <section className="flex min-h-0 flex-1 flex-col overflow-y-auto px-1 pb-1 pt-[20px]">
      <div className="mx-auto mt-[14px] flex w-full max-w-[330px] flex-col items-center text-center">
        <div
          className="relative grid size-[54px] place-items-center rounded-[17px] text-white shadow-[0_8px_22px_var(--auth-glow)]"
          style={{
            background: `linear-gradient(145deg, color-mix(in srgb, ${accent} 68%, white), ${accent})`,
            "--auth-glow": `${accent}42`,
          } as React.CSSProperties}
        >
          <FileText size={27} strokeWidth={1.8} />
          <Sparkles className="absolute -right-1.5 -top-1.5 text-[#e6bb72]" size={17} fill="currentColor" />
        </div>
        <p className="mb-1 mt-3 text-[9px] font-bold uppercase tracking-[1.55px]" style={{ color: accent }}>
          Your ideas, in sync
        </p>
        <h1 className="text-[20px] font-bold tracking-[-.55px]">
          {registering ? "Make room for ideas" : "Welcome back"}
        </h1>
        <p className="mt-1.5 max-w-[275px] text-[10.5px] leading-[1.55] text-[#6f6d7b]">
          {registering
            ? "Create your Scribe account and keep your notes close, wherever you work."
            : "Sign in to keep your notes in sync across your devices."}
        </p>
      </div>

      <div className="mx-auto mt-[16px] flex w-full max-w-[330px] gap-2">
        <button type="button" disabled={pending || socialPending !== null} onClick={() => void signInWithProvider("google")} className={`flex h-[36px] flex-1 items-center justify-center gap-2 rounded-[10px] border text-[9px] font-semibold transition hover:border-[var(--scribe-accent)]/50 hover:bg-black/[.025] disabled:cursor-wait disabled:opacity-60 dark:hover:bg-white/[.035] ${dark ? "border-[#3a3944] bg-[#222128]" : "border-[#dfdce6] bg-[#fdfcff]"}`}><GoogleLogo /> {socialPending === "google" ? "Connecting…" : "Google"}</button>
        <button type="button" disabled={pending || socialPending !== null} onClick={() => void signInWithProvider("github")} className={`flex h-[36px] flex-1 items-center justify-center gap-2 rounded-[10px] border text-[9px] font-semibold transition hover:border-[var(--scribe-accent)]/50 hover:bg-black/[.025] disabled:cursor-wait disabled:opacity-60 dark:hover:bg-white/[.035] ${dark ? "border-[#3a3944] bg-[#222128]" : "border-[#dfdce6] bg-[#fdfcff]"}`}><GitHubLogo dark={dark} /> {socialPending === "github" ? "Connecting…" : "GitHub"}</button>
      </div>
      <div className="mx-auto mt-3 flex w-full max-w-[330px] items-center gap-3 text-[8px] text-[#777582]"><i className="h-px flex-1 bg-[#e5e2eb] dark:bg-[#34333d]" />or continue with email<i className="h-px flex-1 bg-[#e5e2eb] dark:bg-[#34333d]" /></div>

      <div className={`mx-auto mt-[12px] flex w-full max-w-[330px] rounded-[11px] p-[3px] ${dark ? "bg-[#24232a]" : "bg-[#eae8f0]"}`}>
        {(["login", "register"] as const).map((item) => (
          <button
            key={item}
            onClick={() => setMode(item)}
            className={`h-[32px] flex-1 rounded-[9px] text-[10px] font-semibold capitalize transition ${mode === item ? "bg-[#fdfcff] text-[#292735] shadow-[0_1px_4px_#26223818] dark:bg-[#35323e] dark:text-white" : "text-[#6f6d7b] hover:text-[#403e4b] dark:hover:text-[#e0dce9]"}`}
          >
            {item === "login" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={(event) => void submit(event)} className="mx-auto mt-[14px] flex w-full max-w-[330px] flex-col gap-[10px]">
        {registering && (
          <label className="flex flex-col gap-[6px] text-[9.5px] font-semibold text-[#696775] dark:text-[#c9c5d2]">
            Your name
            <input
              required
              autoComplete="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              className={`${fieldClass} text-[11px] font-normal text-[#282733] placeholder:text-[#aaa8b3] dark:text-[#f4f2fb]`}
            />
          </label>
        )}
        <label className="flex flex-col gap-[6px] text-[9.5px] font-semibold text-[#696775] dark:text-[#c9c5d2]">
          Email address
          <span className={fieldClass}>
            <Mail size={15} className="shrink-0 text-[#a3a0ad]" />
            <input
              required
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="h-full min-w-0 flex-1 bg-transparent text-[11px] font-normal text-[#282733] placeholder:text-[#aaa8b3] dark:text-[#f4f2fb]"
            />
          </span>
        </label>
        <label className="flex flex-col gap-[6px] text-[9.5px] font-semibold text-[#696775] dark:text-[#c9c5d2]">
          Password
          <span className={fieldClass}>
            <LockKeyhole size={15} className="shrink-0 text-[#a3a0ad]" />
            <input
              required
              minLength={8}
              type={showPassword ? "text" : "password"}
              autoComplete={registering ? "new-password" : "current-password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={registering ? "At least 8 characters" : "Your password"}
              className="h-full min-w-0 flex-1 bg-transparent text-[11px] font-normal text-[#282733] placeholder:text-[#aaa8b3] dark:text-[#f4f2fb]"
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((current) => !current)}
              className="grid size-7 shrink-0 place-items-center rounded-md text-[#9794a2] hover:bg-black/5 dark:hover:bg-white/5"
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </span>
        </label>

        <div className="flex min-h-[20px] items-center justify-between pt-0.5">
          {!registering ? (
            <button
              type="button"
              onClick={() => onMessage("Password reset will be available when sync is connected.")}
              className="ml-auto text-[9px] font-semibold transition hover:underline"
              style={{ color: accent }}
            >
              Forgot password?
            </button>
          ) : (
            <span className="text-[9px] text-[#9694a1]">Use at least 8 characters</span>
          )}
        </div>

        {error && <p role="alert" className="rounded-lg border border-[#f2cbd0] bg-[#fff5f6] px-2.5 py-2 text-[9px] leading-[1.45] text-[#b24d5d] dark:border-[#57333a] dark:bg-[#321f24] dark:text-[#f3aab4]">{error}</p>}

        <button
          type="submit"
          disabled={pending}
          className="mt-0.5 flex h-[42px] items-center justify-center gap-2 rounded-[11px] text-[10.5px] font-semibold text-white shadow-[0_5px_14px_var(--auth-glow)] transition hover:-translate-y-px hover:brightness-105 active:translate-y-0"
          style={{
            background: `linear-gradient(110deg, color-mix(in srgb, ${accent} 78%, #ae9cff), ${accent})`,
            "--auth-glow": `${accent}35`,
          } as React.CSSProperties}
        >
          {pending ? "Please wait…" : registering ? "Create your account" : "Sign in"}
          {!pending && <ArrowRight size={15} />}
        </button>
      </form>

      {!registering && (
        <button
          type="button"
          aria-pressed={remember}
          onClick={() => setRemember((current) => !current)}
          className="mx-auto mt-[12px] flex w-full max-w-[330px] items-center gap-2 text-left text-[9px] text-[#8f8d9a]"
        >
          <span className={`grid size-[14px] place-items-center rounded-[4px] border transition ${remember ? "border-[var(--scribe-accent)] text-white" : "border-[#d8d6e0] dark:border-[#4c4955]"}`} style={remember ? { backgroundColor: accent } : undefined}>
            {remember && <Check size={10} strokeWidth={3} />}
          </span>
          Keep me signed in
        </button>
      )}

      <p className="mx-auto mb-0 mt-auto max-w-[320px] pt-[17px] text-center text-[8.5px] leading-[1.55] text-[#aaa8b3]">
        By continuing, you agree to Scribe’s <button type="button" className="underline decoration-[#c9c5d1] underline-offset-2 hover:text-[#777382]">Terms</button> and <button type="button" className="underline decoration-[#c9c5d1] underline-offset-2 hover:text-[#777382]">Privacy Policy</button>.
      </p>
    </section>
  );
}

function GoogleLogo() {
  return <svg aria-hidden="true" viewBox="0 0 48 48" className="size-[15px] shrink-0"><path fill="#4285F4" d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5h6.7c3.9-3.6 6-8.9 6-14.9Z"/><path fill="#34A853" d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5c-1.8 1.2-4.1 1.9-6.8 1.9-5.2 0-9.6-3.5-11.2-8.2H5.9v5.2A20 20 0 0 0 24 44Z"/><path fill="#FBBC05" d="M12.8 27.9a12 12 0 0 1 0-7.7V15H5.9a20 20 0 0 0 0 18.1l6.9-5.2Z"/><path fill="#EA4335" d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8A19.3 19.3 0 0 0 24 4 20 20 0 0 0 5.9 15l6.9 5.2C14.4 15.5 18.8 12 24 12Z"/></svg>;
}

function GitHubLogo({ dark }: { dark: boolean }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className={`size-[15px] shrink-0 ${dark ? "text-white" : "text-[#24292f]"}`} fill="currentColor"><path d="M12 .9a11.1 11.1 0 0 0-3.5 21.6c.6.1.8-.3.8-.6v-2.1c-3.3.7-4-1.4-4-1.4-.5-1.3-1.3-1.6-1.3-1.6-1.1-.8.1-.8.1-.8 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.5-2.4 1.2-3.2-.1-.3-.5-1.5.1-3.2 0 0 1-.3 3.3 1.2a11.4 11.4 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.6 1.7.2 2.9.1 3.2.8.8 1.2 1.9 1.2 3.2 0 4.5-2.7 5.5-5.3 5.8.4.3.8 1 .8 2v3.1c0 .3.2.7.8.6A11.1 11.1 0 0 0 12 .9Z"/></svg>;
}

function VerificationPending({ email, dark, accent, onBack, onResend, pending, error, notice }: {
  email: string; dark: boolean; accent: string; onBack: () => void;
  onResend: () => void; pending: boolean; error: string; notice: string;
}) {
  return <section className="flex min-h-0 flex-1 flex-col items-center px-2 pt-[55px] text-center">
    <span className="grid size-[58px] place-items-center rounded-[18px] text-white shadow-lg" style={{ background: `linear-gradient(145deg, color-mix(in srgb, ${accent} 68%, white), ${accent})` }}><Mail size={27} /></span>
    <h1 className="mt-5 text-[19px] font-bold tracking-[-.45px]">Check your inbox</h1>
    <p className="mt-2 max-w-[300px] text-[10.5px] leading-[1.6] text-[#92909e]">We sent a verification link to <strong className="break-all font-semibold text-[#514e5d] dark:text-[#ddd9e7]">{email}</strong>. Open it to verify your email, then come back here and sign in.</p>
    <div className={`mt-5 w-full max-w-[320px] rounded-xl border px-3 py-3 text-left text-[9px] leading-[1.55] ${dark ? "border-[#393644] bg-[#222128] text-[#b8b4c3]" : "border-[#ebe8f3] bg-[#faf9fc] text-[#858391]"}`}>The extension popup may close when you open the email. That’s okay: verify in your browser, then reopen Scribe to sign in.</div>
    {error && <p role="alert" className="mt-3 max-w-[310px] text-[9px] text-[#bb4c5a]">{error}</p>}
    {notice && <p role="status" className="mt-3 max-w-[310px] text-[9px] text-[#43896d]">{notice}</p>}
    <button type="button" disabled={pending} onClick={onResend} className="mt-5 text-[9.5px] font-semibold hover:underline disabled:opacity-50" style={{ color: accent }}>{pending ? "Sending…" : "Resend verification email"}</button>
    <button type="button" onClick={onBack} className="mt-4 rounded-lg px-3 py-2 text-[9px] text-[#8b8997] hover:bg-black/5 dark:hover:bg-white/5">Back to sign in</button>
  </section>;
}
