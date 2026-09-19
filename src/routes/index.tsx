import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

import {
  createFileRoute,
  useNavigate,
} from "@tanstack/react-router";

import {
  Menu,
  X,
  ShieldCheck,
  BadgeCheck,
  Zap,
  Radio,
  TrendingUp,
  LineChart,
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
  Camera,
  Send,
  Play,
  MessageCircle,
  Newspaper,
  Clock3,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import UserIpoSection from "@/components/ipo/UserIpoSection";
import StockResearchHub from "@/components/dashboard/StockResearchHub";
import HomeRecommendationCarousel from "@/components/landing/HomeRecommendationCarousel";
import InvestorToolsHub from "@/components/landing/InvestorToolsHub";
import ResearchSignupPrompt from "@/components/landing/ResearchSignupPrompt";
import MarketNewsSection from "@/components/landing/MarketNewsSection";
import { getAccessLevel, type AccessLevel } from "@/lib/access";
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nivesh Yukti — Let Your Money Make More Money" },
      {
        name: "description",
        content:
          "Premium financial research platform. SEBI-compliant equity research, IPO analysis and research-only research on stocks, F&O and commodities.",
      },
    ],
  }),
  component: Landing,
});

const NAV = [
  { label: "Home", href: "#home" },
  { label: "Research", href: "#research" },
  { label: "Screener", href: "/screener" },
  { label: "Investor Tools", href: "#tools" },
  { label: "News & Updates", href: "#news" },
  { label: "IPO", href: "#ipo" },
  { label: "Performance", href: "#performance" },
  { label: "Pricing", href: "#pricing" },
  { label: "Academy", href: "#academy" },
  { label: "About", href: "#about" },
  { label: "Community", href: "#Community" },
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
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [access, setAccess] = useState<AccessLevel>("user");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser();
      setUser(data.user);
      if (data.user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single();
        setRole(profile?.role ?? null);
        if (data.user) setAccess(await getAccessLevel(data.user.id));
      }
    }

    loadUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", session.user.id)
          .single()
          .then(({ data: profile }) => setRole(profile?.role ?? null));
        getAccessLevel(session.user.id).then(setAccess);
      } else {
        setRole(null);
        setAccess("user");
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        scrolled ? "py-1" : "py-2"
      }`}
    >
      <div className="mx-auto max-w-7xl px-3 md:px-4">
        <div
          className={`grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5 rounded-2xl px-3 py-1.5 transition-all lg:grid-cols-[auto_1fr_auto] ${
            scrolled ? "glass-strong" : "glass"
          }`}
        >
          <Logo />
          <nav className="hidden lg:flex items-center justify-center gap-0.5">
            {NAV.map((n) => (
              <a
                key={n.label}
                href={n.href}
                className="rounded-full px-2.5 py-1.5 text-xs font-semibold text-foreground/80 transition-colors hover:bg-white/70 hover:text-foreground"
              >
                {n.label}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 rounded-full border border-border bg-card/75 px-3 py-1.5 text-foreground hover:bg-card">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-white font-bold">
                      {user.user_metadata?.full_name?.charAt(0) ??
                        user.email?.charAt(0).toUpperCase()}
                    </div>

                    <span className="hidden md:block text-sm font-semibold">
                      {user.user_metadata?.full_name ?? user.email}
                    </span>
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end">
                  {access === "premium" ? <DropdownMenuItem onClick={() => navigate({ to: "/premium" })}>Premium research</DropdownMenuItem> : null}

                  {role === "super_admin" ? (
                    <DropdownMenuItem onClick={() => navigate({ to: "/admin" })}>
                      Super Admin Panel
                    </DropdownMenuItem>
                  ) : null}

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={async () => {
                      await supabase.auth.signOut();
                      navigate({ to: "/" });
                    }}
                  >
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                variant="ghost"
                className="hidden sm:inline-flex rounded-full text-sm font-semibold"
                onClick={() => navigate({ to: "/auth/login" })}
              >
                Login
              </Button>
            )}

            {!user ? (
              <Button asChild className="hidden sm:inline-flex rounded-full bg-gradient-brand text-white shadow-[var(--shadow-soft)] hover:opacity-95">
                <a href="/auth/login">Get Started</a>
              </Button>
            ) : null}

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
          <div className="lg:hidden mt-2 glass-strong rounded-2xl p-2.5 animate-rise">
            <div className="flex flex-col">
              {NAV.map((n) => (
                <a
                  key={n.label}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-4 py-2.5 text-[13px] font-semibold text-foreground/80 hover:bg-white/80"
                >
                  {n.label}
                </a>
              ))}

              <div className="mt-2 grid grid-cols-2 gap-2 px-1">
                {user ? (
                  <div className="flex items-center gap-3 px-2 py-2">
                    <img
                      src={user.user_metadata.avatar_url}
                      alt=""
                      className="h-10 w-10 rounded-full"
                    />

                    <div>
                      <p className="font-semibold">{user.user_metadata.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      className="rounded-full"
                      onClick={() => navigate({ to: "/auth/login" })}
                    >
                      Login
                    </Button>

                    {!user ? (
                      <Button asChild className="rounded-full bg-gradient-brand text-white">
                        <a href="/auth/login">Get Started</a>
                      </Button>
                    ) : null}
                  </>
                )}
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
  { icon: Zap, label: "Research Only — No Execution" },
  { icon: Radio, label: "Live IPO Tracking" },
];

function Hero() {
  return (
    <section id="home" className="relative pt-16 pb-8 md:pt-20 md:pb-10">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-100/15 bg-[radial-gradient(circle_at_82%_18%,rgba(58,181,152,0.35)_0%,rgba(14,36,37,0.28)_34%,rgba(7,18,20,0.96)_68%),linear-gradient(145deg,#06130f_0%,#0e2a25_52%,#19443b_100%)] p-5 text-white shadow-[0_30px_80px_-24px_rgba(34,128,104,0.58)] md:p-7">
          <div className="relative grid gap-7 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div className="animate-rise">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/90">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-brand-cyan opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-brand-cyan" />
                </span>
                SEBI Registered Advisory
              </div>

              <h1 className="mt-4 font-display text-3xl font-extrabold leading-[1.08] tracking-tight sm:text-4xl lg:text-6xl">
                Invest with clarity.
                <br />
                <span className="text-brand-cyan">Research that puts you first.</span>
              </h1>

              <p className="mt-4 max-w-xl text-sm leading-6 text-white/78 sm:text-base">
                Independent research, market news, IPO analysis and timely recommendations for Indian investors. We never execute trades or handle your money.
              </p>

              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Button
                  asChild
                  size="lg"
                  className="rounded-full bg-brand-blue px-5 text-sm text-white shadow-[var(--shadow-glow)] hover:bg-brand-blue/90"
                >
                  <a href="#research">
                    Explore Research <ArrowRight className="ml-1 h-4 w-4" />
                  </a>
                </Button>

                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="rounded-full border-2 border-white/35 bg-white/10 px-5 text-sm font-semibold text-white backdrop-blur hover:bg-white/20"
                >
                  <a href="#news">Market Updates</a>
                </Button>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-2.5 lg:grid-cols-4">
                {TRUST.map(({ icon: Icon, label }) => (
                  <div
                    key={label}
                    className="flex min-h-[64px] items-center gap-2.5 rounded-2xl border border-white/20 bg-white/10 px-3 py-2.5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] backdrop-blur"
                  >
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[linear-gradient(145deg,rgba(243,191,99,0.92),rgba(84,222,188,0.92))] text-white shadow-[0_8px_20px_-8px_rgba(84,222,188,0.65)]">
                      <Icon className="h-4.5 w-4.5" />
                    </div>
                    <span className="text-[11px] font-bold leading-tight text-white/88 sm:text-xs">
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative">
              <HomeRecommendationCarousel />
              <div className="hidden">
              <div className="relative overflow-hidden rounded-[1.5rem] border border-emerald-100/25 bg-[#071b18]/85 p-4 shadow-[var(--shadow-glow)] backdrop-blur sm:p-5">
                <div className="mb-4 flex items-center justify-between gap-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-white/70 sm:text-xs">
                  <span>Research Analyst Desk</span>
                  <span className="rounded-full bg-emerald-300/20 px-3 py-1 text-emerald-200">
                    Live Market Research
                  </span>
                </div>

                <div className="rounded-[1.25rem] border border-white/15 bg-[#03120f] p-4">
                  <div className="grid gap-4 sm:grid-cols-[1.1fr_0.9fr]">
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">
                            Equity Research Call
                          </p>
                          <h3 className="mt-2 text-xl font-extrabold text-white">
                            Reliance Industries
                          </h3>
                          <p className="mt-1 text-xs text-white/55">NSE: RELIANCE</p>
                        </div>

                        <div className="rounded-full bg-emerald-400/15 px-3 py-1 text-[10px] font-bold text-emerald-200">
                          BUY
                        </div>
                      </div>

                      <div className="mt-5 grid grid-cols-3 gap-2">
                        {[
                          ["Entry", "₹2,840"],
                          ["Target", "₹3,120"],
                          ["Stop Loss", "₹2,720"],
                        ].map(([label, value]) => (
                          <div key={label} className="rounded-xl bg-white/7 p-3">
                            <p className="text-[9px] font-semibold uppercase tracking-wider text-white/45">
                              {label}
                            </p>
                            <p className="mt-1 text-sm font-bold text-white">{value}</p>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4">
                        <div className="mb-2 flex items-center justify-between text-xs text-white/55">
                          <span>Confidence Score</span>
                          <span className="font-bold text-emerald-200">82%</span>
                        </div>
                        <div className="h-2 rounded-full bg-white/10">
                          <div className="h-full w-[82%] rounded-full bg-gradient-to-r from-brand-cyan to-emerald-300" />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-xl bg-white/7 p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-widest text-white/45">
                        Analyst Notes
                      </p>

                      <div className="mt-3 space-y-2.5">
                        {[
                          "Breakout above resistance zone",
                          "Strong delivery volume build-up",
                          "Risk managed with defined stop loss",
                        ].map((note) => (
                          <div key={note} className="flex gap-2 text-xs leading-5 text-white/75">
                            <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                            <span>{note}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-4 rounded-xl border border-amber-200/20 bg-amber-300/10 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-200">
                          Risk Level
                        </p>
                        <p className="mt-1 text-base font-bold text-white">Moderate</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

const STATS = [
  { value: "1,000+", label: "Active Investors" },
  { value: "90%+", label: "Client Satisfaction" },
  { value: "500+", label: "Research Calls" },
  { value: "100%", label: "Transparent Reporting" },
];

function Stats() {
  return (
    <section className="pb-10 md:pb-14">
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
    icon: LineChart,
    title: "Data-First Insights",
    desc: "Fundamentals, technicals and derivatives — combined into clear actions.",
  },
  {
    icon: Radio,
    title: "Real-Time Alerts",
    desc: "Instant push, WhatsApp alerts when the market moves.",
  },
  {
    icon: Target,
    title: "Transparent Performance",
    desc: "Every closed call is public. No cherry-picked screenshots.",
  },
  {
    icon: Users,
    title: "1,000+ Investor Community",
    desc: "Learn, share and grow with a curated community of serious investors.",
  },
];

function Why() {
  return (
    <section id="about" className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Why Nivesh Yukti"
          title="Built for investors who take investing seriously."
          desc="A premium research desk in your pocket — combining professional analysis with instant execution."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
    title: "F&O & Commodity Ideas",
    tag: "F&O",
    desc: "High-conviction FNO and commodity recommendations with defined risk plans.",
    stat: "Risk-Defined",
  },
];

function Research() {
  return (
    <section id="research" className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Research Categories"
          title="Four desks. One platform."
          desc="From long-term compounders to high-conviction options plays — coverage across every strategy."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="mt-8">
          <StockResearchHub />
        </div>
      </div>
    </section>
  );
}

const MARKET_UPDATES = [
  {
    category: "Market outlook",
    title: "The week ahead: key levels, events and sectors to watch",
    summary:
      "Our research desk maps the macro events, earnings themes and technical levels that could shape the week.",
    time: "Weekly research note",
    featured: true,
  },
  {
    category: "Company update",
    title: "What to look for in the next earnings season",
    summary:
      "A focused checklist for interpreting management commentary, margins and guidance without the noise.",
    time: "Research brief",
  },
  {
    category: "Investor education",
    title: "How to read a recommendation and assess its risk",
    summary:
      "Understand time horizon, invalidation levels and why a research view is not a trade instruction.",
    time: "Investor guide",
  },
];

function News() {
  return (
    <section id="news" className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="News & Updates"
          title="Market context, without the noise."
          desc="Stay informed with curated market updates, research notes and investor education from our analyst desk."
        />
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr_1fr]">
          {MARKET_UPDATES.map((update) => (
            <article
              key={update.title}
              className={`group flex flex-col rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] ${
                update.featured
                  ? "bg-[linear-gradient(145deg,#0a2924,#123c34)] text-white shadow-[var(--shadow-soft)]"
                  : "glass"
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <div
                  className={`grid h-11 w-11 place-items-center rounded-2xl ${
                    update.featured ? "bg-white/12 text-brand-cyan" : "bg-gradient-brand text-white"
                  }`}
                >
                  <Newspaper className="h-5 w-5" />
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    update.featured ? "bg-white/10 text-white/75" : "bg-white/80 text-brand-purple"
                  }`}
                >
                  {update.category}
                </span>
              </div>
              <h3 className="mt-6 font-display text-xl font-extrabold leading-snug">{update.title}</h3>
              <p className={`mt-3 flex-1 text-sm leading-relaxed ${update.featured ? "text-white/70" : "text-muted-foreground"}`}>
                {update.summary}
              </p>
              <div className={`mt-6 flex items-center gap-2 border-t pt-4 text-xs font-semibold ${update.featured ? "border-white/15 text-white/65" : "border-border/60 text-muted-foreground"}`}>
                <Clock3 className="h-3.5 w-3.5" />
                {update.time}
              </div>
            </article>
          ))}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">
          Nivesh Yukti provides research and information only. We do not provide trade execution, broking, or portfolio management services.
        </p>
      </div>
    </section>
  );
}

function IPO() {
  return (
    <section id="ipo" className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div>
          <UserIpoSection />
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
    <section id="performance" className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Performance Snapshot"
          title="Numbers we're proud to publish."
        />
        <div className="mt-6 rounded-3xl glass-strong p-4 md:p-6">
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

const PRICING_FEATURES = [
  "Premium Equity Research",
  "Options Research",
  "IPO Research",
  "Live Market Alerts",
  "WhatsApp Support",
];

function PricingCard({
  plan,
  original,
  offer,
  badge,
  badgeColor,
  featured,
}: {
  plan: string;
  original: string;
  offer: string;
  badge: string;
  badgeColor: string;
  featured?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-[2rem] p-7 transition-all duration-300 hover:-translate-y-2 hover:shadow-[var(--shadow-glow)] ${
        featured
          ? "glass-strong ring-2 ring-brand-purple/40"
          : "glass"
      }`}
    >
      {featured && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-gradient-brand px-4 py-1 text-[11px] font-bold uppercase tracking-widest text-white shadow-md">
          Most Popular
        </div>
      )}
      <div className="text-xs font-bold uppercase tracking-widest text-brand-purple">
        {plan}
      </div>
      <div className="mt-5 flex items-center gap-3">
        <span className="text-lg text-muted-foreground line-through">
          {original}
        </span>
        <span
          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}
        >
          {badge}
        </span>
      </div>
      <div className="mt-1 font-display text-5xl font-extrabold tracking-tight text-foreground">
        {offer}
      </div>
      <ul className="mt-6 flex-1 space-y-3">
        {PRICING_FEATURES.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-foreground/85">
            <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gradient-brand">
              <Check className="h-3 w-3 text-white" strokeWidth={3} />
            </div>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <Button asChild className="mt-7 w-full rounded-full bg-gradient-brand text-white font-semibold shadow-[var(--shadow-soft)] hover:opacity-95 transition-opacity">
        <a href="/auth/login">Join Now</a>
      </Button>
    </div>
  );
}

