import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Menu,
  X,
  ShieldCheck,
  BadgeCheck,
  Zap,
  Radio,
  TrendingUp,
  LineChart,
  Rocket,
  BookOpen,
  Target,
  BarChart3,
  Users,
  Sparkles,
  ArrowRight,
  Check,
  Star,
  ChevronDown,
  Layers,
  Wallet,
  GraduationCap,
} from "lucide-react";
import heroImg from "@/assets/hero-dashboard.jpg";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nivesh Yukti — Let Your Money Make More Money" },
      {
        name: "description",
        content:
          "Premium financial research platform. SEBI-compliant equity research, IPO analysis, options strategies and one-click broker execution.",
      },
    ],
  }),
  component: Landing,
});

const NAV = [
  { label: "Home", href: "#home" },
  { label: "Research", href: "#research" },
  { label: "IPO", href: "#ipo" },
  { label: "Performance", href: "#performance" },
  { label: "Pricing", href: "#pricing" },
  { label: "Academy", href: "#academy" },
  { label: "About", href: "#about" },
  { label: "Contact", href: "#contact" },
];

function Logo() {
  return (
    <a href="#home" className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand shadow-[var(--shadow-glow)]">
        <Sparkles className="h-5 w-5 text-white" strokeWidth={2.5} />
      </div>
      <div className="flex flex-col leading-none">
        <span className="font-display text-[15px] font-bold tracking-tight text-foreground">
          Nivesh Yukti
        </span>
        <span className="text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">
          Research • Invest
        </span>
      </div>
    </a>
  );
}

