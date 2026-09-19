import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Filter, RefreshCw, Search, SlidersHorizontal } from "lucide-react";
import { getScreenerStocks, type ScreenerStock } from "@/lib/supabase/screener";

type SortKey = "marketCap" | "changePercent" | "peRatio" | "roePercent" | "volume";

const formatNumber = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });
const formatCurrency = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-IN", { notation: "compact", maximumFractionDigits: 2 });
const display = (value: number | null, suffix = "") => (value === null ? "—" : `${formatNumber.format(value)}${suffix}`);

export default function StockScreener() {
  const [stocks, setStocks] = useState<ScreenerStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [sector, setSector] = useState("all");
  const [minMarketCap, setMinMarketCap] = useState("");
  const [maxPe, setMaxPe] = useState("");
  const [minRoe, setMinRoe] = useState("");
  const [maxDebt, setMaxDebt] = useState("");
  const [aboveSma50, setAboveSma50] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("marketCap");
  const [descending, setDescending] = useState(true);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setStocks(await getScreenerStocks());
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Could not load screener data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  const sectors = useMemo(() => Array.from(new Set(stocks.map((stock) => stock.sector).filter(Boolean))).sort() as string[], [stocks]);
  const results = useMemo(() => {
    const minimumCap = Number(minMarketCap) || null;
    const maximumPe = Number(maxPe) || null;
    const minimumRoe = Number(minRoe) || null;
    const maximumDebt = Number(maxDebt) || null;
    return stocks
      .filter((stock) => !query || `${stock.name} ${stock.symbol}`.toLowerCase().includes(query.toLowerCase()))
      .filter((stock) => sector === "all" || stock.sector === sector)
      .filter((stock) => !minimumCap || (stock.marketCap ?? -Infinity) >= minimumCap * 1_00_00_000)
      .filter((stock) => !maximumPe || (stock.peRatio ?? Infinity) <= maximumPe)
      .filter((stock) => !minimumRoe || (stock.roePercent ?? -Infinity) >= minimumRoe)
      .filter((stock) => !maximumDebt || (stock.debtToEquity ?? Infinity) <= maximumDebt)
      .filter((stock) => !aboveSma50 || (stock.sma50 !== null && stock.price > stock.sma50))
      .sort((left, right) => {
        const a = left[sortKey] ?? (descending ? -Infinity : Infinity);
        const b = right[sortKey] ?? (descending ? -Infinity : Infinity);
        return descending ? Number(b) - Number(a) : Number(a) - Number(b);
      });
  }, [aboveSma50, descending, maxDebt, maxPe, minMarketCap, minRoe, query, sector, sortKey, stocks]);

  const reset = () => { setQuery(""); setSector("all"); setMinMarketCap(""); setMaxPe(""); setMinRoe(""); setMaxDebt(""); setAboveSma50(false); };

  return <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
    <div className="mx-auto max-w-7xl">
      <div className="flex flex-col gap-5 border-b border-border pb-7 md:flex-row md:items-end md:justify-between">
        <div><p className="flex items-center gap-2 text-sm font-bold text-brand-blue"><SlidersHorizontal className="h-4 w-4" /> Indian equities · end of day</p><h1 className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">Stock Screener</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Discover NSE companies using valuation, quality, growth and technical filters. Data is for research only, not investment advice.</p></div>
        <a href="/" className="text-sm font-semibold text-brand-blue hover:underline">← Back to home</a>
      </div>

      <section className="mt-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold"><Filter className="h-4 w-4 text-brand-blue" /> Filters</div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
          <label className="relative lg:col-span-2"><Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><input value={query} onChange={(event) => setQuery(event.target.value)} className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" placeholder="Search company or symbol" /></label>
          <select value={sector} onChange={(event) => setSector(event.target.value)} className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm"><option value="all">All sectors</option>{sectors.map((item) => <option key={item}>{item}</option>)}</select>
          <input value={minMarketCap} onChange={(event) => setMinMarketCap(event.target.value)} inputMode="decimal" className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm" placeholder="Min cap (₹ Cr)" />
          <input value={maxPe} onChange={(event) => setMaxPe(event.target.value)} inputMode="decimal" className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm" placeholder="Max P/E" />
          <input value={minRoe} onChange={(event) => setMinRoe(event.target.value)} inputMode="decimal" className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm" placeholder="Min ROE %" />
          <input value={maxDebt} onChange={(event) => setMaxDebt(event.target.value)} inputMode="decimal" className="rounded-lg border border-input bg-background px-3 py-2.5 text-sm" placeholder="Max debt/equity" />
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3"><label className="flex items-center gap-2 text-sm"><input checked={aboveSma50} onChange={(event) => setAboveSma50(event.target.checked)} type="checkbox" className="h-4 w-4 accent-[var(--color-brand-blue)]" /> Price above 50-day average</label><button type="button" onClick={reset} className="text-sm font-semibold text-muted-foreground hover:text-foreground">Clear filters</button></div>
      </section>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground"><strong className="text-foreground">{results.length}</strong> of {stocks.length} NSE stocks match</p><div className="flex items-center gap-2"><select value={sortKey} onChange={(event) => setSortKey(event.target.value as SortKey)} className="rounded-lg border border-input bg-card px-3 py-2 text-sm"><option value="marketCap">Market cap</option><option value="changePercent">Daily change</option><option value="peRatio">P/E ratio</option><option value="roePercent">ROE</option><option value="volume">Volume</option></select><button type="button" onClick={() => setDescending((value) => !value)} className="rounded-lg border border-input bg-card p-2 text-muted-foreground hover:text-foreground" aria-label="Reverse sort"><ArrowDownUp className="h-4 w-4" /></button><button type="button" onClick={() => void load()} className="rounded-lg border border-input bg-card p-2 text-muted-foreground hover:text-foreground" aria-label="Refresh data"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /></button></div></div>

      {error ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"><strong>Screener setup needed.</strong> Run <code>docs/Screener-Schema.sql</code> in Supabase, then allow the EOD sync to populate stocks. Details: {error}</div> : null}
      <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card"><table className="min-w-[1050px] w-full text-left text-sm"><thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wide text-muted-foreground"><tr>{["Company", "Price", "1D", "Market cap", "P/E", "ROE", "ROCE", "Debt/Eq", "RSI", "52W high"].map((heading) => <th key={heading} className="whitespace-nowrap px-4 py-3 font-semibold">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border">{loading ? <tr><td colSpan={10} className="px-4 py-14 text-center text-muted-foreground">Loading NSE screener data…</td></tr> : results.map((stock) => <tr key={stock.symbol} className="hover:bg-muted/30"><td className="px-4 py-3"><p className="font-semibold">{stock.name}</p><p className="mt-0.5 text-xs text-muted-foreground">{stock.symbol.replace(".NS", "")} · {stock.sector ?? "Unclassified"}</p></td><td className="px-4 py-3 font-medium">{formatCurrency.format(stock.price)}</td><td className={`px-4 py-3 font-semibold ${(stock.changePercent ?? 0) >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{display(stock.changePercent, "%")}</td><td className="px-4 py-3">{stock.marketCap === null ? "—" : `₹${compact.format(stock.marketCap)}`}</td><td className="px-4 py-3">{display(stock.peRatio)}</td><td className="px-4 py-3">{display(stock.roePercent, "%")}</td><td className="px-4 py-3">{display(stock.rocePercent, "%")}</td><td className="px-4 py-3">{display(stock.debtToEquity)}</td><td className="px-4 py-3">{display(stock.rsi14)}</td><td className="px-4 py-3">{stock.fiftyTwoWeekHigh === null ? "—" : formatCurrency.format(stock.fiftyTwoWeekHigh)}</td></tr>) }{!loading && !error && results.length === 0 ? <tr><td colSpan={10} className="px-4 py-14 text-center text-muted-foreground">No stocks match these filters. Try clearing one or more filters.</td></tr> : null}</tbody></table></div>
      <p className="mt-4 text-xs leading-5 text-muted-foreground">Prices are end-of-day / delayed snapshots. Fundamental fields update when a new permitted data feed is imported. Always verify figures against company filings before making investment decisions.</p>
    </div>
  </main>;
}
