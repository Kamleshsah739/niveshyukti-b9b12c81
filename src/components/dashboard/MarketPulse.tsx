import { useEffect, useMemo, useState } from "react";
import { BookmarkPlus, ChevronDown, Clock3, Minus, Plus, RefreshCw, TrendingDown, TrendingUp, X } from "lucide-react";
import { getScreenerStocks, type ScreenerStock } from "@/lib/supabase/screener";
import { addWatchlistSymbol, getWatchlistSymbols, removeWatchlistSymbol } from "@/lib/supabase/watchlist";

const number = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 });

export default function MarketPulse({ userId }: { userId: string }) {
  const [stocks, setStocks] = useState<ScreenerStock[]>([]);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [rows, saved] = await Promise.all([getScreenerStocks(), getWatchlistSymbols(userId)]);
      setStocks(rows);
      setSymbols(saved);
      setNotice(null);
    } catch {
      setNotice("Market coverage or watchlists are not ready yet. Run the stock and member dashboard schemas in Supabase, then allow the scheduled feed to populate data.");
    } finally { setLoading(false); }
  };

  useEffect(() => { void load(); }, [userId]);
  const gainers = useMemo(() => [...stocks].filter((stock) => stock.changePercent !== null).sort((a, b) => (b.changePercent ?? -Infinity) - (a.changePercent ?? -Infinity)).slice(0, 4), [stocks]);
  const losers = useMemo(() => [...stocks].filter((stock) => stock.changePercent !== null).sort((a, b) => (a.changePercent ?? Infinity) - (b.changePercent ?? Infinity)).slice(0, 4), [stocks]);
  const saved = useMemo(() => symbols.map((symbol) => stocks.find((stock) => stock.symbol === symbol)).filter(Boolean) as ScreenerStock[], [stocks, symbols]);
  const matches = useMemo(() => query.trim().length < 2 ? [] : stocks.filter((stock) => `${stock.symbol} ${stock.name}`.toLowerCase().includes(query.trim().toLowerCase())).slice(0, 6), [query, stocks]);

  const add = async (symbol: string) => { try { await addWatchlistSymbol(userId, symbol); setSymbols((items) => items.includes(symbol) ? items : [symbol, ...items]); setQuery(""); } catch { setNotice("Could not save this stock. Run Member-Dashboard-Schema.sql in Supabase and sign in again."); } };
  const remove = async (symbol: string) => { try { await removeWatchlistSymbol(userId, symbol); setSymbols((items) => items.filter((item) => item !== symbol)); } catch { setNotice("Could not remove this stock from the watchlist."); } };

  return <section id="market-overview" className="space-y-5">
    <div className="flex flex-col justify-between gap-4 rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] md:flex-row md:items-center"><div><p className="text-xs font-bold uppercase tracking-wider text-brand-purple">End-of-day market workspace</p><h2 className="mt-1 text-2xl font-extrabold text-foreground">Markets &amp; Watchlist</h2><p className="mt-1 text-sm text-muted-foreground">Coverage: {loading ? "loading…" : `${stocks.length} NSE stocks currently available`}. Prices may be delayed.</p></div><button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button></div>
    {notice ? <p className="rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{notice}</p> : null}
    <div className="grid gap-5 xl:grid-cols-[0.8fr_1.2fr]">
      <div id="watchlist" className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"><div className="flex items-center justify-between"><div><h3 className="font-bold text-foreground">My watchlist</h3><p className="mt-1 text-xs text-muted-foreground">Saved only for your account</p></div><BookmarkPlus className="h-5 w-5 text-brand-blue" /></div><div className="relative mt-4"><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Add a stock by name or symbol" className="w-full rounded-xl border border-input bg-background px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" />{matches.length > 0 ? <div className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">{matches.map((stock) => <button type="button" key={stock.symbol} onClick={() => void add(stock.symbol)} className="flex w-full items-center justify-between px-3 py-2.5 text-left text-sm hover:bg-muted"><span><strong>{stock.symbol.replace(".NS", "")}</strong><span className="ml-2 text-muted-foreground">{stock.name}</span></span><Plus className="h-4 w-4 text-brand-blue" /></button>)}</div> : null}</div><div className="mt-4 space-y-2">{saved.length === 0 ? <p className="rounded-xl bg-muted/60 p-4 text-sm text-muted-foreground">Search above to start a personal watchlist.</p> : saved.map((stock) => <div key={stock.symbol} className="flex items-center justify-between rounded-xl border border-border/70 px-3 py-2.5"><div><p className="font-bold text-foreground">{stock.symbol.replace(".NS", "")}</p><p className="text-xs text-muted-foreground">₹{number.format(stock.price)} · {change(stock.changePercent)}</p></div><button type="button" onClick={() => void remove(stock.symbol)} aria-label={`Remove ${stock.symbol}`} className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-rose-700"><X className="h-4 w-4" /></button></div>)}</div></div>
      <div className="grid gap-5 sm:grid-cols-2"><MoverList title="Top gainers" icon={TrendingUp} rows={gainers} positive /><MoverList title="Top decliners" icon={TrendingDown} rows={losers} /><div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"><div className="flex items-start gap-3"><Clock3 className="mt-0.5 h-5 w-5 text-brand-blue" /><div><h3 className="font-bold text-foreground">Market status</h3><p className="mt-1 text-sm leading-6 text-muted-foreground">This workspace uses end-of-day snapshots. Check the source time in the screener before relying on a price.</p><a href="/screener" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-brand-blue hover:underline">Open filters <ChevronDown className="h-3.5 w-3.5 -rotate-90" /></a></div></div></div><div className="rounded-2xl border border-dashed border-border bg-muted/25 p-5"><h3 className="font-bold text-foreground">Premium research</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">Research recommendations and paid access remain inactive until SEBI RA registration and required disclosures are in place.</p><a href="/disclosures" className="mt-3 inline-flex text-sm font-semibold text-brand-blue hover:underline">Why this is paused</a></div></div>
    </div>
  </section>;
}

function MoverList({ title, icon: Icon, rows, positive = false }: { title: string; icon: typeof TrendingUp; rows: ScreenerStock[]; positive?: boolean }) { return <div className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)]"><div className="flex items-center gap-2"><Icon className={`h-5 w-5 ${positive ? "text-emerald-600" : "text-rose-600"}`} /><h3 className="font-bold text-foreground">{title}</h3></div><div className="mt-4 space-y-3">{rows.length === 0 ? <p className="text-sm text-muted-foreground">No price-change data yet.</p> : rows.map((stock) => <div key={stock.symbol} className="flex items-center justify-between"><div><p className="font-semibold text-foreground">{stock.symbol.replace(".NS", "")}</p><p className="text-xs text-muted-foreground">₹{number.format(stock.price)}</p></div><span className={positive ? "font-bold text-emerald-600" : "font-bold text-rose-600"}>{change(stock.changePercent)}</span></div>)}</div></div>; }
function change(value: number | null) { if (value === null) return "—"; return `${value >= 0 ? "+" : ""}${number.format(value)}%`; }
