import { useMemo, useState } from "react";
import {
  BarChart3,
  Bot,
  Calculator,
  ChevronRight,
  Gauge,
  Search,
  ShieldCheck,
  Sparkles,
  WalletCards,
} from "lucide-react";

type Tool = "ratings" | "screeners" | "funds" | "calculator" | "advisory";

const tools: Array<{ id: Tool; label: string; icon: typeof Sparkles }> = [
  { id: "ratings", label: "AI Ratings", icon: Bot },
  { id: "screeners", label: "Screeners", icon: Search },
  { id: "funds", label: "Funds & SIPs", icon: WalletCards },
  { id: "calculator", label: "Calculator", icon: Calculator },
  { id: "advisory", label: "Advisory", icon: ShieldCheck },
];

const ratings = [
  { company: "Reliance Industries", ticker: "RELIANCE", rating: "Positive", score: 82, note: "Earnings quality and relative strength remain supportive." },
  { company: "HDFC Bank", ticker: "HDFCBANK", rating: "Watch", score: 67, note: "Monitor deposit growth and margin commentary." },
  { company: "Tata Consultancy Services", ticker: "TCS", rating: "Positive", score: 76, note: "Defensive profile with a stable cash-flow outlook." },
];

const screenerRows = [
  { name: "Larsen & Toubro", sector: "Capital Goods", metric: "ROE 16.8%", signal: "Quality" },
  { name: "Sun Pharma", sector: "Healthcare", metric: "Sales growth 14.2%", signal: "Growth" },
  { name: "ICICI Bank", sector: "Financials", metric: "NPA 2.1%", signal: "Quality" },
];

function Money({ value }: { value: number }) {
  return <>{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}</>;
}

