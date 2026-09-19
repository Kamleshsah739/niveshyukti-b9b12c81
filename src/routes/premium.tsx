import { createFileRoute, redirect } from "@tanstack/react-router";
import { Crown, FileText, LockKeyhole, Sparkles, TrendingUp } from "lucide-react";
import { getAccessLevel } from "@/lib/access";
import { supabase } from "@/lib/supabase/client";

export const Route = createFileRoute("/premium")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/login" });

    const access = await getAccessLevel(session.user.id);
    if (access !== "premium" && access !== "super_admin") throw redirect({ to: "/" });
  },
  component: PremiumPage,
});

const reports = [
  { category: "Equity research", title: "High-quality compounders: July review", detail: "Valuation, growth runway and key risks", icon: TrendingUp },
  { category: "Market outlook", title: "Weekly market positioning note", detail: "Levels, sector trends and event calendar", icon: Sparkles },
  { category: "Portfolio", title: "Premium portfolio review framework", detail: "Risk, allocation and rebalancing checklist", icon: FileText },
];

function PremiumPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:py-12">
      <div className="mx-auto max-w-6xl">
        <a href="/" className="text-sm font-semibold text-brand-blue hover:underline">← Back to Nivesh Yukti</a>
        <section className="mt-5 overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#071b18,#17463e)] p-7 text-white shadow-[var(--shadow-glow)] md:p-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-cyan"><Crown className="h-5 w-5" /> Premium member access</div>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight md:text-5xl">Your premium research desk.</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 md:text-base">Member-only research, detailed analysis, and premium portfolio resources are available here. This page is protected for active subscribers.</p>
        </section>
        <div className="mt-7 grid gap-4 md:grid-cols-3">{reports.map(({ category, title, detail, icon: Icon }) => <article key={title} className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]"><div className="grid h-11 w-11 place-items-center rounded-xl bg-secondary text-brand-blue"><Icon className="h-5 w-5" /></div><p className="mt-5 text-xs font-bold uppercase tracking-wider text-brand-purple">{category}</p><h2 className="mt-2 text-lg font-bold text-foreground">{title}</h2><p className="mt-2 text-sm text-muted-foreground">{detail}</p><button className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue">Open premium report <LockKeyhole className="h-3.5 w-3.5" /></button></article>)}</div>
      </div>
    </main>
  );
}
