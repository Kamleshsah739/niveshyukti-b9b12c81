import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/auth/login")({
  component: LoginPage,
});

function LoginPage() {
  const [phone, setPhone] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const superAdminEmail = import.meta.env.VITE_SUPABASE_SUPER_ADMIN_EMAIL ?? "kamleshsah739@gmail.com";

  async function signInWithPhone() {
    setErrorMessage(null);
    setInfoMessage(null);
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        channel: "sms",
      },
    });

    if (error) {
      console.error("OTP sign-in error:", error);
      setErrorMessage(error.message || "Unable to send OTP to this mobile number.");
      setIsLoading(false);
      return;
    }

    setInfoMessage("OTP sent to your mobile number. Enter it in your SMS app to complete login.");
    setIsLoading(false);
  }

  async function signInWithGoogle() {
    setErrorMessage(null);
    setIsLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
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
        <p className="mb-4 text-sm text-muted-foreground">
          Mobile login is available for normal users only. If you are the super admin, please sign in with <span className="font-medium">Google</span>.
        </p>

        {errorMessage ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {infoMessage ? (
          <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
            {infoMessage}
          </div>
        ) : null}

        <label className="mb-3 block text-sm font-medium text-foreground">
          Mobile number
          <input
            type="tel"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            placeholder="+91 98765 43210"
            className="mt-2 w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
        </label>

        <button
          onClick={signInWithPhone}
          disabled={isLoading || !phone}
          className="mb-4 w-full rounded-xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-700"
        >
          {isLoading ? "Sending OTP…" : "Login with Mobile"}
        </button>

        <div className="mb-6 h-px bg-border" />

        <button
          onClick={signInWithGoogle}
          disabled={isLoading}
          className="w-full rounded-xl border border-slate-900 bg-white px-5 py-3 text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:border-slate-400 disabled:text-slate-400"
        >
          {isLoading ? "Redirecting to Google…" : "Sign in with Google"}
        </button>
      </div>
    </div>
  );
}