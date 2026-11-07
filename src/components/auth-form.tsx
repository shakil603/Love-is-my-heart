"use client";

import {
  ArrowLeft,
  ArrowRight,
  Check,
  Heart,
  LoaderCircle,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Logo } from "@/components/ui";
import { authClient } from "@/lib/auth-client";

type Mode = "signin" | "join";

function errorMessage(error: unknown) {
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: string }).message);
  }
  return "Something went wrong. Please try again.";
}

export function AuthForm({
  mode,
  next,
  demoMode,
}: {
  mode: Mode;
  next?: string;
  demoMode: boolean;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [adult, setAdult] = useState(false);
  const [busy, setBusy] = useState(false);
  const [demoBusy, setDemoBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [resetOpen, setResetOpen] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (mode === "join") {
      if (password.length < 8) return setError("Use at least 8 characters for your password");
      if (password !== confirm) return setError("The two passwords do not match");
      if (!adult) return setError("Love Is My Heart is for adults aged 18 and over");
    }

    setBusy(true);
    try {
      const result =
        mode === "join"
          ? await authClient.signUp.email({ email, password, name: name.trim() })
          : await authClient.signIn.email({ email, password });
      if (result.error) {
        setError(errorMessage(result.error));
        return;
      }
      router.push(mode === "join" ? "/onboarding" : (next || "/app"));
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  async function demoLogin() {
    setError(null);
    setDemoBusy(true);
    try {
      const response = await fetch("/api/demo/session", { method: "POST" });
      if (!response.ok) {
        const data = (await response.json()) as { error?: string };
        throw new Error(data.error || "The demo is unavailable");
      }
      router.push("/app");
      router.refresh();
    } catch (caught) {
      setError(errorMessage(caught));
      setDemoBusy(false);
    }
  }

  async function sendReset(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      if (result.error) setError(errorMessage(result.error));
      else setResetSent(true);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <div className="auth-visual-top">
          <Link href="/" aria-label="Love Is My Heart home">
            <Logo />
          </Link>
          <Link className="auth-back" href="/">
            <ArrowLeft size={15} /> Back to Love Is My Heart
          </Link>
        </div>
        <div className="auth-visual-copy">
          <span className="eyebrow">
            <Sparkles size={14} /> Dating, with intention
          </span>
          <h1>
            Meet people
            <br />
            through what
            <br />
            <em>moves them.</em>
          </h1>
          <p>
            A small, real community built around honest intentions, shared interests and
            conversations with somewhere to go.
          </p>
        </div>
        <ul className="auth-proof">
          <li>
            <ShieldCheck size={18} /> Your choices stay private
          </li>
          <li>
            <Heart size={18} /> No like counts, no countdowns
          </li>
          <li>
            <LockKeyhole size={18} /> You decide your pace
          </li>
        </ul>
        <span className="auth-visual-orbit" aria-hidden="true" />
      </section>

      <section className="auth-panel">
        <div className="auth-card">
          <Link href="/" className="auth-mobile-logo" aria-label="Love Is My Heart home">
            <Logo dark />
          </Link>

          {resetOpen ? (
            resetSent ? (
              <>
                <span className="eyebrow dark">Check your inbox</span>
                <h2>Reset link sent.</h2>
                <p className="auth-lead">
                  If an account exists for {email}, a reset link is on its way. It stays
                  valid for one hour.
                </p>
                <button className="button button-dark auth-submit" onClick={() => setResetOpen(false)}>
                  Back to sign in <ArrowRight size={17} />
                </button>
              </>
            ) : (
              <>
                <span className="eyebrow dark">A way back in</span>
                <h2>Reset your password.</h2>
                <p className="auth-lead">
                  Enter the email you signed up with and we will send a single-use reset link.
                </p>
                <form onSubmit={sendReset} className="auth-form">
                  <label>
                    Email
                    <div className="auth-input">
                      <Mail size={17} />
                      <input
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                  </label>
                  {error ? <p className="form-error">{error}</p> : null}
                  <button className="button button-dark auth-submit" disabled={busy}>
                    {busy ? <LoaderCircle className="spin" size={18} /> : <Mail size={18} />}
                    Send reset link
                  </button>
                  <button type="button" className="text-link dark auth-switch" onClick={() => setResetOpen(false)}>
                    I remember it — sign in instead
                  </button>
                </form>
              </>
            )
          ) : (
            <>
              <span className="eyebrow dark">
                {mode === "join" ? "Your first step" : "Welcome back"}
              </span>
              <h2>{mode === "join" ? "Create your LIMH account." : "Sign in to your space."}</h2>
              <p className="auth-lead">
                {mode === "join"
                  ? "Two minutes now, one honest profile. You can refine everything later."
                  : "Pick up your conversations, your edit and your matches."}
              </p>

              <form onSubmit={submit} className="auth-form">
                {mode === "join" ? (
                  <label>
                    First name
                    <div className="auth-input">
                      <UserRound size={17} />
                      <input
                        autoComplete="given-name"
                        required
                        maxLength={40}
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder="How people will meet you"
                      />
                    </div>
                  </label>
                ) : null}

                <label>
                  Email
                  <div className="auth-input">
                    <Mail size={17} />
                    <input
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="you@example.com"
                    />
                  </div>
                </label>

                <label>
                  Password
                  <div className="auth-input">
                    <LockKeyhole size={17} />
                    <input
                      type="password"
                      autoComplete={mode === "join" ? "new-password" : "current-password"}
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      placeholder={mode === "join" ? "At least 8 characters" : "Your password"}
                    />
                  </div>
                </label>

                {mode === "join" ? (
                  <>
                    <label>
                      Confirm password
                      <div className="auth-input">
                        <Check size={17} />
                        <input
                          type="password"
                          autoComplete="new-password"
                          required
                          minLength={8}
                          value={confirm}
                          onChange={(event) => setConfirm(event.target.value)}
                          placeholder="One more time"
                        />
                      </div>
                    </label>
                    <label className="auth-check">
                      <input
                        type="checkbox"
                        checked={adult}
                        onChange={(event) => setAdult(event.target.checked)}
                      />
                      <span>I am 18 or older and agree to be kind and honest here.</span>
                    </label>
                  </>
                ) : (
                  <button type="button" className="auth-forgot" onClick={() => setResetOpen(true)}>
                    Forgot your password?
                  </button>
                )}

                {error ? <p className="form-error">{error}</p> : null}

                <button className="button button-dark button-large auth-submit" disabled={busy}>
                  {busy ? <LoaderCircle className="spin" size={18} /> : null}
                  {mode === "join" ? "Create my account" : "Sign in"}
                  {!busy ? <ArrowRight size={18} /> : null}
                </button>
              </form>

              {demoMode ? (
                <button className="auth-demo" onClick={demoLogin} disabled={demoBusy}>
                  {demoBusy ? <LoaderCircle className="spin" size={17} /> : <Sparkles size={17} />}
                  Explore the live demo instead
                  <small>Signs you into a sample account with a few ready-made matches.</small>
                </button>
              ) : null}

              <p className="auth-foot">
                {mode === "join" ? (
                  <>
                    Already have a space?{" "}
                    <Link href="/signin">Sign in</Link>
                  </>
                ) : (
                  <>
                    New to Love Is My Heart? <Link href="/join">Create an account</Link>
                  </>
                )}
              </p>

              <p className="auth-legal">
                We store as little as possible: your profile, your choices and your
                conversations. No device location, no ad tracking.
              </p>
            </>
          )}
        </div>
      </section>
    </main>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (password.length < 8) return setError("Use at least 8 characters");
    if (password !== confirm) return setError("The two passwords do not match");
    if (!token) return setError("This reset link is missing a token");
    setBusy(true);
    try {
      const result = await authClient.resetPassword({ newPassword: password, token });
      if (result.error) {
        setError(errorMessage(result.error));
        return;
      }
      setDone(true);
      setTimeout(() => router.push("/signin"), 1600);
    } catch (caught) {
      setError(errorMessage(caught));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page auth-page-simple">
      <section className="auth-panel">
        <div className="auth-card">
          <Link href="/" className="auth-mobile-logo" aria-label="Love Is My Heart home">
            <Logo dark />
          </Link>
          <span className="eyebrow dark">A fresh start</span>
          <h2>{done ? "Password updated." : "Choose a new password."}</h2>
          {done ? (
            <p className="auth-lead">Taking you to sign in with the new password…</p>
          ) : (
            <>
              <p className="auth-lead">Make it long, make it yours, do not reuse it elsewhere.</p>
              <form onSubmit={submit} className="auth-form">
                <label>
                  New password
                  <div className="auth-input">
                    <LockKeyhole size={17} />
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                    />
                  </div>
                </label>
                <label>
                  Confirm password
                  <div className="auth-input">
                    <Check size={17} />
                    <input
                      type="password"
                      required
                      minLength={8}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(event) => setConfirm(event.target.value)}
                    />
                  </div>
                </label>
                {error ? <p className="form-error">{error}</p> : null}
                <button className="button button-dark button-large auth-submit" disabled={busy}>
                  {busy ? <LoaderCircle className="spin" size={18} /> : <Check size={18} />}
                  Save new password
                </button>
              </form>
            </>
          )}
          <p className="auth-foot">
            <Link href="/signin">Back to sign in</Link>
          </p>
        </div>
      </section>
    </main>
  );
}
