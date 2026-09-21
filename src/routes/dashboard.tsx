import { createFileRoute, redirect } from "@tanstack/react-router";
import { Bell, BookOpen, CalendarDays, LayoutDashboard, LockKeyhole, ScanSearch, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import BulkBlockDeals from "@/components/dashboard/BulkBlockDeals";
import StatsCards from "@/components/dashboard/StatsCards";
import ResearchList from "@/components/dashboard/ResearchList";
import Watchlist from "@/components/dashboard/Watchlist";
import MarketPulse from "@/components/dashboard/MarketPulse";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) throw redirect({ to: "/auth/login" });
    return { userId: session.user.id, displayName: session.user.user_metadata?.full_name ?? session.user.email ?? "Member" };
  },
  component: MemberDashboard,
  head: () => ({ meta: [{ title: "Research dashboard | Nivesh Yukti" }] }),
});

function MemberDashboard() {
  const { userId, displayName } = Route.useRouteContext();
  return <main className="min-h-screen bg-background px-4 py-6 md:py-10"><div className="mx-auto max-w-7xl">
    <div className="flex flex-col justify-between gap-4 border-b border-border pb-6 sm:flex-row sm:items-center"><div><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-purple"><LayoutDashboard className="h-4 w-4" /> Signed-in research desk</p><h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-foreground md:text-4xl">Welcome, {displayName}</h1><p className="mt-2 text-sm text-muted-foreground">Research tools and official market data for your independent review.</p></div><div className="flex flex-wrap gap-2"><a href="/screener" className="inline-flex items-center gap-2 rounded-xl bg-brand-blue px-4 py-2.5 text-sm font-bold text-white hover:opacity-90"><ScanSearch className="h-4 w-4" /> Stock screener</a><a href="/ipo" className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2.5 text-sm font-bold text-foreground hover:bg-muted"><CalendarDays className="h-4 w-4" /> IPO tracker</a></div></div>
    <nav className="mt-5 flex gap-4 overflow-x-auto border-b border-border text-sm font-semibold text-muted-foreground"><a href="#market-overview" className="shrink-0 border-b-2 border-brand-blue px-1 pb-3 text-brand-blue">Markets</a><a href="#watchlist" className="shrink-0 px-1 pb-3 hover:text-foreground">Watchlist</a><a href="#bulk-block-deals" className="shrink-0 px-1 pb-3 hover:text-foreground">Bulk / Block deals</a><a href="#research-library" className="shrink-0 px-1 pb-3 hover:text-foreground">Research library</a><a href="#ipo-watchlist" className="shrink-0 px-1 pb-3 hover:text-foreground">IPO</a></nav>
    <section className="mt-7 overflow-hidden rounded-3xl border border-amber-400/50 bg-slate-900 p-5 text-white shadow-[var(--shadow-card)] md:p-7"><div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center"><div className="max-w-2xl"><p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-amber-300"><Sparkles className="h-4 w-4" /> Pro research preview</p><h2 className="mt-3 text-2xl font-extrabold md:text-3xl">Your Pro workspace will appear here.</h2><p className="mt-2 text-sm leading-6 text-slate-300">Live research calls, performance records and subscription checkout are not active yet. The planned ₹1, 7-day trial is shown only after Research Analyst registration, disclosures and payment controls are live.</p></div><div className="min-w-[240px] rounded-2xl border border-white/15 bg-white/10 p-4"><p className="text-sm font-bold">Subscription status</p><p className="mt-2 text-lg font-extrabold text-amber-300">Not available yet</p><button type="button" disabled className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-white/15 px-4 py-2.5 text-sm font-bold text-white/60"><LockKeyhole className="h-4 w-4" /> Trial pending launch</button></div></div></section>
    <div className="mt-7"><StatsCards /></div>
    <div className="mt-7"><MarketPulse userId={userId} /></div>
    <div className="mt-7"><BulkBlockDeals userId={userId} /></div>
    <div className="mt-7 grid gap-6 lg:grid-cols-2"><div id="research-library"><ResearchList /></div><div id="ipo-watchlist"><Watchlist /></div></div>
    <section className="mt-7 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"><div className="flex items-start gap-3"><Bell className="mt-0.5 h-5 w-5 text-brand-blue" /><div><h2 className="font-bold text-foreground">Research and disclosure reminder</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Bulk/Block Deal activity, screener outputs and IPO records are informational. Validate data from official exchange/company disclosures before publishing or acting on an opinion.</p><a href="/disclosures" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline">Read important disclosures <BookOpen className="h-3.5 w-3.5" /></a></div></div></section>
  </div></main>;
}
