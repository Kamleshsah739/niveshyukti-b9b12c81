import { useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, CalendarDays, ExternalLink, Search, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { getStockSnapshot, type StockSnapshot } from "@/lib/market-data";

const stocks = [
  { symbol: "RELIANCE.NS", label: "Reliance Industries" },
  { symbol: "TCS.NS", label: "TCS" },
  { symbol: "INFY.NS", label: "Infosys" },
];

const fundamentals = [
  ["Market cap", "₹19.4L Cr"], ["P/E ratio", "24.8"], ["ROE", "8.9%"], ["Debt / equity", "0.42"], ["52W range", "₹1,114 – ₹1,608"], ["Dividend yield", "0.39%"],
];

export default function StockResearchHub() {
  const [symbol, setSymbol] = useState(stocks[0].symbol);
  const [data, setData] = useState<StockSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    void getStockSnapshot(symbol).then((snapshot) => {
      if (active) {
        setData(snapshot);
        setLoading(false);
      }
    });
    return () => { active = false; };
  }, [symbol]);

  const trendUp = (data?.change ?? 0) >= 0;
  const score = useMemo(() => trendUp ? 76 : 62, [trendUp]);
  const filteredStocks = stocks.filter((stock) => stock.label.toLowerCase().includes(search.toLowerCase()) || stock.symbol.toLowerCase().includes(search.toLowerCase()));
  const money = new Intl.NumberFormat("en-IN", { style: "currency", currency: data?.currency ?? "INR", maximumFractionDigits: 2 });

  return (
    <section id="stock-research-section" className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-card)] md:p-6">
      <div className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-brand-blue"><Sparkles className="h-4 w-4" /> Research workspace</div>
          <h2 className="text-2xl font-bold text-foreground">Make a decision with the full picture.</h2>
          <p className="mt-1 text-sm text-muted-foreground">Prices, technical context, fundamentals and upcoming events — no execution required.</p>
        </div>
        <div className="w-full lg:w-64">
          <label className="relative block">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a stock" className="w-full rounded-lg border border-input bg-background py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
          </label>
          {search && <div className="mt-1 rounded-lg border border-border bg-card p-1 shadow-sm">{filteredStocks.map((stock) => <button key={stock.symbol} onClick={() => { setSymbol(stock.symbol); setSearch(""); }} className="block w-full rounded-md px-3 py-2 text-left text-sm hover:bg-muted">{stock.label} <span className="text-muted-foreground">{stock.symbol}</span></button>)}{filteredStocks.length === 0 && <p className="px-3 py-2 text-sm text-muted-foreground">Try Reliance, TCS or Infosys.</p>}</div>}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">{stocks.map((stock) => <button key={stock.symbol} onClick={() => setSymbol(stock.symbol)} className={`rounded-full px-3 py-1.5 text-sm font-semibold transition ${symbol === stock.symbol ? "bg-brand-blue text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}>{stock.label}</button>)}</div>

      {loading || !data ? <div className="grid h-72 place-items-center text-sm text-muted-foreground">Loading market data…</div> : <>
        <div className="mt-6 grid gap-5 xl:grid-cols-3">
          <div className="rounded-xl border border-border bg-gradient-to-br from-muted/70 to-background p-5 xl:col-span-2">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><p className="font-bold text-foreground">{data.name}</p><p className="mt-1 text-xs font-medium text-muted-foreground">{data.symbol} · NSE</p><p className="mt-3 text-3xl font-bold tracking-tight">{money.format(data.price)}</p><p className={`mt-1 flex items-center gap-1 text-sm font-semibold ${trendUp ? "text-emerald-600" : "text-rose-600"}`}>{trendUp ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}{trendUp ? "+" : ""}{data.change.toFixed(2)} ({data.changePercent.toFixed(2)}%) today</p></div>
              <span className="rounded-full bg-card px-3 py-1.5 text-xs font-medium text-muted-foreground shadow-sm">1 month · daily</span>
            </div>
            <div className="mt-5 h-56"><ResponsiveContainer width="100%" height="100%"><AreaChart data={data.history}><defs><linearGradient id="stockFill" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor={trendUp ? "#10b981" : "#f43f5e"} stopOpacity={0.28}/><stop offset="95%" stopColor={trendUp ? "#10b981" : "#f43f5e"} stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--color-border)"/><XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} minTickGap={28}/><YAxis domain={["dataMin - 5", "dataMax + 5"]} hide/><Tooltip formatter={(value) => money.format(Number(value))}/><Area type="monotone" dataKey="close" stroke={trendUp ? "#059669" : "#e11d48"} strokeWidth={2.5} fill="url(#stockFill)" /></AreaChart></ResponsiveContainer></div>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground"><span>Open / previous close: {money.format(data.previousClose)}</span><span>Day range: {money.format(data.low)} – {money.format(data.high)}</span><span>Volume: {new Intl.NumberFormat("en-IN", { notation: "compact" }).format(data.volume)}</span></div>
          </div>

          <div className="rounded-xl border border-border p-5"><div className="flex items-center justify-between"><h3 className="font-bold">Research signal</h3><ShieldCheck className="h-5 w-5 text-brand-blue" /></div><div className="mt-5 flex items-end gap-3"><p className="text-5xl font-bold">{score}</p><p className="pb-1 text-sm text-muted-foreground">/ 100<br/>confidence score</p></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-brand-blue" style={{ width: `${score}%` }} /></div><div className="mt-5 space-y-3 text-sm"><div className="flex justify-between"><span className="text-muted-foreground">Technical trend</span><span className={trendUp ? "font-semibold text-emerald-600" : "font-semibold text-rose-600"}>{trendUp ? "Positive" : "Cautious"}</span></div><div className="flex justify-between"><span className="text-muted-foreground">Momentum</span><span className="font-semibold">Moderate</span></div><div className="flex justify-between"><span className="text-muted-foreground">Risk level</span><span className="font-semibold text-amber-600">Medium</span></div></div><p className="mt-5 rounded-lg bg-muted p-3 text-xs leading-5 text-muted-foreground">A research aid, not a buy/sell recommendation. Verify data and consider your risk profile.</p></div>
        </div>
        <div className="mt-5 grid gap-5 lg:grid-cols-3">
          <div className="rounded-xl border border-border p-5 lg:col-span-2"><div className="flex items-center justify-between"><h3 className="font-bold">Key fundamentals</h3><span className="text-xs text-muted-foreground">Illustrative company snapshot</span></div><div className="mt-4 grid grid-cols-2 gap-x-7 gap-y-4 sm:grid-cols-3">{fundamentals.map(([label, value]) => <div key={label}><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-semibold text-foreground">{value}</p></div>)}</div></div>
          <div className="rounded-xl border border-border p-5"><div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-brand-blue"/><h3 className="font-bold">On your radar</h3></div><div className="mt-4 space-y-3 text-sm"><div><p className="font-semibold">Quarterly results</p><p className="text-xs text-muted-foreground">Track announced dates & outcomes</p></div><div><p className="font-semibold">Dividend calendar</p><p className="text-xs text-muted-foreground">Upcoming ex-date alerts</p></div><a href="https://www.nseindia.com/companies-listing/corporate-filings-announcements" target="_blank" rel="noreferrer" className="flex items-center gap-1 font-semibold text-brand-blue hover:underline">NSE corporate filings <ExternalLink className="h-3 w-3" /></a></div></div>
        </div>
        <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground"><Activity className="h-3.5 w-3.5" />{data.source === "synced" ? "Market price loaded from the scheduled free-data sync." : data.source === "live" ? "Market price loaded from Yahoo Finance public data." : "Using sample data because the public market-data request is unavailable."} Public/free data may be delayed and should not be used as the sole basis for investment decisions.</p>
      </>}
    </section>
  );
}
