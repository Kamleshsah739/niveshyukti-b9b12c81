import { useEffect, useState } from "react";
import { BarChart3, Check, ShieldCheck, X } from "lucide-react";

const outcomes = [
  { label: "Equity research", value: "In-depth", tone: "from-emerald-300 to-emerald-500" },
  { label: "Market updates", value: "Daily", tone: "from-cyan-300 to-brand-blue" },
  { label: "IPO coverage", value: "Timely", tone: "from-amber-200 to-amber-400" },
];

export default function ResearchSignupPrompt() {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem("nivesh-yukti-signup-prompt-dismissed")) return;
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
    const timer = window.setTimeout(() => setOpen(true), 900);
    return () => window.clearTimeout(timer);
  }, []);

  const dismiss = () => {
    setOpen(false);
    try {
      window.sessionStorage.setItem("nivesh-yukti-signup-prompt-dismissed", "true");
    } catch {
      // The prompt is still dismissed for this page view if storage is unavailable.
    }
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] grid place-items-center bg-[#020c0a]/75 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="research-signup-title"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) dismiss();
      }}
    >
      <div
        className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#071b18] p-5 text-white shadow-[0_30px_100px_rgba(0,0,0,0.55)] sm:p-7"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="absolute inset-x-0 top-0 h-48 bg-[radial-gradient(circle_at_50%_0%,rgba(70,225,185,0.27),transparent_68%)]" />
        <button type="button" onClick={dismiss} aria-label="Close sign-up prompt" className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/10 text-white/75 transition hover:bg-white/20 hover:text-white">
          <X className="h-4 w-4" />
        </button>

        <div className="relative text-center">
          <div className="mx-auto grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-white shadow-[var(--shadow-glow)]"><BarChart3 className="h-6 w-6" /></div>
          <p className="mt-4 text-xs font-bold uppercase tracking-[0.16em] text-brand-cyan">Nivesh Yukti research desk</p>
          <h2 id="research-signup-title" className="mt-2 font-display text-3xl font-extrabold leading-tight">Better context for every market move.</h2>
          <p className="mx-auto mt-3 max-w-sm text-sm leading-6 text-white/65">Get research notes, IPO analysis and important market updates in one focused place.</p>
        </div>

        <div className="relative mt-6 grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 p-3">
          {outcomes.map((item) => <div key={item.label} className="text-center"><div className={`mx-auto flex h-20 max-w-[64px] items-end rounded-t-xl bg-gradient-to-t ${item.tone} p-2 shadow-[0_12px_25px_-13px_rgba(84,222,188,0.8)]`}><span className="w-full text-center text-[11px] font-extrabold text-[#07211c]">{item.value}</span></div><p className="mt-2 text-[10px] font-semibold leading-tight text-white/55">{item.label}</p></div>)}
        </div>

        <div className="relative mt-5 space-y-2"><div className="flex items-center gap-2 text-xs text-white/65"><Check className="h-3.5 w-3.5 text-brand-cyan" /> Research and information only — no trade execution</div><div className="flex items-center gap-2 text-xs text-white/65"><ShieldCheck className="h-3.5 w-3.5 text-brand-cyan" /> Your number is used only for account access and updates</div></div>

        <form className="relative mt-6 flex rounded-2xl bg-white p-1.5 shadow-lg" onSubmit={(event) => { event.preventDefault(); window.location.assign(`/auth/login${phone ? `?phone=${encodeURIComponent(phone)}` : ""}`); }}>
          <label className="flex min-w-0 flex-1 items-center gap-2 px-3"><span className="text-base" aria-hidden="true">🇮🇳</span><span className="border-r border-slate-200 pr-2 text-xs font-bold text-slate-600">+91</span><input value={phone} onChange={(event) => setPhone(event.target.value.replace(/\D/g, "").slice(0, 10))} inputMode="numeric" autoComplete="tel" placeholder="Enter your mobile number" aria-label="Mobile number" className="min-w-0 flex-1 bg-transparent text-sm font-medium text-slate-800 outline-none placeholder:text-slate-400" /></label>
          <button type="submit" className="rounded-xl bg-[#082922] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#0d4035]">Continue</button>
        </form>
        <p className="relative mt-3 text-center text-[10px] leading-4 text-white/40">Investments in securities are subject to market risks. Read all related documents carefully.</p>
      </div>
    </div>
  );
}
