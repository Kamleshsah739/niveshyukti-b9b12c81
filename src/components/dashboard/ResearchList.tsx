import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getResearchReports, type ResearchReport } from "@/lib/supabase/research";

export default function ResearchList() {
  const [reports, setReports] = useState<ResearchReport[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const rows = await getResearchReports();
        if (!mounted) return;
        setReports(rows.slice(0, 6));
      } catch (loadError) {
        if (!mounted) return;
        setError(toErrorMessage(loadError, "Unable to load research reports."));
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">Latest Research</h2>
        <a href="#research" className="text-sm font-semibold text-brand-blue hover:underline">
          View All
        </a>
      </div>

      {error ? <p className="text-sm text-rose-600">{error}</p> : null}

      <ul className="space-y-3">
        {reports.map((report) => (
          <li key={report.id} className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="font-semibold text-foreground">{report.company ?? report.title ?? "Research Update"}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {report.research_code ?? "NY"} • {report.recommendation ?? "Research"}
            </p>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-muted-foreground">
                {report.created_at ? new Date(report.created_at).toLocaleDateString("en-IN") : "Recent"}
              </span>
              <a href="#research" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-blue hover:underline">
                Open <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