function Pricing() {
  return (
    <section id="pricing" className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Pricing"
          title="Invest in your wealth."
          desc="Premium research at a fraction of the cost. No hidden fees. GST included."
        />
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PricingCard
            plan="Monthly Plan"
            original="₹10,000"
            offer="₹2,999"
            badge="Limited Time Offer"
            badgeColor="bg-emerald-50 text-emerald-700"
          />
          <PricingCard
            plan="Quarterly Plan"
            original="₹20,000"
            offer="₹5,999"
            badge="Save 70%"
            badgeColor="bg-emerald-50 text-emerald-700"
            featured
          />
          <PricingCard
            plan="Yearly Plan"
            original="₹35,000"
            offer="₹12,999"
            badge="Best Value"
            badgeColor="bg-emerald-50 text-emerald-700"
          />
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
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <SectionHeader
          eyebrow="Testimonials"
          title="Loved by 1,000+ investors."
        />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
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
    <section id="academy" className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="relative overflow-hidden rounded-[2rem] glass-strong p-7 md:p-10">
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
                <Button asChild className="rounded-full bg-gradient-brand text-white hover:opacity-95">
                  <a href="#academy">
                    Browse Courses <BookOpen className="ml-1 h-4 w-4" />
                  </a>
                </Button>
                <Button
                  asChild
                  variant="outline"
                  className="rounded-full border-2 bg-white/60"
                >
                  <a href="#Community">Join Nivesh Yukti</a>
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { t: "Equity 101", n: "12 lessons" },
                { t: "Options Masterclass", n: "18 lessons" },
                { t: "IPO Investing", n: "8 lessons" },
                { t: "Risk Management", n: "10 lessons" },
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
    q: "How do I act on research?",
    a: "Apply the recommendation through your broker or trading app — we publish the research, you place the trade.",
  },
  {
    q: "Are past performance figures verified?",
    a: "Every closed call is timestamped and published on our public performance page. No cherry-picking, no screenshots.",
  },
  {
    q: "Can I cancel my Premium plan anytime?",
    a: "Absolutely. Plans are month-on-month with no long-term lock-in. Cancel from your dashboard anytime.",
  },
  {
    q: "Do you offer 1-on-1 support?",
    a: "Yes — Elite subscribers get direct analyst calls and research-focused strategy consultations.",
  },
];

