import type { ChangeEvent } from "react";
import type { ResearchRecord } from "./ResearchRow";

interface ResearchFormProps {
  draft: ResearchRecord;
  isEditing: boolean;
  isSaving: boolean;
  feedback: string;
  onChange: <K extends keyof ResearchRecord>(field: K, value: ResearchRecord[K]) => void;
  onSaveDraft: () => void;
  onPublish: () => void;
  onCancel: () => void;
  onImportCsv: (file: File) => Promise<void>;
  onUploadAsset: (kind: "pdf" | "chart", file: File) => Promise<void>;
}

export default function ResearchForm({
  draft,
  isEditing,
  isSaving,
  feedback,
  onChange,
  onSaveDraft,
  onPublish,
  onCancel,
  onImportCsv,
  onUploadAsset,
}: ResearchFormProps) {
  const handleCsvChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await onImportCsv(file);
      event.target.value = "";
    }
  };

  const handleAssetChange = async (
    kind: "pdf" | "chart",
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      await onUploadAsset(kind, file);
      event.target.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:p-8">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-slate-900">
            {isEditing ? "Edit Research Report" : "Create Research Report"}
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Full-page editor with recommendation metadata, analysis blocks, and asset uploads.
          </p>
        </div>
        <div className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
          Research Code: {draft.research_code || "NY000001"}
        </div>
      </div>

      <form className="mt-6 space-y-6" noValidate>
        <div className="rounded-xl bg-slate-50 p-3 text-sm text-slate-600">{feedback}</div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Company</span>
            <input
              value={draft.company}
              onChange={(event) => onChange("company", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              placeholder="e.g. Reliance Industries"
              disabled={isSaving}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Sector</span>
            <input
              value={draft.sector}
              onChange={(event) => onChange("sector", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              placeholder="e.g. Energy"
              disabled={isSaving}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Recommendation</span>
            <select
              value={draft.recommendation}
              onChange={(event) => onChange("recommendation", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              disabled={isSaving}
            >
              <option value="BUY">BUY</option>
              <option value="HOLD">HOLD</option>
              <option value="SELL">SELL</option>
            </select>
          </label>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Current Price</span>
            <input
              type="number"
              step="0.01"
              value={draft.current_price ?? ""}
              onChange={(event) => onChange("current_price", event.target.value ? Number(event.target.value) : null)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              placeholder="0.00"
              disabled={isSaving}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Target</span>
            <input
              type="number"
              step="0.01"
              value={draft.target_price ?? ""}
              onChange={(event) => onChange("target_price", event.target.value ? Number(event.target.value) : null)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              placeholder="0.00"
              disabled={isSaving}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Stop Loss</span>
            <input
              type="number"
              step="0.01"
              value={draft.stop_loss ?? ""}
              onChange={(event) => onChange("stop_loss", event.target.value ? Number(event.target.value) : null)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              placeholder="0.00"
              disabled={isSaving}
            />
          </label>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Risk</span>
            <input
              value={draft.risk}
              onChange={(event) => onChange("risk", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              placeholder="Low / Medium / High"
              disabled={isSaving}
            />
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Time Horizon</span>
            <input
              value={draft.time_horizon}
              onChange={(event) => onChange("time_horizon", event.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
              placeholder="e.g. 6-12 months"
              disabled={isSaving}
            />
          </label>
        </div>

        <label className="block max-w-md space-y-2">
          <span className="text-sm font-medium text-slate-700">Homepage slider slot</span>
          <select
            value={draft.home_slider_slot ?? ""}
            onChange={(event) => onChange("home_slider_slot", event.target.value ? Number(event.target.value) : null)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            disabled={isSaving}
          >
            <option value="">Do not show on homepage</option>
            {[1, 2, 3, 4, 5, 6].map((slot) => <option key={slot} value={slot}>Homepage slide {slot}</option>)}
          </select>
          <p className="text-xs text-slate-500">Choose at most six published public recommendations. Each slot can have only one report.</p>
        </label>

        <label className="space-y-2 block">
          <span className="text-sm font-medium text-slate-700">Summary</span>
          <textarea
            rows={4}
            value={draft.summary}
            onChange={(event) => onChange("summary", event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            placeholder="Quick thesis and action summary"
            disabled={isSaving}
          />
        </label>

        <label className="space-y-2 block">
          <span className="text-sm font-medium text-slate-700">Detailed Analysis</span>
          <textarea
            rows={10}
            value={draft.detailed_analysis}
            onChange={(event) => onChange("detailed_analysis", event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            placeholder="Write the full report body here"
            disabled={isSaving}
          />
        </label>

        <label className="space-y-2 block">
          <span className="text-sm font-medium text-slate-700">Internal Title</span>
          <input
            value={draft.title}
            onChange={(event) => onChange("title", event.target.value)}
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
            placeholder="e.g. Reliance medium-term breakout"
            disabled={isSaving}
          />
        </label>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Upload PDF</p>
            <input
              type="file"
              accept="application/pdf"
              className="mt-3 block text-sm text-slate-600"
              onChange={(event) => {
                void handleAssetChange("pdf", event);
              }}
              disabled={isSaving}
            />
            {draft.pdf_url && (
              <a href={draft.pdf_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                View uploaded PDF
              </a>
            )}
          </div>

          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">Upload Chart</p>
            <input
              type="file"
              accept="image/*"
              className="mt-3 block text-sm text-slate-600"
              onChange={(event) => {
                void handleAssetChange("chart", event);
              }}
              disabled={isSaving}
            />
            {draft.chart_url && (
              <a href={draft.chart_url} target="_blank" rel="noreferrer" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
                View uploaded chart
              </a>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-sm font-medium text-slate-700">CSV Import</p>
          <p className="mt-1 text-sm text-slate-500">
            Upload a CSV with fields like company, sector, recommendation, current_price, target_price, stop_loss,
            risk, time_horizon, summary, detailed_analysis.
          </p>
          <input
            type="file"
            accept=".csv"
            className="mt-3 block text-sm text-slate-600"
            onChange={(event) => {
              void handleCsvChange(event);
            }}
            disabled={isSaving}
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onSaveDraft}
            className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            disabled={isSaving}
          >
            {isSaving ? "Saving..." : "Save Draft"}
          </button>
          <button
            type="button"
            onClick={onPublish}
            className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            disabled={isSaving}
          >
            {isSaving ? "Publishing..." : "Publish"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            disabled={isSaving}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
