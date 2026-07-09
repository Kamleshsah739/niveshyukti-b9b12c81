import { createFileRoute } from "@tanstack/react-router";
import React, { useEffect } from "react";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/auth/callback")({
  component: CallbackPage,
});

function CallbackPage() {
  useEffect(() => {
    (async () => {
      try {
        const SUPER_ADMIN_EMAIL =
          import.meta.env.VITE_SUPABASE_SUPER_ADMIN_EMAIL ?? "kamleshsah739@gmail.com";
        const DEFAULT_ROLE = "user";
        const ADMIN_ROLE = "super_admin";

        // Handle different OAuth callback styles:
        // 1) Authorization code in query (?code=...)
        // 2) Implicit/hash tokens (#access_token=...)
        // 3) Fallback to existing session
        let session = null;

        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("exchangeCodeForSession error:", error);
            window.location.replace("/auth/login");
            return;
          }
          session = data?.session ?? null;
        } else if (window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.replace("#", ""));
          const access_token = hashParams.get("access_token");
          const refresh_token = hashParams.get("refresh_token");

          if (access_token) {
            const { data, error } = await supabase.auth.setSession({
              access_token,
              refresh_token: refresh_token ?? undefined,
            });
            if (error) {
              console.error("setSession error:", error);
              window.location.replace("/auth/login");
              return;
            }
            session = data?.session ?? null;
          }
        } else {
          const { data } = await supabase.auth.getSession();
          session = data?.session ?? null;
        }

        if (!session) {
          window.location.replace("/auth/login");
          return;
        }

        const email = session.user.email ?? "";
        const fullName = session.user.user_metadata?.full_name ?? null;
        const avatarUrl = session.user.user_metadata?.avatar_url ?? null;

        const { data: existingProfile, error: profileError } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) {
          console.error("profile load error:", profileError);
        }

        const desiredRole =
          email === SUPER_ADMIN_EMAIL ? ADMIN_ROLE : existingProfile?.role ?? DEFAULT_ROLE;
        const shouldUpsert =
          !existingProfile || existingProfile.role !== desiredRole;

        if (shouldUpsert) {
          const { error: upsertError } = await supabase.from("profiles").upsert(
            {
              id: session.user.id,
              email,
              full_name: fullName,
              avatar_url: avatarUrl,
              role: desiredRole,
            },
            { onConflict: "id" },
          );

          if (upsertError) {
            console.error("profile upsert error:", upsertError);
          }
        }

        if (desiredRole === ADMIN_ROLE) {
          window.location.replace("/admin");
          return;
        }

        window.location.replace("/dashboard");
      } catch (e) {
        console.error(e);
        window.location.replace("/auth/login");
      }
    })();
  }, []);

  return <div className="flex min-h-screen items-center justify-center">Signing you in…</div>;
}