function FAQ() {
  return (
    <section className="py-8 md:py-12">
      <div className="mx-auto max-w-3xl px-4">
        <SectionHeader
          eyebrow="FAQ"
          title="Questions? We've got answers."
        />
        <div className="mt-6 rounded-3xl glass p-2 md:p-4">
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

const SOCIAL_COMMUNITY = [
  {
    name: "Instagram",
    value: "2.5L+",
    label: "Followers",
    cta: "Follow us",
    href: "https://instagram.com",
    icon: Camera,
    iconBg: "bg-[linear-gradient(135deg,#833AB4_0%,#FD1D1D_55%,#FCAF45_100%)]",
    valueClass: "text-[#e1306c]",
  },
  {
    name: "Telegram",
    value: "3.0L+",
    label: "Members",
    cta: "Join Channel",
    href: "https://t.me",
    icon: Send,
    iconBg: "bg-[#2AABEE]",
    valueClass: "text-[#2AABEE]",
  },
  {
    name: "YouTube",
    value: "1.4L+",
    label: "Subscribers",
    cta: "Subscribe",
    href: "https://youtube.com",
    icon: Play,
    iconBg: "bg-[#FF0000]",
    valueClass: "text-[#FF0000]",
  },
  {
    name: "WhatsApp",
    value: "4.2L+",
    label: "Community",
    cta: "Join Group",
    href: "https://whatsapp.com",
    icon: MessageCircle,
    iconBg: "bg-[#25D366]",
    valueClass: "text-[#25D366]",
  },
] as const;

function CTA() {
  return (
    <section id="Community" className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-blue md:text-sm">
            Join Nivesh Yukti Community
          </p>
          <h2 className="mt-3 font-display text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-5xl md:text-6xl">
            Join thousands of Indians who invest with more clarity
          </h2>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {SOCIAL_COMMUNITY.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.name}
                className="rounded-3xl border border-border/70 bg-card/75 p-7 text-center shadow-[var(--shadow-card)]"
              >
                <div className={`mx-auto grid h-20 w-20 place-items-center rounded-2xl text-white ${item.iconBg}`}>
                  <Icon className="h-11 w-11" strokeWidth={2.1} />
                </div>

                <h3 className="mt-5 text-[38px] font-bold uppercase tracking-[0.08em] text-foreground md:text-[40px]">
                  {item.name}
                </h3>
                <p className={`mt-4 text-6xl font-extrabold tracking-tight ${item.valueClass}`}>
                  {item.value}
                </p>
                <p className="mt-2 text-2xl text-foreground/85">{item.label}</p>

                <a
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-5 inline-flex items-center gap-2 text-2xl font-semibold text-brand-blue transition-colors hover:text-brand-purple"
                >
                  {item.cta}
                  <ArrowRight className="h-5 w-5" />
                </a>
              </div>
            );
          })}
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
                          href={footerLink(i)}
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
          <div className="mt-8 flex flex-col items-start justify-between gap-3 border-t border-border/60 pt-5 sm:flex-row sm:items-center">
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
      <ResearchSignupPrompt />
      <main>
        <Hero />
        <Stats />
        <Why />
        <Research />
        <InvestorToolsHub />
        <MarketNewsSection />
        <IPO />
        <Performance />
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

function footerLink(item: string): string {
  const links: Record<string, string> = {
    Research: "#research",
    IPO: "#ipo",
    Performance: "#performance",
    Pricing: "#pricing",
    Academy: "#academy",
    About: "#about",
    Contact: "#contact",
    Terms: "#contact",
    Privacy: "#contact",
    Disclosure: "#contact",
    "SEBI Reg": "#contact",
    "Refund Policy": "#contact",
    Careers: "mailto:careers@niveshyukti.com",
    Press: "mailto:press@niveshyukti.com",
    Blog: "#home",
    Product: "#home",
    Company: "#about",
    Legal: "#contact",
  };

  return links[item] ?? "#contact";
}
