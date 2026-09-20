import { useEffect, useMemo, useState } from "react";
import { Bookmark, ExternalLink, Filter, RefreshCw } from "lucide-react";
import { getMarketDeals, getSavedDealIds, removeSavedDeal, saveDeal, type DealType, type MarketDeal } from "@/lib/supabase/market-deals";

export default function BulkBlockDeals({ userId }: { userId: string }) {
  const [deals, setDeals] = useState<MarketDeal[]>([]);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<DealType | "all">("all");
  const [side, setSide] = useState<"all" | "buy" | "sell">("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const [rows, saved] = await Promise.all([getMarketDeals(), getSavedDealIds(userId)]);
      setDeals(rows);
      setSavedIds(saved);
    } catch {
      setDeals([]);
      setMessage("Official deal data is not available yet. Run Member-Dashboard-Schema.sql, then import an official NSE/BSE report or approved feed.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, [userId]);

  const filtered = useMemo(() => deals.filter((deal) => {
    const text = `${deal.symbol ?? ""} ${deal.security_name} ${deal.client_name ?? ""}`.toLowerCase();
    return (type === "all" || deal.deal_type === type) && (side === "all" || deal.side === side) && text.includes(query.trim().toLowerCase());
  }), [deals, query, side, type]);

  const toggleSaved = async (dealId: string) => {
    const isSaved = savedIds.includes(dealId);
    try {
      if (isSaved) {
        await removeSavedDeal(userId, dealId);
        setSavedIds((ids) => ids.filter((id) => id !== dealId));
      } else {
        await saveDeal(userId, dealId);
        setSavedIds((ids) => [...ids, dealId]);
      }
    } catch {
      setMessage("Could not update saved deals. Check the signed-in database policies and try again.");
    }
  };

  return <section id="bulk-block-deals" className="rounded-2xl border border-border bg-card p-5 shadow-[var(--shadow-card)] md:p-6">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
      <div><p className="text-xs font-bold uppercase tracking-wider text-brand-purple">Official exchange data</p><h2 className="mt-1 text-2xl font-extrabold text-foreground">Bulk &amp; Block Deals</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Large reported transactions from imported NSE/BSE reports. A deal is market information, not a buy or sell recommendation.</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm font-semibold text-foreground hover:bg-muted disabled:opacity-50"><RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
    </div>
    <div className="mt-5 grid gap-3 md:grid-cols-[1.4fr_0.6fr_0.6fr]"><label className="relative"><span className="sr-only">Search deals</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search company, symbol or client" className="w-full rounded-xl border border-input bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20" /></label><label className="flex items-center gap-2 rounded-xl border border-input px-3 text-sm"><Filter className="h-4 w-4 text-muted-foreground" /><span className="sr-only">Deal type</span><select value={type} onChange={(event) => setType(event.target.value as DealType | "all")} className="w-full bg-transparent py-2.5 outline-none"><option value="all">All deals</option><option value="bulk">Bulk deals</option><option value="block">Block deals</option></select></label><label className="rounded-xl border border-input px-3 text-sm"><span className="sr-only">Buy or sell</span><select value={side} onChange={(event) => setSide(event.target.value as "all" | "buy" | "sell")} className="w-full bg-transparent py-2.5 outline-none"><option value="all">Buy &amp; sell</option><option value="buy">Buy</option><option value="sell">Sell</option></select></label></div>
    {message ? <p className="mt-5 rounded-xl bg-amber-50 p-4 text-sm leading-6 text-amber-900">{message}</p> : null}
    {!loading && !message && filtered.length === 0 ? <p className="mt-5 rounded-xl bg-muted/60 p-5 text-sm text-muted-foreground">No official deals match these filters.</p> : null}
    {filtered.length > 0 ? <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="border-b border-border text-[11px] font-bold uppercase tracking-wider text-muted-foreground"><tr><th className="px-3 py-3">Date</th><th className="px-3 py-3">Security</th><th className="px-3 py-3">Type</th><th className="px-3 py-3">Client / side</th><th className="px-3 py-3 text-right">Quantity</th><th className="px-3 py-3 text-right">Price</th><th className="px-3 py-3">Source</th><th className="px-3 py-3"><span className="sr-only">Save</span></th></tr></thead><tbody>{filtered.map((deal) => <tr key={deal.id} className="border-b border-border/60"><td className="px-3 py-3 text-muted-foreground">{formatDate(deal.trade_date)}</td><td className="px-3 py-3"><p className="font-bold text-foreground">{deal.symbol ?? deal.security_name}</p>{deal.symbol ? <p className="text-xs text-muted-foreground">{deal.security_name}</p> : null}</td><td className="px-3 py-3"><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-bold capitalize text-brand-purple">{deal.exchange} {deal.deal_type}</span></td><td className="px-3 py-3"><p className="font-medium text-foreground">{deal.client_name ?? "Not reported"}</p><p className={deal.side === "buy" ? "text-xs font-bold text-emerald-700" : deal.side === "sell" ? "text-xs font-bold text-rose-700" : "text-xs text-muted-foreground"}>{deal.side ? deal.side.toUpperCase() : "—"}</p></td><td className="px-3 py-3 text-right font-medium">{formatNumber(deal.quantity)}</td><td className="px-3 py-3 text-right font-medium">{deal.trade_price === null ? "—" : `₹${formatNumber(deal.trade_price)}`}</td><td className="px-3 py-3"><a href={deal.source_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">Report <ExternalLink className="h-3.5 w-3.5" /></a></td><td className="px-3 py-3"><button type="button" onClick={() => void toggleSaved(deal.id)} className={`rounded-lg p-2 ${savedIds.includes(deal.id) ? "bg-brand-blue text-white" : "text-muted-foreground hover:bg-muted"}`} aria-label={savedIds.includes(deal.id) ? "Remove saved deal" : "Save deal"}><Bookmark className="h-4 w-4" fill={savedIds.includes(deal.id) ? "currentColor" : "none"} /></button></td></tr>)}</tbody></table></div> : null}
  </section>;
}

function formatNumber(value: number | null) { return value === null ? "—" : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(value); }
function formatDate(value: string) { const date = new Date(`${value}T00:00:00`); return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric" }).format(date); }
