import { createFileRoute, redirect } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase/client";
import { useState } from "react";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({
        to: "/auth/login",
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "super_admin") {
      throw redirect({
        to: "/dashboard",
      });
    }
  },

  component: AdminPage,
});

function AdminPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<"public" | "paid">("public");
  const [status, setStatus] = useState<string | null>(null);

  async function publishContent() {
    setStatus("Publishing...");

    const { error } = await supabase.from("published_content").insert([
      {
        title,
        body,
        audience,
        published_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      setStatus(`Failed to publish: ${error.message}`);
      return;
    }

    setTitle("");
    setBody("");
    setStatus("Content published successfully.");
  }

  return (
    <div className="p-10 space-y-8">
      <div>
        <h1 className="text-4xl font-bold">Super Admin Panel</h1>
        <p className="mt-4 max-w-2xl text-base text-muted-foreground">
          Publish research reports on stocks, F&O and commodity recommendations for users.
        </p>
      </div>

      <div className="rounded-3xl border border-border bg-card p-8 shadow-sm">
        <div className="grid gap-6">
          <label className="space-y-2 text-sm font-medium text-foreground">
            Content title
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Research update title"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <label className="space-y-2 text-sm font-medium text-foreground">
            Content body
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder="Write the content you want to publish to users or paid clients."
              className="min-h-[220px] w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              onClick={() => setAudience("public")}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${audience === "public" ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-foreground"}`}
            >
              Publish to normal users
            </button>
            <button
              type="button"
              onClick={() => setAudience("paid")}
              className={`rounded-xl border px-4 py-3 text-sm font-semibold ${audience === "paid" ? "border-primary bg-primary/10 text-primary" : "border-input bg-background text-foreground"}`}
            >
              Publish to paid clients
            </button>
          </div>

          <button
            type="button"
            onClick={publishContent}
            className="rounded-xl bg-slate-900 px-5 py-3 text-white transition hover:bg-slate-800"
          >
            Publish research report
          </button>

          {status ? <p className="text-sm text-muted-foreground">{status}</p> : null}
        </div>
      </div>
    </div>
  );
}