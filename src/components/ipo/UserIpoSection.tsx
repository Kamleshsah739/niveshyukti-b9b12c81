import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CircleCheck,
  ExternalLink,
  Info,
  Landmark,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { getPublishedIpos, type IpoRecord } from "@/lib/supabase/ipo";
import { supabase } from "@/lib/supabase/client";

type BoardFilter = "all" | "mainboard" | "sme";
type DisplayStatus = "open" | "upcoming" | "past";
type ViewFilter = "all" | DisplayStatus;

type DisplayRow = {
  item: IpoRecord;
  board: Exclude<BoardFilter, "all">;
  displayStatus: DisplayStatus;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;
const PAGE_SIZE = 10;

export default function UserIpoSection() {
  const [items, setItems] = useState<IpoRecord[]>([]);
  const [boardFilter, setBoardFilter] = useState<BoardFilter>("all");
  const [viewFilter, setViewFilter] = useState<ViewFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [selectedIpo, setSelectedIpo] = useState<DisplayRow | null>(null);
  const [feedback, setFeedback] = useState("Loading IPO dashboard...");

  useEffect(() => {
    let mounted = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        // Sync history is intentionally private. The public dashboard must only
        // query the published IPO table, otherwise the private log policy hides
        // all IPO records when this Promise fails.
        const ipoRows = await getPublishedIpos();
        if (!mounted) return;
        setItems(ipoRows);
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
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ipo_entries" },
        scheduleRefresh,
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "ipo_sync_runs" },
        scheduleRefresh,
      )
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
      .filter((row) => boardFilter === "all" || row.board === boardFilter)
      .filter((row) => viewFilter === "all" || row.displayStatus === viewFilter)
      .filter((row) => {
        const needle = searchQuery.trim().toLowerCase();
        return (
          !needle ||
          `${row.item.company_name} ${row.item.symbol ?? ""}`.toLowerCase().includes(needle)
        );
      });

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
  }, [boardFilter, items, searchQuery, viewFilter]);

  useEffect(() => {
    setPage(1);
  }, [boardFilter, searchQuery, viewFilter]);

  const totalPages = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const visibleRows = rows.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const stats = useMemo(() => {
    const now = startOfToday();
    const next14 = new Date(now.getTime() + 14 * DAY_MS);

    const open = items.filter((item) => isOpenIpo(item, now)).length;
    const upcomingTwoWeeks = items.filter((item) => isUpcomingWithin(item, now, next14)).length;
    const past = items.filter((item) => isPastIpo(item, now)).length;
    const listed = items.filter(
      (item) => item.status === "listed" || isListedByDate(item, now),
    ).length;

    return { open, upcomingTwoWeeks, past, listed };
  }, [items]);

  const sourceLabel = useMemo(() => {
    const labels = Array.from(
      new Set(
        items
          .map((item) => item.source_name)
          .filter((value): value is string => Boolean(value && value.trim())),
      ),
    );
    if (labels.length === 0) return "manual";
    if (labels.length <= 2) return labels.join(" + ");
    return `${labels.slice(0, 2).join(" + ")} +${labels.length - 2}`;
  }, [items]);

  return (
    <section className="glass-strong rounded-3xl border border-border p-5 shadow-[var(--shadow-soft)] lg:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-2xl">
          <p className="flex items-center gap-2 text-sm font-bold text-brand-blue">
            <Landmark className="h-4 w-4" /> Indian primary market
          </p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            IPO Tracker
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            See what is open now, what is coming next, and recently listed issues. This is
            information for research—not an application recommendation.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/85 px-4 py-3 text-sm text-foreground">
          <p className="flex items-center gap-2 font-semibold">
            <RefreshCw className="h-4 w-4 text-brand-blue" /> Updated automatically
          </p>
          <p className="mt-1 text-xs text-muted-foreground">Free sources: {sourceLabel}</p>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-border bg-card/80 p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-foreground">
          <Search className="h-4 w-4 text-brand-blue" /> Find an IPO
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px_190px_auto]">
          <label className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Search company or symbol"
            />
          </label>
          <select
            value={boardFilter}
            onChange={(event) => setBoardFilter(event.target.value as BoardFilter)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="all">All boards</option>
            <option value="mainboard">Mainboard</option>
            <option value="sme">SME</option>
          </select>
          <select
            value={viewFilter}
            onChange={(event) => setViewFilter(event.target.value as ViewFilter)}
            className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"
          >
            <option value="all">All statuses</option>
            <option value="open">Open now</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Closed / past</option>
          </select>
          <button
            type="button"
            onClick={() => {
              setSearchQuery("");
              setBoardFilter("all");
              setViewFilter("all");
            }}
            className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Clear filters
          </button>
        </div>
      </div>

      <div className="mt-5 grid gap-3 lg:grid-cols-4">
        <StatCard
          title="Open now"
          value={stats.open}
          onClick={() => setViewFilter("open")}
          active={viewFilter === "open"}
        />
        <StatCard
          title="Coming in 14 days"
          value={stats.upcomingTwoWeeks}
          onClick={() => setViewFilter("upcoming")}
          active={viewFilter === "upcoming"}
        />
        <StatCard
          title="Closed / past"
          value={stats.past}
          onClick={() => setViewFilter("past")}
          active={viewFilter === "past"}
        />
        <StatCard
          title="Listed"
          value={stats.listed}
          onClick={() => setViewFilter("all")}
          active={viewFilter === "all"}
        />
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-[1.7fr_1fr]">
        <div className="overflow-hidden rounded-2xl border border-border bg-card/90">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-muted/35 px-4 py-3">
            <div>
              <h3 className="text-xl font-semibold text-foreground">IPO calendar</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {rows.length} result{rows.length === 1 ? "" : "s"} · Page {currentPage} of {totalPages} · Click an IPO for full details
              </p>
            </div>
            {viewFilter !== "all" ? (
              <button
                type="button"
                onClick={() => setViewFilter("all")}
                className="text-sm font-semibold text-brand-blue hover:underline"
              >
                Show all
              </button>
            ) : null}
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-card text-muted-foreground">
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Opens</th>
                  <th className="px-4 py-3 font-semibold">Closes</th>
                  <th className="px-4 py-3 font-semibold">Price band</th>
                  <th className="px-4 py-3 font-semibold">Lot size</th>
                  <th className="px-4 py-3 font-semibold">Subscription</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-muted-foreground" colSpan={6}>
                      No IPOs match this view right now. Try “Show all” or select another board.
                    </td>
                  </tr>
                ) : (
                  visibleRows.map((row) => (
                    <tr
                      key={row.item.id}
                      className="cursor-pointer border-b border-border/60 text-foreground transition hover:bg-muted/50 last:border-b-0"
                      onClick={() => setSelectedIpo(row)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedIpo(row);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-label={`View details for ${row.item.company_name}`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold text-foreground">{row.item.company_name}</div>
                        <div className="mt-1 flex flex-wrap gap-1.5 text-xs">
                          <span
                            className={`rounded-full px-2 py-0.5 font-semibold ${statusTone(row.displayStatus)}`}
                          >
                            {statusLabel(row.displayStatus)}
                          </span>
                          <span className="rounded-full bg-muted px-2 py-0.5 capitalize text-muted-foreground">
                            {row.board}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">{formatDate(row.item.issue_open_date)}</td>
                      <td className="px-4 py-3">{formatDate(row.item.issue_close_date)}</td>
                      <td className="px-4 py-3">{row.item.price_band ?? "TBA"}</td>
                      <td className="px-4 py-3">{row.item.lot_size ?? "TBA"}</td>
                      <td className="px-4 py-3">{row.item.subscription ?? "--"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          {rows.length > PAGE_SIZE ? (
            <div className="flex items-center justify-between gap-3 border-t border-border bg-muted/20 px-4 py-3">
              <p className="text-xs text-muted-foreground">
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, rows.length)} of {rows.length}
              </p>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => setPage((value) => Math.max(1, value - 1))} disabled={currentPage === 1} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45">Previous</button>
                <span className="text-xs font-semibold text-muted-foreground">{currentPage} / {totalPages}</span>
                <button type="button" onClick={() => setPage((value) => Math.min(totalPages, value + 1))} disabled={currentPage === totalPages} className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold text-foreground hover:bg-muted disabled:cursor-not-allowed disabled:opacity-45">Next</button>
              </div>
            </div>
          ) : null}
        </div>

        <aside className="rounded-2xl border border-border bg-card/90 p-5">
          <h3 className="text-xl font-semibold text-foreground">How to use this tracker</h3>
          <div className="mt-4 space-y-4 text-sm leading-6 text-muted-foreground">
            <p className="flex gap-2">
              <CircleCheck className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
              <span>
                <strong className="text-foreground">Open now:</strong> applications may be open.
                Always check the official issue document and broker platform before applying.
              </span>
            </p>
            <p className="flex gap-2">
              <CalendarDays className="mt-1 h-4 w-4 shrink-0 text-brand-blue" />
              <span>
                <strong className="text-foreground">Coming soon:</strong> use the open date and
                price band to plan your research.
              </span>
            </p>
            <p className="flex gap-2">
              <Info className="mt-1 h-4 w-4 shrink-0 text-amber-600" />
              <span>
                GMP and subscription data can be delayed or unavailable. Verify figures with
                official exchange notices.
              </span>
            </p>
          </div>
        </aside>
      </div>

      {selectedIpo ? <IpoDetails row={selectedIpo} onClose={() => setSelectedIpo(null)} /> : null}
    </section>
  );
}

function IpoDetails({ row, onClose }: { row: DisplayRow; onClose: () => void }) {
  const { item } = row;
  const details: Array<[string, string | null]> = [
    ["Symbol", item.symbol],
    ["Board", row.board === "sme" ? "SME" : "Mainboard"],
    ["Open date", formatDate(item.issue_open_date)],
    ["Close date", formatDate(item.issue_close_date)],
    ["Listing date", formatDate(item.listing_date)],
    ["Price band", item.price_band],
    ["Lot size", item.lot_size],
    ["Issue size", item.issue_size],
    ["GMP", item.gmp],
    ["Subscription", item.subscription],
    ["Merchant banker", item.merchant_banker],
    ["Anchor investors", item.anchor_investors],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:justify-center sm:p-5"
      role="presentation"
      onMouseDown={onClose}
    >
      <article
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl bg-card p-5 shadow-2xl sm:rounded-3xl sm:p-6"
        role="dialog"
        aria-modal="true"
        aria-labelledby="ipo-detail-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${statusTone(row.displayStatus)}`}
            >
              {statusLabel(row.displayStatus)}
            </p>
            <h3
              id="ipo-detail-title"
              className="mt-3 text-2xl font-bold text-foreground sm:text-3xl"
            >
              {item.company_name}
            </h3>
            {item.symbol ? (
              <p className="mt-1 text-sm text-muted-foreground">{item.symbol}</p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label="Close IPO details"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {item.summary ? (
          <p className="mt-4 rounded-xl bg-muted/50 p-3 text-sm leading-6 text-muted-foreground">
            {item.summary}
          </p>
        ) : null}
        <dl className="mt-5 grid gap-x-5 gap-y-4 sm:grid-cols-2">
          {details.map(([label, value]) => (
            <div key={label} className="border-b border-border pb-3">
              <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {value || "Not available"}
              </dd>
            </div>
          ))}
        </dl>
        {item.my_recommendation ? (
          <div className="mt-5 rounded-xl border border-brand-blue/25 bg-brand-blue/5 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-brand-blue">
              Research note
            </p>
            <p className="mt-1 text-sm leading-6 text-foreground">{item.my_recommendation}</p>
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <span>Source: {item.source_name ?? "Market feed"}</span>
          {item.external_url ? (
            <a
              href={item.external_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-semibold text-brand-blue hover:underline"
            >
              View source <ExternalLink className="h-3.5 w-3.5" />
            </a>
          ) : null}
        </div>
      </article>
    </div>
  );
}

function StatCard({
  title,
  value,
  onClick,
  active,
}: {
  title: string;
  value: number;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border px-5 py-4 text-left transition ${active ? "border-brand-blue bg-brand-blue/5 ring-1 ring-brand-blue/30" : "border-border bg-card/90 hover:border-brand-blue/50"}`}
    >
      <p className="text-base font-semibold text-muted-foreground">{title}</p>
      <p className="mt-3 text-5xl font-bold text-foreground">{value}</p>
    </button>
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

function statusTone(value: DisplayStatus): string {
  if (value === "open") return "bg-emerald-100 text-emerald-700";
  if (value === "upcoming") return "bg-blue-100 text-blue-700";
  return "bg-muted text-muted-foreground";
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