export default function InvestorToolsHub() {
  const [active, setActive] = useState<Tool>("ratings");
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);

  const sip = useMemo(() => {
    const months = Math.max(years, 1) * 12;
    const monthlyRate = Math.max(rate, 0) / 1200;
    const invested = monthly * months;
    const value = monthlyRate === 0 ? invested : monthly * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate);
    return { invested, value: Math.round(value) };
  }, [monthly, rate, years]);

  return (
    <section id="tools" className="py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="overflow-hidden rounded-[2rem] border border-emerald-100/15 bg-[radial-gradient(circle_at_85%_8%,rgba(72,214,184,0.22),transparent_32%),linear-gradient(145deg,#071c19,#0d302b)] p-5 text-white shadow-[var(--shadow-glow)] md:p-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-100">
              <Sparkles className="h-3.5 w-3.5 text-brand-cyan" /> Investor toolkit
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Everything to research before you invest.</h2>
            <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base">Explore research signals, compare opportunities and plan your goals in one place. Nivesh Yukti provides information and research only — never trade execution.</p>
          </div>

          <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
            {tools.map(({ id, label, icon: Icon }) => (
              <button key={id} type="button" onClick={() => setActive(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${active === id ? "bg-white text-[#0b2722]" : "bg-white/8 text-white/70 hover:bg-white/15 hover:text-white"}`}>
                <Icon className="h-3.5 w-3.5" /> {label}
              </button>
            ))}
          </div>

          <div className="mt-5 rounded-[1.5rem] border border-white/12 bg-[#041512]/55 p-4 md:p-6">
            {active === "ratings" && <div className="grid gap-3 lg:grid-cols-3">{ratings.map((item) => <article key={item.ticker} className="rounded-2xl bg-white/7 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold">{item.company}</p><p className="mt-1 text-xs text-white/45">NSE: {item.ticker}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${item.rating === "Positive" ? "bg-emerald-300/15 text-emerald-200" : "bg-amber-300/15 text-amber-100"}`}>{item.rating}</span></div><div className="mt-5 flex items-end justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Research score</p><p className="mt-1 text-3xl font-extrabold text-brand-cyan">{item.score}<span className="text-sm text-white/50">/100</span></p></div><Gauge className="h-8 w-8 text-white/35" /></div><p className="mt-4 border-t border-white/10 pt-3 text-xs leading-5 text-white/65">{item.note}</p></article>)}</div>}

            {active === "screeners" && <div><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-lg font-bold">Curated research screeners</p><p className="mt-1 text-sm text-white/60">Start with a framework; always review the full research before acting.</p></div><div className="flex gap-2"><span className="rounded-full bg-emerald-300/15 px-3 py-1.5 text-xs font-bold text-emerald-100">Quality</span><span className="rounded-full bg-white/8 px-3 py-1.5 text-xs font-bold text-white/70">Growth</span></div></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[560px] text-left text-sm"><thead className="text-[10px] uppercase tracking-widest text-white/40"><tr><th className="pb-3 font-semibold">Company</th><th className="pb-3 font-semibold">Sector</th><th className="pb-3 font-semibold">Key metric</th><th className="pb-3 text-right font-semibold">Profile</th></tr></thead><tbody>{screenerRows.map((row) => <tr key={row.name} className="border-t border-white/10"><td className="py-4 font-bold">{row.name}</td><td className="py-4 text-white/60">{row.sector}</td><td className="py-4 text-brand-cyan">{row.metric}</td><td className="py-4 text-right"><span className="rounded-full bg-white/8 px-2.5 py-1 text-xs font-bold">{row.signal}</span></td></tr>)}</tbody></table></div></div>}

            {active === "funds" && <div className="grid gap-4 md:grid-cols-3">{[["Goal-based SIPs", "Build a monthly investment plan around a goal and time horizon."], ["Fund research", "Compare category, risk, costs and fund strategy in one research view."], ["Review reminders", "Set a regular review rhythm instead of reacting to every market move."]].map(([title, copy]) => <div key={title} className="rounded-2xl bg-white/7 p-5"><WalletCards className="h-6 w-6 text-brand-cyan" /><p className="mt-4 font-bold">{title}</p><p className="mt-2 text-sm leading-6 text-white/60">{copy}</p><button type="button" onClick={() => setActive("calculator")} className="mt-5 inline-flex items-center text-xs font-bold text-brand-cyan">Plan a SIP <ChevronRight className="ml-1 h-3.5 w-3.5" /></button></div>)}</div>}

            {active === "calculator" && <div className="grid gap-5 md:grid-cols-[1fr_0.85fr]"><div><p className="text-lg font-bold">SIP calculator</p><p className="mt-1 text-sm text-white/60">Explore how a regular contribution may grow. Illustrative only; returns are not guaranteed.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{[["Monthly amount", monthly, setMonthly, 500], ["Expected return", rate, setRate, 1], ["Investment years", years, setYears, 1]].map(([label, value, setter, step]) => <label key={String(label)} className="rounded-xl bg-white/7 p-3 text-xs font-bold text-white/70">{String(label)}<div className="mt-2 flex items-center gap-1 text-white"><span className="text-sm">{label === "Expected return" ? "%" : label === "Investment years" ? "Y" : "₹"}</span><input aria-label={String(label)} type="number" min="0" step={Number(step)} value={Number(value)} onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))} className="w-full bg-transparent text-base font-extrabold outline-none" /></div></label>)}</div></div><div className="rounded-2xl bg-[linear-gradient(145deg,rgba(89,227,196,0.24),rgba(255,255,255,0.08))] p-5"><p className="text-xs font-bold uppercase tracking-wider text-white/55">Estimated value</p><p className="mt-2 text-4xl font-extrabold">₹<Money value={sip.value} /></p><div className="mt-6 space-y-2 border-t border-white/15 pt-4 text-sm"><div className="flex justify-between text-white/65"><span>Amount invested</span><span>₹<Money value={sip.invested} /></span></div><div className="flex justify-between font-bold text-brand-cyan"><span>Estimated gains</span><span>₹<Money value={Math.max(sip.value - sip.invested, 0)} /></span></div></div></div></div>}

            {active === "advisory" && <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]"><div className="rounded-2xl bg-emerald-300/10 p-5"><ShieldCheck className="h-8 w-8 text-emerald-200" /><p className="mt-4 text-lg font-bold">Research-led, investor-controlled.</p><p className="mt-2 text-sm leading-6 text-white/65">Every published view should show its thesis, time horizon, risk factors and update history.</p></div><div className="grid gap-3 sm:grid-cols-3">{[["Discover", "Screen research ideas by strategy and risk."], ["Evaluate", "Read the rationale and disclosures."], ["Decide", "Act only through your own registered intermediary."]].map(([title, copy], index) => <div key={title} className="rounded-2xl bg-white/7 p-4"><span className="text-xs font-extrabold text-brand-cyan">0{index + 1}</span><p className="mt-3 font-bold">{title}</p><p className="mt-2 text-xs leading-5 text-white/60">{copy}</p></div>)}</div></div>}
          </div>
          <p className="mt-4 text-center text-[11px] leading-5 text-white/45">Sample information for product preview only. Securities-market investments are subject to market risk. Research tools do not constitute an offer, execution facility or guaranteed-return promise.</p>
        </div>
      </div>
    </section>
  );
}
