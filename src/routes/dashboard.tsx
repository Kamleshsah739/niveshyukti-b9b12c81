import { createFileRoute, redirect } from "@tanstack/react-router";
import { Bell, BookOpen, CalendarDays, LayoutDashboard, ScanSearch } from "lucide-react";
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
    <div className="mt-7"><StatsCards /></div>
    <div className="mt-7"><MarketPulse userId={userId} /></div>
    <div className="mt-7"><BulkBlockDeals userId={userId} /></div>
    <div className="mt-7 grid gap-6 lg:grid-cols-2"><div id="research-library"><ResearchList /></div><div id="ipo-watchlist"><Watchlist /></div></div>
    <section className="mt-7 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"><div className="flex items-start gap-3"><Bell className="mt-0.5 h-5 w-5 text-brand-blue" /><div><h2 className="font-bold text-foreground">Research and disclosure reminder</h2><p className="mt-1 text-sm leading-6 text-muted-foreground">Bulk/Block Deal activity, screener outputs and IPO records are informational. Validate data from official exchange/company disclosures before publishing or acting on an opinion.</p><a href="/disclosures" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline">Read important disclosures <BookOpen className="h-3.5 w-3.5" /></a></div></div></section>
  </div></main>;
}
