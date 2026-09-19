import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/auth/login")({ component: LoginPage });

function LoginPage() {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function sendPhoneOtp() {
    setErrorMessage(null);
    setInfoMessage(null);
    const digits = phone.replace(/\D/g, "");
    const e164Phone = digits.length === 10 ? `+91${digits}` : phone.trim();
    if (!/^\+[1-9]\d{7,14}$/.test(e164Phone)) {
      setErrorMessage("Enter a valid mobile number, including country code (for example +91 98765 43210).");
      return;
    }
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOtp({ phone: e164Phone, options: { channel: "sms" } });
    if (error) {
      console.error("OTP sign-in error:", error);
      setErrorMessage(error.message || "Unable to send OTP to this mobile number.");
      setIsLoading(false);
      return;
    }
    setPhone(e164Phone);
    setOtpSent(true);
    setInfoMessage("OTP sent. Enter the 6-digit code from your SMS.");
    setIsLoading(false);
  }

  async function verifyPhoneOtp() {
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);
    const { error } = await supabase.auth.verifyOtp({ phone, token: otp.trim(), type: "sms" });
    if (error) {
      setErrorMessage(error.message || "That verification code is invalid or has expired.");
      setIsLoading(false);
      return;
    }
    window.location.assign("/auth/callback");
  }

  async function signInWithGoogle() {
    setErrorMessage(null);
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      console.error("OAuth sign-in error:", error);
      setErrorMessage(error.message || "Unable to start Google sign-in.");
      setIsLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 shadow-lg">
        <h1 className="mb-4 text-2xl font-semibold">Sign in to Nivesh Yukti</h1>
        <p className="mb-4 text-sm text-muted-foreground">Use mobile OTP to access your account. Super admins can also sign in with Google.</p>
        {errorMessage ? <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{errorMessage}</div> : null}
        {infoMessage ? <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{infoMessage}</div> : null}

        {!otpSent ? <>
          <label className="mb-3 block text-sm font-medium text-foreground">Mobile number
            <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+91 98765 43210" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <button onClick={sendPhoneOtp} disabled={isLoading || !phone} className="mb-4 w-full rounded-xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700">{isLoading ? "Sending OTP…" : "Send OTP"}</button>
        </> : <>
          <label className="mb-3 block text-sm font-medium text-foreground">Verification code
            <input inputMode="numeric" autoComplete="one-time-code" value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6-digit OTP" className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-base tracking-[0.3em] text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
          </label>
          <button onClick={verifyPhoneOtp} disabled={isLoading || otp.length < 6} className="mb-3 w-full rounded-xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700">{isLoading ? "Verifying…" : "Verify and sign in"}</button>
          <button type="button" onClick={() => { setOtpSent(false); setOtp(""); setInfoMessage(null); }} className="mb-4 w-full text-sm font-medium text-muted-foreground hover:text-foreground">Use a different number</button>
        </>}

        <div className="mb-6 h-px bg-border" />
        <button onClick={signInWithGoogle} disabled={isLoading} className="w-full rounded-xl border border-slate-900 bg-white px-5 py-3 text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-400 disabled:text-slate-400">{isLoading ? "Redirecting to Google…" : "Sign in with Google"}</button>
      </div>
    </div>
  );
}
