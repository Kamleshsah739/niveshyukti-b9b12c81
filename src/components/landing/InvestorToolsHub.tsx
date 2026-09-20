import { useMemo, useState } from "react";
import { Calculator, ChevronRight, ClipboardCheck, Search, Sparkles } from "lucide-react";

type Tool = "screener" | "calculator" | "checklist";

const tools: Array<{ id: Tool; label: string; icon: typeof Sparkles }> = [
  { id: "screener", label: "Stock screener", icon: Search },
  { id: "calculator", label: "SIP calculator", icon: Calculator },
  { id: "checklist", label: "Risk checklist", icon: ClipboardCheck },
];

function Money({ value }: { value: number }) {
  return <>{new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(value)}</>;
}

export default function InvestorToolsHub() {
  const [active, setActive] = useState<Tool>("screener");
  const [monthly, setMonthly] = useState(5000);
  const [rate, setRate] = useState(12);
  const [years, setYears] = useState(10);
  const sip = useMemo(() => {
    const months = Math.max(years, 1) * 12;
    const monthlyRate = Math.max(rate, 0) / 1200;
    const contribution = Math.max(monthly, 0);
    const invested = contribution * months;
    const value = monthlyRate === 0 ? invested : contribution * (((1 + monthlyRate) ** months - 1) / monthlyRate) * (1 + monthlyRate);
    return { invested, value: Math.round(value) };
  }, [monthly, rate, years]);

  return (
    <section id="tools" className="py-10 md:py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="overflow-hidden rounded-[2rem] border border-emerald-100/15 bg-[radial-gradient(circle_at_85%_8%,rgba(72,214,184,0.22),transparent_32%),linear-gradient(145deg,#071c19,#0d302b)] p-5 text-white shadow-[var(--shadow-glow)] md:p-8">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/8 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-emerald-100"><Sparkles className="h-3.5 w-3.5 text-brand-cyan" /> Investor toolkit</div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl">Useful tools for informed investing.</h2>
            <p className="mt-3 text-sm leading-6 text-white/70 sm:text-base">Use the live stock screener, calculate an illustrative SIP value, and review a simple decision checklist. No tool here is a recommendation or execution facility.</p>
          </div>
          <div className="mt-7 flex gap-2 overflow-x-auto pb-1">
            {tools.map(({ id, label, icon: Icon }) => <button key={id} type="button" onClick={() => setActive(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-full px-4 py-2 text-xs font-bold transition ${active === id ? "bg-white text-[#0b2722]" : "bg-white/8 text-white/70 hover:bg-white/15 hover:text-white"}`}><Icon className="h-3.5 w-3.5" /> {label}</button>)}
          </div>
          <div className="mt-5 rounded-[1.5rem] border border-white/12 bg-[#041512]/55 p-4 md:p-6">
            {active === "screener" && <div className="grid gap-5 md:grid-cols-[1.1fr_0.9fr] md:items-center"><div><p className="text-lg font-bold">Live Indian-stock screener</p><p className="mt-2 text-sm leading-6 text-white/65">Filter the available end-of-day NSE dataset by sector, valuation, quality and technical fields. Coverage and freshness are shown in the screener itself.</p><a href="/screener" className="mt-5 inline-flex items-center rounded-full bg-white px-4 py-2.5 text-sm font-bold text-[#0b2722] transition hover:bg-emerald-100">Open stock screener <ChevronRight className="ml-1 h-4 w-4" /></a></div><div className="rounded-2xl bg-white/7 p-5"><Search className="h-7 w-7 text-brand-cyan" /><p className="mt-4 font-bold">Verify before acting</p><p className="mt-2 text-sm leading-6 text-white/60">Use official exchange filings and company disclosures to validate any figure important to your decision.</p></div></div>}
            {active === "calculator" && <div className="grid gap-5 md:grid-cols-[1fr_0.85fr]"><div><p className="text-lg font-bold">SIP calculator</p><p className="mt-1 text-sm text-white/60">Explore how a regular contribution may grow. This illustration does not predict or guarantee returns.</p><div className="mt-5 grid gap-3 sm:grid-cols-3">{[["Monthly amount", monthly, setMonthly, 500], ["Annual return", rate, setRate, 1], ["Investment years", years, setYears, 1]].map(([label, value, setter, step]) => <label key={String(label)} className="rounded-xl bg-white/7 p-3 text-xs font-bold text-white/70">{String(label)}<div className="mt-2 flex items-center gap-1 text-white"><span className="text-sm">{label === "Annual return" ? "%" : label === "Investment years" ? "Y" : "₹"}</span><input aria-label={String(label)} type="number" min="0" step={Number(step)} value={Number(value)} onChange={(event) => (setter as (value: number) => void)(Number(event.target.value))} className="w-full bg-transparent text-base font-extrabold outline-none" /></div></label>)}</div></div><div className="rounded-2xl bg-[linear-gradient(145deg,rgba(89,227,196,0.24),rgba(255,255,255,0.08))] p-5"><p className="text-xs font-bold uppercase tracking-wider text-white/55">Illustrative value</p><p className="mt-2 text-4xl font-extrabold">₹<Money value={sip.value} /></p><div className="mt-6 space-y-2 border-t border-white/15 pt-4 text-sm"><div className="flex justify-between text-white/65"><span>Amount invested</span><span>₹<Money value={sip.invested} /></span></div><div className="flex justify-between font-bold text-brand-cyan"><span>Illustrative gain</span><span>₹<Money value={Math.max(sip.value - sip.invested, 0)} /></span></div></div></div></div>}
            {active === "checklist" && <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[["Source", "Did you check the latest company filing or official exchange notice?"], ["Business", "Do you understand how the company earns, competes and manages debt?"], ["Risk", "Could you tolerate a material fall without disrupting your financial goals?"], ["Time horizon", "Does the decision suit your cash needs and investment timeframe?"]].map(([title, copy], index) => <article key={title} className="rounded-2xl bg-white/7 p-5"><span className="text-xs font-extrabold text-brand-cyan">0{index + 1}</span><p className="mt-3 font-bold">{title}</p><p className="mt-2 text-xs leading-5 text-white/60">{copy}</p></article>)}</div>}
          </div>
          <p className="mt-4 text-center text-[11px] leading-5 text-white/45">Securities-market investments are subject to market risk. Tools are for general research and education only.</p>
        </div>
      </div>
    </section>
  );
}
