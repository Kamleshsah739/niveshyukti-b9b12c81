import { useEffect, useState } from "react";
import { getPublishedIpos, type IpoRecord } from "@/lib/supabase/ipo";
import { supabase } from "@/lib/supabase/client";

const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export default function Watchlist() {
  const [rows, setRows] = useState<IpoRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    let refreshTimeout: ReturnType<typeof setTimeout> | undefined;

    const load = async () => {
      try {
        const ipos = await getPublishedIpos();
        if (!mounted) return;

        const sorted = [...ipos].sort((a, b) => {
          const aDate = Date.parse(a.issue_open_date ?? "");
          const bDate = Date.parse(b.issue_open_date ?? "");
          if (Number.isNaN(aDate) && Number.isNaN(bDate)) return 0;
          if (Number.isNaN(aDate)) return 1;
          if (Number.isNaN(bDate)) return -1;
          return aDate - bDate;
        });

        setRows(sorted.slice(0, 6));
      } catch (loadError) {
        if (!mounted) return;
        setError(toErrorMessage(loadError, "Unable to load IPO watchlist."));
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
      .channel("dashboard-ipo-watchlist")
      .on("postgres_changes", { event: "*", schema: "public", table: "ipo_entries" }, scheduleRefresh)
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

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">IPO Watchlist</h2>
        <a href="#ipo" className="text-sm font-semibold text-brand-blue hover:underline">
          View All
        </a>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-3 py-2.5">
            <div>
              <p className="font-semibold text-foreground">{row.company_name}</p>
              <p className="text-xs text-muted-foreground">
                {row.price_band ?? "TBA"} • {row.issue_open_date ?? "Date TBA"}
              </p>
            </div>
            <a
              href={row.external_url ?? "#ipo"}
              target={row.external_url ? "_blank" : undefined}
              rel={row.external_url ? "noreferrer" : undefined}
              className="rounded-md border border-border px-2.5 py-1 text-xs font-semibold text-brand-blue hover:bg-accent"
            >
              Details
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
