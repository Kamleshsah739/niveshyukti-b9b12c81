import { useEffect, useMemo, useState } from "react";

import {
  type Audience,
  type ResearchReport,
  createResearch,
  deleteResearch,
  getResearchReports,
  uploadResearchAsset,
  updateResearch,
} from "@/lib/supabase/research";
import { supabase } from "@/lib/supabase/client";

import ResearchForm from "./ResearchForm";
import type { ResearchRecord } from "./ResearchRow";
import ResearchTable from "./ResearchTable";

type Status = "draft" | "published";

const emptyDraft: ResearchRecord = {
  id: "",
  created_by: "",
  research_code: "",
  company: "",
  sector: "",
  title: "Untitled report",
  recommendation: "BUY",
  current_price: null,
  target_price: null,
  stop_loss: null,
  risk: "",
  time_horizon: "",
  summary: "",
  detailed_analysis: "",
  pdf_url: "",
  chart_url: "",
  audience: "public",
  published: false,
  created_at: "",
  updated_at: "",
  home_slider_slot: null,
};

export default function ResearchManager() {
  const [records, setRecords] = useState<ResearchRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [draft, setDraft] = useState<ResearchRecord>(emptyDraft);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [audienceFilter, setAudienceFilter] = useState<"all" | Audience>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | Status>("all");
  const [feedback, setFeedback] = useState("Loading research reports from Supabase...");

  useEffect(() => {
    let isMounted = true;

    const loadReports = async () => {
      try {
        const [sessionResult, data] = await Promise.all([
          supabase.auth.getSession(),
          getResearchReports(),
        ]);
        if (!isMounted) {
          return;
        }

        setCurrentUserId(sessionResult.data.session?.user.id ?? null);

        const mapped = data
          .map(mapResearchRow)
          .sort((a, b) => b.created_at.localeCompare(a.created_at));

        setRecords(mapped);
        setFeedback(`Loaded ${mapped.length} research report${mapped.length === 1 ? "" : "s"}.`);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setFeedback(getErrorMessage(error, "Failed to load research reports."));
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadReports();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredRecords = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    return records.filter((record) => {
      const matchesSearch =
        query.length === 0 ||
        [
          record.research_code,
          record.company,
          record.sector,
          record.title,
          record.recommendation,
          record.summary,
          record.detailed_analysis,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query);

      const matchesAudience = audienceFilter === "all" || record.audience === audienceFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "published" ? record.published : !record.published);

      return matchesSearch && matchesAudience && matchesStatus;
    });
  }, [records, searchTerm, audienceFilter, statusFilter]);

  const openNewReport = () => {
    setDraft({ ...emptyDraft, research_code: generateResearchCode(records) });
    setIsFormOpen(true);
    setFeedback("Create a new research report and assign the next unique code.");
  };

  const openEditReport = (record: ResearchRecord) => {
    setDraft(record);
    setIsFormOpen(true);
    setFeedback(`Editing ${record.research_code}.`);
  };

  const saveReport = async (mode: "draft" | "publish") => {
    if (isSaving) {
      return;
    }

    if (!draft.company.trim() || !draft.summary.trim() || !draft.detailed_analysis.trim()) {
      setFeedback("Company, summary, and detailed analysis are required.");
      return;
    }

    const published = mode === "publish";
    const now = new Date().toISOString();

    try {
      setIsSaving(true);

      if (draft.id) {
        const payload = {
          company: draft.company.trim(),
          sector: draft.sector.trim() || null,
          title: draft.title.trim(),
          recommendation: draft.recommendation.trim(),
          current_price: draft.current_price,
          target_price: draft.target_price,
          stop_loss: draft.stop_loss,
          risk: draft.risk.trim() || null,
          time_horizon: draft.time_horizon.trim() || null,
          summary: draft.summary.trim(),
          detailed_analysis: draft.detailed_analysis.trim(),
          pdf_url: draft.pdf_url.trim() || null,
          chart_url: draft.chart_url.trim() || null,
          audience: draft.audience,
          ...(draft.home_slider_slot ? { home_slider_slot: draft.home_slider_slot } : {}),
          published,
          updated_at: now,
        };

        await updateResearch(draft.id, payload);

        setRecords((current) =>
          current.map((record) =>
            record.id === draft.id
              ? {
                  ...record,
                  ...payload,
                }
              : record
          )
        );

        setFeedback(`${draft.research_code} ${published ? "published" : "saved as draft"}.`);
      } else {
        if (!currentUserId) {
          setFeedback("Unable to create report: user session not found.");
          return;
        }

        const nextCode = generateResearchCode(records);
        const payload = {
          research_code: nextCode,
          created_by: currentUserId,
          company: draft.company.trim(),
          sector: draft.sector.trim() || null,
          title: draft.title.trim(),
          recommendation: draft.recommendation.trim(),
          current_price: draft.current_price,
          target_price: draft.target_price,
          stop_loss: draft.stop_loss,
          risk: draft.risk.trim() || null,
          time_horizon: draft.time_horizon.trim() || null,
          summary: draft.summary.trim(),
          detailed_analysis: draft.detailed_analysis.trim(),
          pdf_url: draft.pdf_url.trim() || null,
          chart_url: draft.chart_url.trim() || null,
          audience: draft.audience,
          ...(draft.home_slider_slot ? { home_slider_slot: draft.home_slider_slot } : {}),
          published,
          created_at: now,
          updated_at: now,
        };

        const created = await createResearch(payload);
        const mapped = mapResearchRow(created);

        setRecords((current) => [mapped, ...current]);
        setFeedback(`${mapped.research_code} ${published ? "published" : "saved as draft"}.`);
      }

      setIsFormOpen(false);
      setDraft(emptyDraft);
    } catch (error) {
      const message = getErrorMessage(error, "Unable to save this report.");
      setFeedback(
        /home_slider_slot|schema cache/i.test(message)
          ? "Report could not save because the homepage-slider database migration is pending. Run docs/Research-Slider-Migration.sql in Supabase, then try again."
          : message,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteReport = async (record: ResearchRecord) => {
    if (isSaving) {
      return;
    }

    if (!window.confirm(`Delete ${record.research_code}?`)) {
      return;
    }

    try {
      setIsSaving(true);
      await deleteResearch(record.id);
      setRecords((current) => current.filter((item) => item.id !== record.id));
      setFeedback(`${record.research_code} removed from the admin list.`);
    } catch (error) {
      setFeedback(getErrorMessage(error, `Failed to delete ${record.research_code}.`));
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublish = async (record: ResearchRecord) => {
    if (isSaving) {
      return;
    }

    const nextPublished = !record.published;
    const now = new Date().toISOString();

    try {
      setIsSaving(true);
      await updateResearch(record.id, {
        published: nextPublished,
        updated_at: now,
      });

      setRecords((current) =>
        current.map((item) =>
          item.id === record.id
            ? {
                ...item,
                published: nextPublished,
                updated_at: now,
              }
            : item
        )
      );
      setFeedback(`${record.research_code} ${nextPublished ? "published" : "unpublished"}.`);
    } catch (error) {
      setFeedback(getErrorMessage(error, `Failed to update publish status for ${record.research_code}.`));
    } finally {
      setIsSaving(false);
    }
  };

  const importCsv = async (file: File) => {
    if (isSaving) {
      return;
    }

    const text = await file.text();
    const rows = text
      .split(/\r?\n/)
      .map((row) => row.trim())
      .filter((row) => row.length > 0);

    if (rows.length < 2) {
      setFeedback("The CSV file does not contain any report rows.");
      return;
    }

    const headers = parseCsvRow(rows[0]).map((header) => header.toLowerCase());
    const importedRows = rows.slice(1);
    const createdReports: ResearchRecord[] = [];

    try {
      setIsSaving(true);

      if (!currentUserId) {
        setFeedback("Unable to import: user session not found.");
        return;
      }

      for (const row of importedRows) {
        const values = parseCsvRow(row);
        const rowData: Record<string, string> = {};

        headers.forEach((header, index) => {
          rowData[header] = values[index] ?? "";
        });

        const company = (rowData.company ?? "").trim();
        const sector = (rowData.sector ?? "").trim();
        const title = (rowData.title ?? `${company} Research Report`).trim();
        const recommendation = (rowData.recommendation ?? "BUY").trim().toUpperCase();
        const summary = (rowData.summary ?? "").trim();
        const detailedAnalysis = (rowData.detailed_analysis ?? "").trim();

        if (!company || !summary || !detailedAnalysis) {
          continue;
        }

        const audience: Audience = rowData.audience?.toLowerCase() === "paid" ? "paid" : "public";
        const published = rowData.published?.toLowerCase() === "true";
        const currentPrice = toNullableNumber(rowData.current_price);
        const targetPrice = toNullableNumber(rowData.target_price ?? rowData.target);
        const stopLoss = toNullableNumber(rowData.stop_loss);
        const now = new Date().toISOString();
        const nextCode = generateResearchCode([...records, ...createdReports]);

        const payload = {
          research_code: nextCode,
          created_by: currentUserId,
          company,
          sector: sector || null,
          title,
          recommendation,
          current_price: currentPrice,
          target_price: targetPrice,
          stop_loss: stopLoss,
          risk: (rowData.risk ?? "").trim() || null,
          time_horizon: (rowData.time_horizon ?? "").trim() || null,
          summary,
          detailed_analysis: detailedAnalysis,
          pdf_url: (rowData.pdf_url ?? "").trim() || null,
          chart_url: (rowData.chart_url ?? "").trim() || null,
          audience,
          published,
          created_at: now,
          updated_at: now,
        };

        const created = await createResearch(payload);
        createdReports.push(mapResearchRow(created));
      }

      if (createdReports.length === 0) {
        setFeedback(`No valid rows were found in ${file.name}.`);
        return;
      }

      setRecords((current) => [...createdReports, ...current]);
      setFeedback(`${createdReports.length} research report${createdReports.length === 1 ? "" : "s"} imported successfully.`);
    } catch (error) {
      setFeedback(getErrorMessage(error, "CSV import failed before completion."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadAsset = async (kind: "pdf" | "chart", file: File) => {
    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      const url = await uploadResearchAsset(file, kind);
      const now = new Date().toISOString();

      const nextDraft =
        kind === "pdf"
          ? { ...draft, pdf_url: url }
          : { ...draft, chart_url: url };

      if (draft.id) {
        const payload = {
          pdf_url: nextDraft.pdf_url || null,
          chart_url: nextDraft.chart_url || null,
          updated_at: now,
        };

        await updateResearch(draft.id, payload);

        setRecords((currentRecords) =>
          currentRecords.map((item) =>
            item.id === draft.id
              ? {
                  ...item,
                  ...payload,
                }
              : item
          )
        );
      }

      setDraft(nextDraft);
      setFeedback(
        draft.id
          ? `${kind.toUpperCase()} uploaded and saved to ${draft.research_code}.`
          : `${kind.toUpperCase()} uploaded. Save draft/publish to persist this URL.`
      );
    } catch (error) {
      setFeedback(
        getErrorMessage(
          error,
          `Failed to upload ${kind}. Create a 'research-assets' bucket in Supabase Storage if it does not exist.`
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  const publishedCount = records.filter((record) => record.published).length;
  const draftCount = records.length - publishedCount;

  if (isFormOpen) {
    return (
      <div className="space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Research Editor</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900">{draft.id ? "Edit Report" : "New Report"}</h2>
              <p className="mt-1 text-sm text-slate-600">Full-page editor for detailed recommendation publishing.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (isSaving) {
                  return;
                }
                setIsFormOpen(false);
                setDraft(emptyDraft);
              }}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              disabled={isSaving}
            >
              Back to Reports
            </button>
          </div>
        </div>

        <ResearchForm
          draft={draft}
          isEditing={Boolean(draft.id)}
          isSaving={isSaving}
          feedback={feedback}
          onChange={(field, value) => setDraft((current) => ({ ...current, [field]: value }))}
          onSaveDraft={() => {
            void saveReport("draft");
          }}
          onPublish={() => {
            void saveReport("publish");
          }}
          onCancel={() => {
            if (isSaving) {
              return;
            }
            setIsFormOpen(false);
            setDraft(emptyDraft);
            setFeedback("Form dismissed. No changes were saved.");
          }}
          onImportCsv={importCsv}
          onUploadAsset={handleUploadAsset}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-600">Admin Module</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Research Reports</h2>
            <p className="mt-2 max-w-2xl text-sm text-slate-600">
              Manage research reports with unique NY codes, CRUD actions, search, filters, publish controls, and CSV import.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={openNewReport}
              disabled={isLoading || isSaving}
              className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              + Add Report
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Total reports</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">{records.length}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Published</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-600">{publishedCount}</p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Drafts</p>
            <p className="mt-2 text-2xl font-semibold text-amber-600">{draftCount}</p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="mb-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-600">
          {isLoading ? "Loading research reports..." : feedback}
        </div>

        <ResearchTable
          items={filteredRecords}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          audienceFilter={audienceFilter}
          statusFilter={statusFilter}
          onAudienceFilterChange={setAudienceFilter}
          onStatusFilterChange={setStatusFilter}
          onEdit={openEditReport}
          onDelete={handleDeleteReport}
          onTogglePublish={handleTogglePublish}
        />
      </div>

    </div>
  );
}

function mapResearchRow(row: ResearchReport): ResearchRecord {
  return {
    id: row.id,
    created_by: row.created_by ?? "",
    research_code: row.research_code ?? "",
    company: row.company ?? "",
    sector: row.sector ?? "",
    title: row.title ?? "",
    recommendation: row.recommendation ?? "BUY",
    current_price: row.current_price ?? null,
    target_price: row.target_price ?? null,
    stop_loss: row.stop_loss ?? null,
    risk: row.risk ?? "",
    time_horizon: row.time_horizon ?? "",
    summary: row.summary ?? "",
    detailed_analysis: row.detailed_analysis ?? "",
    pdf_url: row.pdf_url ?? "",
    chart_url: row.chart_url ?? "",
    audience: row.audience === "paid" ? "paid" : "public",
    published: Boolean(row.published),
    created_at: row.created_at ?? "",
    updated_at: row.updated_at ?? row.created_at ?? "",
    home_slider_slot: row.home_slider_slot ?? null,
  };
}

function generateResearchCode(existing: ResearchRecord[]) {
  const numbers = existing
    .map((item) => Number(item.research_code.replace(/^NY/, "")))
    .filter((value) => Number.isFinite(value));

  const next = numbers.length > 0 ? Math.max(...numbers) + 1 : 1;
  return `NY${String(next).padStart(6, "0")}`;
}

function parseCsvRow(row: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < row.length; i += 1) {
    const char = row[i];

    if (char === '"') {
      const nextChar = row[i + 1];
      if (inQuotes && nextChar === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current.trim());
  return values;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const trimmed = error.message?.trim();
    if (trimmed) {
      return trimmed;
    }
  }

  if (error && typeof error === "object") {
    const candidate = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
      error_description?: unknown;
    };

    const segments = [
      candidate.message,
      candidate.details,
      candidate.hint,
      candidate.error_description,
      candidate.code ? `code: ${String(candidate.code)}` : "",
    ]
      .map((value) => (typeof value === "string" ? value.trim() : ""))
      .filter((value) => value.length > 0);

    if (segments.length > 0) {
      return segments.join(" | ");
    }
  }

  return fallback;
}

function toNullableNumber(value?: string): number | null {
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