function Nav() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 12);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "py-2" : "py-4"
      }`}
    >
      <div className="mx-auto max-w-7xl px-4">
        <div
          className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 rounded-2xl px-4 py-2.5 transition-all lg:grid-cols-[auto_1fr_auto] ${
            scrolled ? "glass-strong" : "glass"
          }`}
        >
          <Logo />
          <nav className="hidden lg:flex items-center justify-center gap-1">
            {NAV.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className="rounded-full px-3.5 py-1.5 text-sm font-medium text-foreground/75 transition-colors hover:bg-white/70 hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              className="hidden sm:inline-flex rounded-full text-sm font-semibold"
            >
              Login
            </Button>
            <Button className="hidden sm:inline-flex rounded-full bg-gradient-brand text-white shadow-[var(--shadow-soft)] hover:opacity-95">
              Get Started
            </Button>
            <button
              onClick={() => setOpen((v) => !v)}
              className="lg:hidden grid h-10 w-10 place-items-center rounded-full glass"
              aria-label="Toggle menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="lg:hidden mt-2 glass-strong rounded-2xl p-3 animate-rise">
            <div className="flex flex-col">
              {NAV.map((n) => (
                <a
                  key={n.label}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-3 text-sm font-medium text-foreground/80 hover:bg-white/80"
                >
                  {n.label}
                </a>
              ))}
              <div className="mt-2 grid grid-cols-2 gap-2 px-1">
                <Button variant="outline" className="rounded-full">
                  Login
                </Button>
                <Button className="rounded-full bg-gradient-brand text-white">
                  Get Started
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

const TRUST = [
  { icon: ShieldCheck, label: "SEBI Compliant Research" },
  { icon: BadgeCheck, label: "NISM Certified Analyst" },
  { icon: Zap, label: "One-Click Broker Execution" },
  { icon: Radio, label: "Live IPO Tracking" },
];

function Hero() {
  return (
    <section id="home" className="relative pt-32 pb-16 md:pt-40 md:pb-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-12 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:items-center">
          <div className="animate-rise">
            <div className="inline-flex items-center gap-2 rounded-full glass px-3.5 py-1.5 text-xs font-semibold text-foreground/80">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-purple opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-purple" />
              </span>
              Let Your Money Make More Money
            </div>
            <h1 className="mt-5 font-display text-[42px] leading-[1.05] font-extrabold tracking-tight text-foreground sm:text-6xl lg:text-[68px]">
              Smart Research.
              <br />
              <span className="text-gradient">Smarter Investments.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
              Professional research, IPO analysis, options strategies, and
              instant broker execution — all in one premium platform built for
              serious Indian investors.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button
                size="lg"
                className="rounded-full bg-gradient-brand px-6 text-white shadow-[var(--shadow-glow)] hover:opacity-95"
              >
                Explore Research <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-2 bg-white/60 px-6 font-semibold backdrop-blur hover:bg-white"
              >
                Become Premium
              </Button>
            </div>
            <div className="mt-10 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              {TRUST.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-start gap-2 rounded-2xl glass p-3"
                >
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-brand text-white">
                    <Icon className="h-4 w-4" />
                  </div>
                  <span className="text-[11px] font-semibold leading-tight text-foreground/80">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 rounded-[3rem] bg-gradient-brand opacity-30 blur-3xl" />
            <div className="relative animate-float">
              <img
                src={heroImg}
                alt="Nivesh Yukti mobile dashboard showing portfolio, IPO widgets and research recommendations"
                width={1280}
                height={1280}
                className="relative w-full rounded-[2rem] shadow-[var(--shadow-glow)]"
              />
            </div>
            <div className="absolute -left-2 top-10 glass-strong rounded-2xl p-3 shadow-[var(--shadow-soft)] hidden sm:flex items-center gap-2.5 animate-float [animation-delay:1s]">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white">
                <TrendingUp className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-medium text-muted-foreground">
                  TCS • BUY
                </p>
                <p className="text-sm font-bold text-foreground">
                  +12.4% <span className="text-emerald-600">▲</span>
                </p>
              </div>
            </div>
            <div className="absolute -right-2 bottom-16 glass-strong rounded-2xl p-3 shadow-[var(--shadow-soft)] hidden sm:flex items-center gap-2.5 animate-float [animation-delay:2s]">
              <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white">
                <Rocket className="h-4 w-4" />
              </div>
              <div className="text-left">
                <p className="text-[10px] font-medium text-muted-foreground">
                  IPO Live
                </p>
                <p className="text-sm font-bold text-foreground">
                  Subscribed 4.2x
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { value: "10,000+", label: "Active Investors" },
  { value: "95%+", label: "Client Satisfaction" },
  { value: "500+", label: "Research Calls" },
  { value: "100%", label: "Transparent Reporting" },
];

function Stats() {
  return (
    <section className="pb-12 md:pb-20">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-3 rounded-3xl glass-strong p-4 md:grid-cols-4 md:gap-6 md:p-8">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl bg-white/70 p-4 text-center md:p-6"
            >
              <div className="text-3xl font-extrabold tracking-tight text-gradient md:text-4xl">
                {s.value}
              </div>
              <div className="mt-1 text-xs font-medium text-muted-foreground md:text-sm">
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SectionHeader({
  eyebrow,
  title,
  desc,
}: {
  eyebrow: string;
  title: string;
  desc?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-purple">
        {eyebrow}
      </div>
      <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {desc && (
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          {desc}
        </p>
      )}
    </div>
  );
}

const WHY = [
  {
    icon: ShieldCheck,
    title: "SEBI-Compliant Research",
    desc: "Every call is backed by rigorous analysis and full regulatory compliance.",
  },
  {
    icon: Zap,
    title: "One-Click Execution",
    desc: "Trade directly via Zerodha, Groww, Upstox and other leading brokers.",
  },
  {
    icon: LineChart,
    title: "Data-First Insights",
    desc: "Fundamentals, technicals and derivatives — combined into clear actions.",
  },
  {
    icon: Radio,
    title: "Real-Time Alerts",
    desc: "Instant push, WhatsApp and email alerts when the market moves.",
  },
  {
    icon: Target,
    title: "Transparent Performance",
    desc: "Every closed call is public. No cherry-picked screenshots.",
  },
  {
    icon: Users,
    title: "10,000+ Investor Community",
    desc: "Learn, share and grow with a curated community of serious investors.",
  },
];

function Why() {
  return (
    <section id="about" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Why Nivesh Yukti"
          title="Built for investors who take investing seriously."
          desc="A premium research desk in your pocket — combining professional analysis with instant execution."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {WHY.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group relative overflow-hidden rounded-3xl glass p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
            >
              <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-brand opacity-0 blur-2xl transition-opacity group-hover:opacity-30" />
              <div className="relative">
                <div className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-brand text-white shadow-[var(--shadow-soft)]">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 font-display text-lg font-bold text-foreground">
                  {title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const CATEGORIES = [
  {
    icon: TrendingUp,
    title: "Equity Research",
    tag: "Long Term",
    desc: "Fundamental picks with 6–24 month horizons.",
    stat: "+28% CAGR",
  },
  {
    icon: Layers,
    title: "Swing Trading",
    tag: "2–15 Days",
    desc: "Technical setups with clear entry, target and stoploss.",
    stat: "72% Accuracy",
  },
  {
    icon: BarChart3,
    title: "Options Strategies",
    tag: "F&O",
    desc: "Hedged spreads, iron condors and directional plays.",
    stat: "Risk-Defined",
  },
  {
    icon: Rocket,
    title: "IPO Analysis",
    tag: "Primary",
    desc: "GMP, valuation and subscribe/avoid recommendations.",
    stat: "Live Tracking",
  },
];

function Research() {
  return (
    <section id="research" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Research Categories"
          title="Four desks. One platform."
          desc="From long-term compounders to high-conviction options plays — coverage across every strategy."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {CATEGORIES.map(({ icon: Icon, title, tag, desc, stat }) => (
            <div
              key={title}
              className="flex flex-col rounded-3xl glass p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-glow)]"
            >
              <div className="flex items-center justify-between">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-brand text-white">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-brand-purple">
                  {tag}
                </span>
              </div>
              <h3 className="mt-5 font-display text-lg font-bold">{title}</h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground">
                {desc}
              </p>
              <div className="mt-4 border-t border-border/60 pt-4">
                <div className="text-xs text-muted-foreground">Highlight</div>
                <div className="mt-0.5 text-base font-bold text-gradient">
                  {stat}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const IPOS = [
  { name: "Bharat Skies", band: "₹ 420 – 445", sub: "8.2x", status: "Live" },
  { name: "Nova Energy", band: "₹ 210 – 235", sub: "4.1x", status: "Day 2" },
  { name: "Orion Tech", band: "₹ 785 – 820", sub: "12.6x", status: "Closing" },
];

function IPO() {
  return (
    <section id="ipo" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-purple">
              IPO Research
            </div>
            <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
              Never miss the next{" "}
              <span className="text-gradient">multibagger IPO.</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              Live GMP tracking, deep valuation notes, allotment probability and
              subscribe/avoid views — the moment the mandate opens.
            </p>
            <ul className="mt-6 space-y-3">
              {[
                "SEBI DRHP breakdowns in plain English",
                "Peer valuation & anchor investor analysis",
                "Real-time subscription and GMP tracker",
                "One-click apply via UPI (all brokers)",
              ].map((t) => (
                <li key={t} className="flex items-start gap-3">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-gradient-brand text-white">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-foreground/80">{t}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-3xl glass-strong p-5 md:p-7">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-red-500" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                  Live IPO Board
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                Updated just now
              </span>
            </div>
            <div className="mt-5 space-y-3">
              {IPOS.map((ipo) => (
                <div
                  key={ipo.name}
                  className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-white/80 p-4 transition-all hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-base font-bold">
                      {ipo.name}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      Price band {ipo.band}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Subscribed
                      </p>
                      <p className="text-sm font-extrabold text-gradient">
                        {ipo.sub}
                      </p>
                    </div>
                    <span className="rounded-full bg-gradient-brand px-3 py-1.5 text-[10px] font-bold uppercase text-white">
                      {ipo.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <Button className="mt-5 w-full rounded-2xl bg-gradient-brand text-white hover:opacity-95">
              View All IPOs <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

const PERF = [
  { name: "TCS", type: "Equity", ret: "+24.8%", period: "6M" },
  { name: "HDFC Bank", type: "Equity", ret: "+18.2%", period: "4M" },
  { name: "Nifty 24500 CE", type: "Options", ret: "+112%", period: "9D" },
  { name: "Adani Green", type: "Swing", ret: "+9.4%", period: "11D" },
  { name: "Reliance", type: "Equity", ret: "+15.6%", period: "5M" },
  { name: "Bank Nifty Spread", type: "Options", ret: "+42%", period: "2D" },
];

function Performance() {
  return (
    <section id="performance" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Performance Snapshot"
          title="Numbers we're proud to publish."
          desc="Live-tracked, timestamped, and fully transparent. No screenshots — only receipts."
        />
        <div className="mt-12 rounded-3xl glass-strong p-4 md:p-8">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {PERF.map((p) => (
              <div
                key={p.name}
                className="rounded-2xl bg-white/80 p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-brand-purple">
                    {p.type}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {p.period}
                  </span>
                </div>
                <p className="mt-2 truncate font-display text-base font-bold">
                  {p.name}
                </p>
                <p className="mt-1 text-xl font-extrabold text-emerald-600">
                  {p.ret}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

const STEPS = [
  {
    icon: Users,
    title: "Create your account",
    desc: "Sign up in under 60 seconds. Verify your KYC once.",
  },
  {
    icon: Wallet,
    title: "Connect your broker",
    desc: "Link Zerodha, Groww or Upstox for one-click execution.",
  },
  {
    icon: TrendingUp,
    title: "Receive research",
    desc: "Get SEBI-compliant calls with entry, target and stoploss.",
  },
  {
    icon: Zap,
    title: "Execute & grow",
    desc: "Trade in one tap. Track P&L. Compound over time.",
  },
];

function How() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="How It Works"
          title="From sign-up to your first trade in minutes."
        />
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <div key={s.title} className="relative rounded-3xl glass p-6">
              <div className="absolute -top-4 left-6 rounded-full bg-gradient-brand px-3 py-1 text-xs font-bold text-white shadow-[var(--shadow-soft)]">
                Step {i + 1}
              </div>
              <div className="mt-3 grid h-12 w-12 place-items-center rounded-2xl bg-white/80">
                <s.icon className="h-6 w-6 text-brand-purple" />
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{s.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const PLANS = [
  {
    name: "Starter",
    price: "₹ 0",
    period: "forever",
    desc: "Explore the platform with delayed research.",
    features: ["Daily market brief", "IPO calendar", "Community access"],
    cta: "Start Free",
    featured: false,
  },
  {
    name: "Premium",
    price: "₹ 1,499",
    period: "per month",
    desc: "The full research desk for serious investors.",
    features: [
      "Live equity + swing calls",
      "IPO subscribe/avoid views",
      "Options strategies",
      "One-click broker execution",
      "Priority WhatsApp alerts",
    ],
    cta: "Become Premium",
    featured: true,
  },
  {
    name: "Elite",
    price: "₹ 3,999",
    period: "per month",
    desc: "1-on-1 access to our analyst team.",
    features: [
      "Everything in Premium",
      "1:1 analyst calls",
      "Portfolio review",
      "Custom strategies",
    ],
    cta: "Talk to us",
    featured: false,
  },
];

function Pricing() {
  return (
    <section id="pricing" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Pricing"
          title="Simple plans. Serious value."
          desc="Cancel anytime. No hidden fees. GST included."
        />
        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-3xl p-7 transition-all hover:-translate-y-1 ${
                p.featured
                  ? "bg-gradient-brand text-white shadow-[var(--shadow-glow)]"
                  : "glass"
              }`}
            >
              {p.featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-brand-purple shadow-md">
                  Most Popular
                </div>
              )}
              <div
                className={`text-xs font-bold uppercase tracking-widest ${
                  p.featured ? "text-white/80" : "text-brand-purple"
                }`}
              >
                {p.name}
              </div>
              <div className="mt-4 flex items-baseline gap-2">
                <span className="font-display text-4xl font-extrabold">
                  {p.price}
                </span>
                <span
                  className={`text-sm ${
                    p.featured ? "text-white/80" : "text-muted-foreground"
                  }`}
                >
                  / {p.period}
                </span>
              </div>
              <p
                className={`mt-2 text-sm ${
                  p.featured ? "text-white/85" : "text-muted-foreground"
                }`}
              >
                {p.desc}
              </p>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-sm">
                    <div
                      className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                        p.featured ? "bg-white/25" : "bg-gradient-brand"
                      }`}
                    >
                      <Check
                        className={`h-3 w-3 ${
                          p.featured ? "text-white" : "text-white"
                        }`}
                        strokeWidth={3}
                      />
                    </div>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Button
                className={`mt-7 w-full rounded-full font-semibold ${
                  p.featured
                    ? "bg-white text-brand-purple hover:bg-white/90"
                    : "bg-gradient-brand text-white hover:opacity-95"
                }`}
              >
                {p.cta}
              </Button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const TESTIMONIALS = [
  {
    name: "Aarav Mehta",
    role: "Retail investor, Mumbai",
    quote:
      "The IPO calls alone paid for my subscription 10x over. Clear, timely and never overhyped.",
  },
  {
    name: "Priya Nair",
    role: "F&O trader, Bangalore",
    quote:
      "Their options strategies are risk-defined and actually make sense. Best research value in India.",
  },
  {
    name: "Rohit Sharma",
    role: "Long-term investor, Delhi",
    quote:
      "Finally a research desk that publishes every closed call. Full transparency is why I stay.",
  },
];

function Testimonials() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Testimonials"
          title="Loved by 10,000+ investors."
        />
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-3xl glass p-6">
              <div className="flex gap-0.5 text-amber-400">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/85">
                "{t.quote}"
              </p>
              <div className="mt-5 flex items-center gap-3 border-t border-border/60 pt-4">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-brand font-bold text-white">
                  {t.name.charAt(0)}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-bold">{t.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {t.role}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Academy() {
  return (
    <section id="academy" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-8 md:p-14">
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-gradient-brand opacity-30 blur-3xl" />
          <div className="absolute -left-16 -bottom-16 h-64 w-64 rounded-full bg-brand-cyan opacity-40 blur-3xl" />
          <div className="relative grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-purple">
                <GraduationCap className="h-3.5 w-3.5" /> Nivesh Academy
              </div>
              <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                Learn to invest.{" "}
                <span className="text-gradient">The right way.</span>
              </h2>
              <p className="mt-4 max-w-lg text-muted-foreground">
                Bite-sized courses on fundamentals, technicals, options and IPO
                investing — taught by NISM certified analysts.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Button className="rounded-full bg-gradient-brand text-white hover:opacity-95">
                  Browse Courses <BookOpen className="ml-1 h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  className="rounded-full border-2 bg-white/60"
                >
                  Watch Free Preview
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { t: "Equity 101", n: "12 lessons" },
                { t: "Options Masterclass", n: "18 lessons" },
                { t: "IPO Investing", n: "8 lessons" },
                { t: "Portfolio Design", n: "10 lessons" },
              ].map((c) => (
                <div
                  key={c.t}
                  className="rounded-2xl bg-white/85 p-4 transition-all hover:-translate-y-0.5 hover:shadow-[var(--shadow-soft)]"
                >
                  <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand text-white">
                    <BookOpen className="h-4 w-4" />
                  </div>
                  <p className="mt-3 text-sm font-bold">{c.t}</p>
                  <p className="text-[11px] text-muted-foreground">{c.n}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const FAQS = [
  {
    q: "Is Nivesh Yukti SEBI registered?",
    a: "Yes. All our research is published under SEBI Research Analyst compliance and is delivered by NISM-certified analysts.",
  },
  {
    q: "Which brokers can I connect?",
    a: "Zerodha, Groww, Upstox, Angel One, ICICI Direct and 10+ more brokers are supported for one-click execution.",
  },
  {
    q: "Are past performance figures verified?",
    a: "Every closed call is timestamped and published on our public performance page. No cherry-picking, no screenshots.",
  },
  {
    q: "Can I cancel my Premium plan anytime?",
    a: "Absolutely. Plans are month-on-month with no long-term lock-in. Cancel from your dashboard in one click.",
  },
  {
    q: "Do you offer 1-on-1 support?",
    a: "Yes — Elite subscribers get direct analyst calls, portfolio reviews and custom strategy consultations.",
  },
];

function FAQ() {
  return (
    <section className="py-16 md:py-24">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions? We've got answers."
        />
        <div className="mt-10 rounded-3xl glass p-2 md:p-4">
          <Accordion type="single" collapsible className="w-full">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border-b border-border/60 px-4 last:border-0"
              >
                <AccordionTrigger className="text-left text-base font-semibold hover:no-underline [&[data-state=open]>svg]:rotate-180">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}

function CTA() {
  return (
    <section id="contact" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-[2rem] bg-gradient-brand p-10 text-white md:p-16">
          <div className="absolute inset-0 opacity-30 [background:radial-gradient(600px_300px_at_20%_0%,white,transparent),radial-gradient(500px_300px_at_80%_100%,white,transparent)]" />
          <div className="relative grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-center">
            <div>
              <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl md:text-5xl">
                Start letting your money make more money.
              </h2>
              <p className="mt-4 max-w-xl text-white/85">
                Join 10,000+ investors who trust Nivesh Yukti for premium
                research, IPO analysis and one-click execution.
              </p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col lg:items-end">
              <Button
                size="lg"
                className="rounded-full bg-white px-6 font-semibold text-brand-purple hover:bg-white/90"
              >
                Become Premium <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="rounded-full border-2 border-white/70 bg-transparent px-6 font-semibold text-white hover:bg-white/10 hover:text-white"
              >
                Talk to an analyst
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function Footer() {
  const cols = [
    {
      title: "Product",
      items: ["Research", "IPO", "Performance", "Pricing", "Academy"],
    },
    {
      title: "Company",
      items: ["About", "Careers", "Press", "Contact", "Blog"],
    },
    {
      title: "Legal",
      items: ["Terms", "Privacy", "Disclosure", "SEBI Reg", "Refund Policy"],
    },
  ];
  return (
    <footer className="pt-8 pb-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="rounded-[2rem] glass-strong p-8 md:p-12">
          <div className="grid gap-10 md:grid-cols-[1.4fr_2fr]">
            <div>
              <Logo />
              <p className="mt-4 max-w-sm text-sm text-muted-foreground">
                Nivesh Yukti is a premium financial research platform. SEBI
                compliant. NISM certified. Investor first.
              </p>
              <p className="mt-4 text-[11px] text-muted-foreground">
                Investments in securities market are subject to market risks.
                Read all related documents carefully before investing.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3">
              {cols.map((c) => (
                <div key={c.title}>
                  <h4 className="text-xs font-bold uppercase tracking-widest text-foreground/80">
                    {c.title}
                  </h4>
                  <ul className="mt-4 space-y-2.5">
                    {c.items.map((i) => (
                      <li key={i}>
                        <a
                          href="#"
                          className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                        >
                          {i}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-6 sm:flex-row sm:items-center">
            <p className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} Nivesh Yukti. All rights reserved.
            </p>
            <p className="text-xs font-semibold text-gradient">
              Let Your Money Make More Money.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function Landing() {
  return (
    <div className="min-h-screen">
      <Nav />
      <main>
        <Hero />
        <Stats />
        <Why />
        <Research />
        <IPO />
        <Performance />
        <How />
        <Pricing />
        <Testimonials />
        <Academy />
        <FAQ />
        <CTA />
      </main>
      <Footer />
    </div>
  );
}
