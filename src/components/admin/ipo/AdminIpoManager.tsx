import { useEffect, useMemo, useState } from "react";
import {
  checkIpoSyncHealth,
  createIpo,
  deleteIpo,
  getAllIpos,
  getLatestIpoSyncRun,
  syncIposFromFreeApi,
  type IpoSyncHealthResult,
  type IpoSyncResult,
  type IpoSyncRun,
  updateIpo,
  type IpoRecord,
  type IpoStatus,
} from "@/lib/supabase/ipo";

type FormState = Omit<IpoRecord, "id" | "created_at" | "updated_at">;

const emptyForm: FormState = {
  source_key: null,
  company_name: "",
  symbol: null,
  issue_open_date: null,
  issue_close_date: null,
  listing_date: null,
  price_band: null,
  lot_size: null,
  issue_size: null,
  gmp: null,
  merchant_banker: null,
  anchor_investors: null,
  subscription: null,
  status: "upcoming",
  source_name: null,
  external_url: null,
  summary: null,
  my_recommendation: null,
  published: false,
};

export default function AdminIpoManager() {
  const [items, setItems] = useState<IpoRecord[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [feedback, setFeedback] = useState("Loading IPO entries...");
  const [isSaving, setIsSaving] = useState(false);
  const [latestSync, setLatestSync] = useState<IpoSyncRun | null>(null);
  const [healthFeedback, setHealthFeedback] = useState("Run health check to verify runtime secrets and role access.");
  const [healthResult, setHealthResult] = useState<IpoSyncHealthResult | null>(null);
  const [appOrigin, setAppOrigin] = useState("https://your-domain.com");

  useEffect(() => {
    void loadIpos();
    void loadLatestSync();
    if (typeof window !== "undefined") {
      setAppOrigin(window.location.origin);
    }
  }, []);

  const publishedCount = useMemo(
    () => items.filter((item) => item.published).length,
    [items]
  );

  const loadIpos = async () => {
    try {
      const data = await getAllIpos();
      setItems(data);
      setFeedback(`Loaded ${data.length} IPO entries.`);
    } catch (error) {
      setFeedback(getErrorMessage(error, "Failed to load IPO entries."));
    }
  };

  const loadLatestSync = async () => {
    try {
      const data = await getLatestIpoSyncRun();
      setLatestSync(data);
    } catch {
      setLatestSync(null);
    }
  };

  const syncFromApi = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      const result: IpoSyncResult = await syncIposFromFreeApi();
      await loadIpos();
      await loadLatestSync();
      const sourceLabel = result.sources.length > 0 ? result.sources.join(", ") : "available free feeds";
      setFeedback(`API sync complete. ${result.synced} entries upserted from ${sourceLabel}. My Recommendation stays admin-controlled.`);
    } catch (error) {
      setFeedback(getErrorMessage(error, "Could not sync IPO API feed."));
    } finally {
      setIsSaving(false);
    }
  };

  const runHealthCheck = async () => {
    if (isSaving) return;
    try {
      setIsSaving(true);
      const result = await checkIpoSyncHealth();
      setHealthResult(result);
      setHealthFeedback(result.message);
    } catch (error) {
      setHealthResult(null);
      setHealthFeedback(getErrorMessage(error, "Could not run sync health check."));
    } finally {
      setIsSaving(false);
    }
  };

  const startEdit = (item: IpoRecord) => {
    setEditingId(item.id);
    setForm({
      source_key: item.source_key,
      company_name: item.company_name,
      symbol: item.symbol,
      issue_open_date: item.issue_open_date,
      issue_close_date: item.issue_close_date,
      listing_date: item.listing_date,
      price_band: item.price_band,
      lot_size: item.lot_size,
      issue_size: item.issue_size,
      gmp: item.gmp,
      merchant_banker: item.merchant_banker,
      anchor_investors: item.anchor_investors,
      subscription: item.subscription,
      status: item.status,
      source_name: item.source_name,
      external_url: item.external_url,
      summary: item.summary,
      my_recommendation: item.my_recommendation,
      published: Boolean(item.published),
    });
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(emptyForm);
  };

  const saveEntry = async () => {
    if (isSaving) return;
    if (!form.company_name.trim()) {
      setFeedback("Company name is required.");
      return;
    }

    const payload: FormState = {
      ...form,
      company_name: form.company_name.trim(),
      symbol: normalizeNullable(form.symbol),
      source_key: normalizeNullable(form.source_key),
      issue_open_date: normalizeNullable(form.issue_open_date),
      issue_close_date: normalizeNullable(form.issue_close_date),
      listing_date: normalizeNullable(form.listing_date),
      price_band: normalizeNullable(form.price_band),
      lot_size: normalizeNullable(form.lot_size),
      issue_size: normalizeNullable(form.issue_size),
      gmp: normalizeNullable(form.gmp),
      merchant_banker: normalizeNullable(form.merchant_banker),
      anchor_investors: normalizeNullable(form.anchor_investors),
      subscription: normalizeNullable(form.subscription),
      external_url: normalizeNullable(form.external_url),
      source_name: normalizeNullable(form.source_name),
      summary: normalizeNullable(form.summary),
      my_recommendation: normalizeNullable(form.my_recommendation),
      status: (form.status ?? "upcoming") as IpoStatus,
      published: Boolean(form.published),
    };

    try {
      setIsSaving(true);
      if (editingId) {
        await updateIpo(editingId, {
          ...payload,
          updated_at: new Date().toISOString(),
        });
        setFeedback("IPO entry updated.");
      } else {
        await createIpo({
          ...payload,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
        setFeedback("IPO entry created.");
      }

      await loadIpos();
      resetForm();
    } catch (error) {
      setFeedback(getErrorMessage(error, "Failed to save IPO entry."));
    } finally {
      setIsSaving(false);
    }
  };

  const removeEntry = async (id: string) => {
    if (isSaving) return;
    if (!window.confirm("Delete this IPO entry?")) return;

    try {
      setIsSaving(true);
      await deleteIpo(id);
      await loadIpos();
      setFeedback("IPO entry deleted.");
      if (editingId === id) {
        resetForm();
      }
    } catch (error) {
      setFeedback(getErrorMessage(error, "Failed to delete IPO entry."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">IPO Control Room</h2>
            <p className="mt-1 text-sm text-slate-600">Publish IPO data to website + app and manually maintain My Recommendation.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => void runHealthCheck()}
              disabled={isSaving}
              className="rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
            >
              Run Sync Health Check
            </button>
            <button
              type="button"
              onClick={() => void syncFromApi()}
              disabled={isSaving}
              className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
            >
              Sync Free API
            </button>
          </div>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">{feedback}</div>

        <div className="mt-3 rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Manual Sync Health</h4>
          <p className="mt-2 text-sm text-slate-700">{healthFeedback}</p>
          {healthResult ? (
            <div className="mt-3 grid gap-2 text-sm text-slate-700 md:grid-cols-2 lg:grid-cols-4">
              <HealthFlag label="SUPABASE_URL" ok={healthResult.runtime.supabaseUrl} />
              <HealthFlag label="SUPABASE_ANON_KEY" ok={healthResult.runtime.anonKey} />
              <HealthFlag label="SERVICE_ROLE_KEY" ok={healthResult.runtime.serviceRoleKey} />
              <HealthFlag label="IPO_SYNC_TOKEN" ok={healthResult.runtime.syncToken} />
              <HealthFlag label="FMP_API_KEY" ok={healthResult.runtime.fmpApiKey} />
              <HealthFlag label="ALPHA_VANTAGE_API_KEY" ok={healthResult.runtime.alphaVantageApiKey} />
              <HealthFlag label="FINNHUB_API_KEY" ok={healthResult.runtime.finnhubApiKey} />
              <div className="rounded-lg bg-slate-50 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-slate-500">Role</p>
                <p className="mt-1 font-semibold text-slate-900">{healthResult.role}</p>
              </div>
            </div>
          ) : null}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total IPOs" value={String(items.length)} />
          <Stat label="Published" value={String(publishedCount)} />
          <Stat label="Draft" value={String(items.length - publishedCount)} />
          <Stat label="Source" value="Multi-feed + Manual" />
        </div>

        <div className="mt-4 rounded-xl border border-slate-200 bg-white p-4">
          <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Last Auto Sync Status</h4>
          {latestSync ? (
            <div className="mt-2 grid gap-2 text-sm text-slate-700 md:grid-cols-3">
              <p>
                <span className="font-medium text-slate-900">Status:</span>{" "}
                {latestSync.status === "success" ? "Success" : "Failure"}
              </p>
              <p>
                <span className="font-medium text-slate-900">Rows Synced:</span> {latestSync.synced_count}
              </p>
              <p>
                <span className="font-medium text-slate-900">Ran At:</span>{" "}
                {new Date(latestSync.ran_at).toLocaleString()}
              </p>
              <p className="md:col-span-3">
                <span className="font-medium text-slate-900">Source:</span> {latestSync.source}
              </p>
              {latestSync.error_message ? (
                <p className="md:col-span-3 rounded-lg bg-rose-50 px-3 py-2 text-rose-700">
                  {latestSync.error_message}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-600">No auto-sync runs logged yet.</p>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <h4 className="font-semibold">Cloudflare Auto Sync Notes</h4>
          <p className="mt-2">Use Cloudflare Worker Cron Trigger for automated sync.</p>
          <p className="mt-1">Endpoint: {appOrigin}/api/ipo-sync</p>
          <p className="mt-1">Method: POST</p>
          <p className="mt-1">Header: x-sync-token: your_ipo_sync_token</p>
          <p className="mt-1">Suggested schedule: every 30-60 minutes during market hours.</p>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">{editingId ? "Edit IPO" : "Add IPO"}</h3>

        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Input label="Company" value={form.company_name} onChange={(value) => setForm((s) => ({ ...s, company_name: value }))} />
          <Input label="Symbol" value={form.symbol ?? ""} onChange={(value) => setForm((s) => ({ ...s, symbol: value }))} />
          <Input label="Price Band" value={form.price_band ?? ""} onChange={(value) => setForm((s) => ({ ...s, price_band: value }))} />
          <Input label="Open Date" type="date" value={form.issue_open_date ?? ""} onChange={(value) => setForm((s) => ({ ...s, issue_open_date: value }))} />
          <Input label="Close Date" type="date" value={form.issue_close_date ?? ""} onChange={(value) => setForm((s) => ({ ...s, issue_close_date: value }))} />
          <Input label="Listing Date" type="date" value={form.listing_date ?? ""} onChange={(value) => setForm((s) => ({ ...s, listing_date: value }))} />
          <Input label="Issue Size" value={form.issue_size ?? ""} onChange={(value) => setForm((s) => ({ ...s, issue_size: value }))} />
          <Input label="Lot Size" value={form.lot_size ?? ""} onChange={(value) => setForm((s) => ({ ...s, lot_size: value }))} />
          <Input label="GMP" value={form.gmp ?? ""} onChange={(value) => setForm((s) => ({ ...s, gmp: value }))} />
          <Input label="Merchant Banker" value={form.merchant_banker ?? ""} onChange={(value) => setForm((s) => ({ ...s, merchant_banker: value }))} />
          <Input label="Anchor Investors" value={form.anchor_investors ?? ""} onChange={(value) => setForm((s) => ({ ...s, anchor_investors: value }))} />
          <Input label="Subscription" value={form.subscription ?? ""} onChange={(value) => setForm((s) => ({ ...s, subscription: value }))} />
          <Input label="Source Name" value={form.source_name ?? ""} onChange={(value) => setForm((s) => ({ ...s, source_name: value }))} />
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={form.status ?? "upcoming"}
              onChange={(event) => setForm((s) => ({ ...s, status: event.target.value as IpoStatus }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="upcoming">Upcoming</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="listed">Listed</option>
            </select>
          </label>
          <Input label="External URL" value={form.external_url ?? ""} onChange={(value) => setForm((s) => ({ ...s, external_url: value }))} />
          <label className="space-y-2 md:col-span-2 lg:col-span-3">
            <span className="text-sm font-medium text-slate-700">Summary</span>
            <textarea
              rows={3}
              value={form.summary ?? ""}
              onChange={(event) => setForm((s) => ({ ...s, summary: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            />
          </label>
          <label className="space-y-2 md:col-span-2 lg:col-span-3">
            <span className="text-sm font-medium text-slate-700">My Recommendation (Admin only)</span>
            <textarea
              rows={4}
              value={form.my_recommendation ?? ""}
              onChange={(event) => setForm((s) => ({ ...s, my_recommendation: event.target.value }))}
              className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
              placeholder="Your manual recommendation appears on website/app"
            />
          </label>

          <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(form.published)}
              onChange={(event) => setForm((s) => ({ ...s, published: event.target.checked }))}
            />
            Publish on Website/App
          </label>
        </div>

        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void saveEntry()}
            disabled={isSaving}
            className="rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            {editingId ? "Update IPO" : "Create IPO"}
          </button>
          <button
            type="button"
            onClick={resetForm}
            disabled={isSaving}
            className="rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700"
          >
            Reset
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-xl font-semibold text-slate-900">Published Queue</h3>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-slate-600">
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Dates</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Published</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="px-3 py-2 font-medium text-slate-900">{item.company_name}</td>
                  <td className="px-3 py-2 text-slate-600">{item.issue_open_date ?? "-"} to {item.issue_close_date ?? "-"}</td>
                  <td className="px-3 py-2 text-slate-600">{item.status ?? "upcoming"}</td>
                  <td className="px-3 py-2 text-slate-600">{item.published ? "Yes" : "No"}</td>
                  <td className="px-3 py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEdit(item)}
                        className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => void removeEntry(item.id)}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-700"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
      />
    </label>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function HealthFlag({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className={`rounded-lg px-3 py-2 ${ok ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
      <p className="text-xs uppercase tracking-wide opacity-80">{label}</p>
      <p className="mt-1 font-semibold">{ok ? "Present" : "Missing"}</p>
    </div>
  );
}

function normalizeNullable(value: string | null): string | null {
  if (value == null) return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}
