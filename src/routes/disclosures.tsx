import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, BadgeInfo, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";

export const Route = createFileRoute("/disclosures")({
  component: DisclosuresPage,
  head: () => ({
    meta: [
      { title: "Important disclosures | Nivesh Yukti" },
      {
        name: "description",
        content: "Important research, data and risk disclosures for Nivesh Yukti.",
      },
    ],
  }),
});

function DisclosuresPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 md:py-12">
      <div className="mx-auto max-w-3xl">
        <a href="/" className="inline-flex items-center gap-2 text-sm font-semibold text-brand-blue hover:underline">
          <ArrowLeft className="h-4 w-4" /> Back to Nivesh Yukti
        </a>

        <section className="mt-5 rounded-[2rem] bg-[linear-gradient(135deg,#071b18,#17463e)] p-7 text-white shadow-[var(--shadow-glow)] md:p-10">
          <div className="flex items-center gap-2 text-sm font-semibold text-brand-cyan">
            <BadgeInfo className="h-5 w-5" /> Important information
          </div>
          <h1 className="mt-4 font-display text-4xl font-extrabold tracking-tight md:text-5xl">Research and risk disclosures</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-white/75 md:text-base">
            Please read this page before using market data, the stock screener, IPO tracker or educational content on Nivesh Yukti.
          </p>
        </section>

        <div className="mt-6 space-y-4">
          <DisclosureCard icon={ShieldCheck} title="Research only, not personalised advice">
            Nivesh Yukti provides general information, research tools and educational content. It does not assess your individual financial situation, execute trades, manage portfolios or guarantee outcomes.
          </DisclosureCard>
          <DisclosureCard icon={AlertTriangle} title="Market and data risk">
            Securities involve risk. Prices, fundamentals, technical indicators and IPO details can be delayed, incomplete or revised. Free data feeds may have limited coverage. Verify important information using company filings and official exchange notices before acting.
          </DisclosureCard>
          <DisclosureCard icon={BadgeInfo} title="Your decisions remain your responsibility">
            Do your own research and consider your objectives, risk tolerance and time horizon. If you need personalised advice, consult a suitably qualified and registered professional independently.
          </DisclosureCard>
          <DisclosureCard icon={ShieldCheck} title="Account safety">
            Never share passwords, one-time passwords, PAN, bank credentials or brokerage login details through this website. Nivesh Yukti does not need them to provide its public research tools.
          </DisclosureCard>
        </div>
      </div>
    </main>
  );
}

function DisclosureCard({ icon: Icon, title, children }: { icon: typeof BadgeInfo; title: string; children: ReactNode }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="flex gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-secondary text-brand-blue">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-foreground">{title}</h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{children}</p>
        </div>
      </div>
    </section>
  );
}
