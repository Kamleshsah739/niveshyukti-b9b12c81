import { useEffect, useState } from "react";
import { ArrowRight, Clock3, Newspaper } from "lucide-react";
import { getPublishedMarketNews, type MarketNewsItem } from "@/lib/supabase/news";

const fallbackNews: MarketNewsItem[] = [
  { id: "market-outlook", category: "Market outlook", title: "The week ahead: key levels, events and sectors to watch", summary: "Our research desk maps the macro events, earnings themes and technical levels that could shape the week.", source_name: "Nivesh Yukti", source_url: "#research", published_at: null, image_url: null, featured: true, published: true },
  { id: "company-update", category: "Company update", title: "What to look for in the next earnings season", summary: "A focused checklist for interpreting management commentary, margins and guidance without the noise.", source_name: "Nivesh Yukti", source_url: "#research", published_at: null, image_url: null, featured: false, published: true },
  { id: "education", category: "Investor education", title: "How to read a recommendation and assess its risk", summary: "Understand time horizon, invalidation levels and why a research view is not a trade instruction.", source_name: "Nivesh Yukti", source_url: "#academy", published_at: null, image_url: null, featured: false, published: true },
];

function timeLabel(value: string | null): string {
  if (!value) return "Research brief";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Latest update";
  return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(date);
}

export default function MarketNewsSection() {
  const [items, setItems] = useState<MarketNewsItem[]>(fallbackNews);

  useEffect(() => {
    void getPublishedMarketNews(3).then((news) => {
      if (news.length > 0) setItems(news);
    }).catch(() => undefined);
  }, []);

  return (
    <section id="news" className="py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mx-auto max-w-2xl text-center">
          <div className="inline-flex items-center gap-1.5 rounded-full glass px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-brand-purple">News & Updates</div>
          <h2 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl md:text-5xl">Market context, without the noise.</h2>
          <p className="mt-4 text-base text-muted-foreground sm:text-lg">Curated market updates, research notes and investor education from our analyst desk.</p>
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.35fr_1fr_1fr]">
          {items.map((item, index) => {
            const featured = index === 0 || item.featured;
            return <article key={item.id} className={`group flex flex-col rounded-3xl p-6 transition-all hover:-translate-y-1 hover:shadow-[var(--shadow-glow)] ${featured ? "bg-[linear-gradient(145deg,#0a2924,#123c34)] text-white shadow-[var(--shadow-soft)]" : "glass"}`}>
              <div className="flex items-center justify-between gap-3"><div className={`grid h-11 w-11 place-items-center rounded-2xl ${featured ? "bg-white/12 text-brand-cyan" : "bg-gradient-brand text-white"}`}><Newspaper className="h-5 w-5" /></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${featured ? "bg-white/10 text-white/75" : "bg-white/80 text-brand-purple"}`}>{item.category ?? "Markets"}</span></div>
              <h3 className="mt-6 font-display text-xl font-extrabold leading-snug">{item.title}</h3>
              {item.summary ? <p className={`mt-3 flex-1 text-sm leading-relaxed ${featured ? "text-white/70" : "text-muted-foreground"}`}>{item.summary}</p> : null}
              <div className={`mt-6 flex items-center justify-between gap-3 border-t pt-4 text-xs font-semibold ${featured ? "border-white/15 text-white/65" : "border-border/60 text-muted-foreground"}`}><span className="inline-flex items-center gap-2"><Clock3 className="h-3.5 w-3.5" />{timeLabel(item.published_at)}</span><a href={item.source_url} target={item.source_url.startsWith("http") ? "_blank" : undefined} rel={item.source_url.startsWith("http") ? "noreferrer" : undefined} className={`inline-flex items-center gap-1 ${featured ? "text-brand-cyan" : "text-brand-blue"}`}>Read <ArrowRight className="h-3.5 w-3.5" /></a></div>
            </article>;
          })}
        </div>
        <p className="mt-5 text-center text-xs text-muted-foreground">Nivesh Yukti provides research and information only. We do not provide trade execution, broking, or portfolio management services.</p>
      </div>
    </section>
  );
}
