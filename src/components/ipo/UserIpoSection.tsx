import { useEffect, useMemo, useState } from "react";
import {
  getLatestIpoSyncRun,
  getPublishedIpos,
  type IpoRecord,
  type IpoSyncRun,
} from "@/lib/supabase/ipo";
import { supabase } from "@/lib/supabase/client";

type BoardFilter = "all" | "mainboard" | "sme";
type DisplayStatus = "open" | "upcoming" | "past";

type DisplayRow = {
  item: IpoRecord;
  board: Exclude<BoardFilter, "all">;
  displayStatus: DisplayStatus;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export default function UserIpoSection() {
  const [items, setItems] = useState<IpoRecord[]>([]);
  const [latestSync, setLatestSync] = useState<IpoSyncRun | null>(null);
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
  const [feedback, setFeedback] = useState("Loading IPO dashboard...");

  useEffect(() => {
    let mounted = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const [ipoRows, syncRow] = await Promise.all([getPublishedIpos(), getLatestIpoSyncRun()]);
        if (!mounted) return;
        setItems(ipoRows);
        setLatestSync(syncRow);
        setFeedback(`Showing ${ipoRows.length} published IPO records.`);
      } catch (error) {
        if (!mounted) return;
        setFeedback(getErrorMessage(error, "Unable to load IPO dashboard."));
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

    // Keep the public dashboard in sync with scheduled feed runs and admin edits
    // without requiring visitors to reload the page.
    const channel = supabase
      .channel("published-ipo-dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "ipo_entries" }, scheduleRefresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "ipo_sync_runs" }, scheduleRefresh)
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

  const rows = useMemo<DisplayRow[]>(() => {
    const now = startOfToday();
    const next14 = new Date(now.getTime() + 14 * DAY_MS);

    const mapped = items
      .map((item) => {
        const board = getBoardType(item);
        const status = getDisplayStatus(item, now, next14);
        if (status === null) return null;
        return { item, board, displayStatus: status };
      })
      .filter((value): value is DisplayRow => value !== null)
      .filter((row) => boardFilter === "all" || row.board === boardFilter);

    const openMainboard = mapped
      .filter((row) => row.displayStatus === "open" && row.board === "mainboard")
      .sort((a, b) => compareDateAsc(a.item.issue_open_date, b.item.issue_open_date));

    const openSme = mapped
      .filter((row) => row.displayStatus === "open" && row.board === "sme")
      .sort((a, b) => compareDateAsc(a.item.issue_open_date, b.item.issue_open_date));

    const upcomingTwoWeeks = mapped
      .filter((row) => row.displayStatus === "upcoming")
      .sort((a, b) => {
        const dateSort = compareDateAsc(a.item.issue_open_date, b.item.issue_open_date);
        if (dateSort !== 0) return dateSort;
        if (a.board === b.board) return 0;
        return a.board === "mainboard" ? -1 : 1;
      });

    const past = mapped
      .filter((row) => row.displayStatus === "past")
      .sort((a, b) => {
        const listingSort = compareDateDesc(a.item.listing_date, b.item.listing_date);
        if (listingSort !== 0) return listingSort;
        return compareDateDesc(a.item.issue_open_date, b.item.issue_open_date);
      });

    // Required order: open (mainboard first), then upcoming next 2 weeks, then past IPOs.
    return [...openMainboard, ...openSme, ...upcomingTwoWeeks, ...past];
  }, [boardFilter, items]);

  const stats = useMemo(() => {
    const now = startOfToday();
    const next14 = new Date(now.getTime() + 14 * DAY_MS);

    const open = items.filter((item) => isOpenIpo(item, now)).length;
    const upcomingTwoWeeks = items.filter((item) => isUpcomingWithin(item, now, next14)).length;
    const past = items.filter((item) => isPastIpo(item, now)).length;
    const listed = items.filter((item) => item.status === "listed" || isListedByDate(item, now)).length;

    return { open, upcomingTwoWeeks, past, listed };
  }, [items]);

  const sourceLabel = useMemo(() => {
    const labels = Array.from(
      new Set(items.map((item) => item.source_name).filter((value): value is string => Boolean(value && value.trim())))
    );
    if (labels.length === 0) return "manual";
    if (labels.length <= 2) return labels.join(" + ");
    return `${labels.slice(0, 2).join(" + ")} +${labels.length - 2}`;
  }, [items]);

  return (
    <section className="glass-strong rounded-3xl border border-border p-5 shadow-[var(--shadow-soft)] lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">IPO Dashboard</h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {(["all", "mainboard", "sme"] as BoardFilter[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setBoardFilter(tab)}
                className={`rounded-full px-5 py-2 text-base font-semibold capitalize ${
                  boardFilter === tab
                    ? "bg-gradient-brand text-white shadow-[var(--shadow-soft)]"
                    : "border border-border bg-card/80 text-foreground/75 hover:bg-card hover:text-foreground"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/85 px-4 py-3 text-sm text-foreground">
          <p>
            <span className="font-semibold text-foreground">Source:</span> {sourceLabel}
          </p>
          <p className="mt-1">
            <span className="font-semibold text-foreground">Last Sync:</span>{" "}
            {latestSync ? new Date(latestSync.ran_at).toLocaleString() : "Not synced yet"}
          </p>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        <StatCard title="Open IPOs" value={stats.open} />
        <StatCard title="Upcoming (14 days)" value={stats.upcomingTwoWeeks} />
        <StatCard title="Past IPOs" value={stats.past} />
        <StatCard title="Listed IPOs" value={stats.listed} />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/90">
          <div className="flex items-center justify-between border-b border-border bg-muted/35 px-4 py-3">
            <h3 className="text-2xl font-semibold text-foreground sm:text-3xl">Open, Upcoming, and Past IPOs</h3>
            <span className="text-sm text-muted-foreground">{feedback}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Company Name</th>
                  <th className="px-4 py-3 font-semibold">Type</th>
                  <th className="px-4 py-3 font-semibold">Open Date</th>
                  <th className="px-4 py-3 font-semibold">Close Date</th>
                  <th className="px-4 py-3 font-semibold">Issue Price</th>
                  <th className="px-4 py-3 font-semibold">Subscription</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                      No IPO rows match this filter.
                    </td>
                  </tr>
                ) : (
                  rows.map((row) => (
                    <tr key={row.item.id} className="border-b border-border/60 text-foreground last:border-b-0">
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{row.item.company_name}</div>
                        <div className="mt-1 text-xs text-muted-foreground">{statusLabel(row.displayStatus)}</div>
                      </td>
                      <td className="px-4 py-3 capitalize">{row.board}</td>
                      <td className="px-4 py-3">{formatDate(row.item.issue_open_date)}</td>
                      <td className="px-4 py-3">{formatDate(row.item.issue_close_date)}</td>
                      <td className="px-4 py-3">{row.item.price_band ?? "TBA"}</td>
                      <td className="px-4 py-3">{row.item.subscription ?? "--"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-card/90">
          <div className="border-b border-border bg-muted/35 px-5 py-4">
            <h3 className="text-3xl font-semibold text-foreground">Quick Navigation</h3>
          </div>
          <ul className="divide-y divide-border text-xl">
            <li className="px-5 py-4 text-foreground">All IPOs</li>
            <li className="px-5 py-4 text-foreground">Open IPOs</li>
            <li className="bg-muted/30 px-5 py-4 font-medium text-brand-purple">Upcoming IPOs</li>
            <li className="px-5 py-4 text-foreground">Past IPOs</li>
            <li className="px-5 py-4 text-foreground">IPO GMP</li>
          </ul>
        </div>
      </div>
    </section>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl border border-border bg-card/90 px-5 py-4">
      <p className="text-base font-semibold text-muted-foreground">{title}</p>
      <p className="mt-3 text-5xl font-bold text-foreground">{value}</p>
    </div>
  );
}

function getBoardType(item: IpoRecord): Exclude<BoardFilter, "all"> {
  const text = `${item.company_name} ${item.summary ?? ""} ${item.source_name ?? ""}`.toLowerCase();
  return text.includes("sme") ? "sme" : "mainboard";
}

function getDisplayStatus(item: IpoRecord, now: Date, next14: Date): DisplayStatus | null {
  if (isOpenIpo(item, now)) return "open";
  if (isUpcomingWithin(item, now, next14)) return "upcoming";
  if (isPastIpo(item, now)) return "past";
  return null;
}

function isOpenIpo(item: IpoRecord, now: Date): boolean {
  if (item.status === "open") return true;
  const openDate = parseDate(item.issue_open_date);
  const closeDate = parseDate(item.issue_close_date);
  if (!openDate || !closeDate) return false;
  return openDate <= now && closeDate >= now;
}

function isUpcomingWithin(item: IpoRecord, now: Date, next14: Date): boolean {
  const openDate = parseDate(item.issue_open_date);
  if (!openDate) return false;
  if (openDate < now) return false;
  if (openDate > next14) return false;
  return item.status !== "listed" && item.status !== "closed";
}

function isPastIpo(item: IpoRecord, now: Date): boolean {
  if (item.status === "closed" || item.status === "listed") return true;
  const closeDate = parseDate(item.issue_close_date);
  const listingDate = parseDate(item.listing_date);
  if (listingDate && listingDate < now) return true;
  if (closeDate && closeDate < now) return true;
  return false;
}

function isListedByDate(item: IpoRecord, now: Date): boolean {
  const listingDate = parseDate(item.listing_date);
  return Boolean(listingDate && listingDate <= now);
}

function parseDate(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
}

function startOfToday(): Date {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function compareDateAsc(a: string | null, b: string | null): number {
  const aDate = parseDate(a);
  const bDate = parseDate(b);
  if (!aDate && !bDate) return 0;
  if (!aDate) return 1;
  if (!bDate) return -1;
  return aDate.getTime() - bDate.getTime();
}

function compareDateDesc(a: string | null, b: string | null): number {
  return compareDateAsc(b, a);
}

function formatDate(value: string | null): string {
  const parsed = parseDate(value);
  if (!parsed) return "TBA";
  return parsed.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function statusLabel(value: DisplayStatus): string {
  if (value === "open") return "Open IPO";
  if (value === "upcoming") return "Upcoming (Next 14 Days)";
  return "Past IPO";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
