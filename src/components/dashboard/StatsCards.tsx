import { useEffect, useMemo, useState } from "react";
import { Bell, FileText, Landmark, Star } from "lucide-react";
import { getPublishedIpos, type IpoRecord } from "@/lib/supabase/ipo";
import { getResearchReports } from "@/lib/supabase/research";
import { supabase } from "@/lib/supabase/client";

type DashboardStats = {
  researchCount: number;
  activeIpoCount: number;
  upcomingIpoCount: number;
  updateCount: number;
};

const initialStats: DashboardStats = {
  researchCount: 0,
  activeIpoCount: 0,
  upcomingIpoCount: 0,
  updateCount: 0,
};

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export default function StatsCards() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);

  useEffect(() => {
    let mounted = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const [researchRows, ipoRows] = await Promise.all([getResearchReports(), getPublishedIpos()]);
        if (!mounted) return;

        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const upcomingEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

        const activeIpoCount = ipoRows.filter((row) => isOpenIpo(row, now)).length;
        const upcomingIpoCount = ipoRows.filter((row) => isUpcomingIpo(row, now, upcomingEnd)).length;

        setStats({
          researchCount: researchRows.length,
          activeIpoCount,
          upcomingIpoCount,
          updateCount: researchRows.filter((row) => row.published).length,
        });
      } catch {
        if (!mounted) return;
        setStats(initialStats);
      }
    };

    const scheduleRefresh = () => {
      if (refreshTimeout) return;
      refreshTimeout = setTimeout(() => {
        refreshTimeout = undefined;
        void load();
      }, 300);
    };

    void load();

    const channel = supabase
      .channel("dashboard-stats")
      .on("postgres_changes", { event: "*", schema: "public", table: "ipo_entries" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "ipo_sync_runs" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "research_reports" }, scheduleRefresh)
      .subscribe();

    const refreshInterval = setInterval(() => {
      void load();
    }, REFRESH_INTERVAL_MS);

    return () => {
      mounted = false;
      clearInterval(refreshInterval);
      if (refreshTimeout) clearTimeout(refreshTimeout);
      void supabase.removeChannel(channel);
    };
  }, []);

  const cards = useMemo(
    () => [
      { title: "Research Reports", value: String(stats.researchCount), icon: FileText },
      { title: "Active IPOs", value: String(stats.activeIpoCount), icon: Landmark },
      { title: "Upcoming (14d)", value: String(stats.upcomingIpoCount), icon: Star },
      { title: "Published Updates", value: String(stats.updateCount), icon: Bell },
    ],
    [stats],
  );

  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div key={card.title} className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
            <Icon className="mb-4 text-brand-blue" />
            <h3 className="text-muted-foreground">{card.title}</h3>
            <p className="mt-2 text-3xl font-bold text-foreground">{card.value}</p>
          </div>
        );
      })}
    </div>
  );
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function isOpenIpo(item: IpoRecord, now: Date): boolean {
  if (item.status === "open") return true;
  const openDate = parseDate(item.issue_open_date);
  const closeDate = parseDate(item.issue_close_date);
  if (!openDate || !closeDate) return false;
  return openDate <= now && closeDate >= now;
}

function isUpcomingIpo(item: IpoRecord, now: Date, upcomingEnd: Date): boolean {
  const openDate = parseDate(item.issue_open_date);
  if (!openDate) return false;
  return openDate >= now && openDate <= upcomingEnd && item.status !== "listed" && item.status !== "closed";
}
