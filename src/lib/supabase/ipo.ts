import { supabase } from "./client";

export type IpoStatus = "upcoming" | "open" | "closed" | "listed";

export interface IpoRecord {
  id: string;
  source_key: string | null;
  company_name: string;
  symbol: string | null;
  issue_open_date: string | null;
  issue_close_date: string | null;
  listing_date: string | null;
  price_band: string | null;
  lot_size: string | null;
  issue_size: string | null;
  gmp: string | null;
  merchant_banker: string | null;
  anchor_investors: string | null;
  subscription: string | null;
  status: IpoStatus | null;
  source_name: string | null;
  external_url: string | null;
  summary: string | null;
  my_recommendation: string | null;
  published: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface IpoSyncRun {
  id: string;
  source: string;
  status: "success" | "failure";
  synced_count: number;
  error_message: string | null;
  ran_at: string;
}

export interface IpoSyncHealthResult {
  ok: boolean;
  role: string;
  runtime: {
    supabaseUrl: boolean;
    anonKey: boolean;
    serviceRoleKey: boolean;
    syncToken: boolean;
    fmpApiKey: boolean;
    alphaVantageApiKey: boolean;
    finnhubApiKey: boolean;
  };
  message: string;
}

export type CreateIpoInput = Omit<IpoRecord, "id">;
export type UpdateIpoInput = Partial<Omit<IpoRecord, "id" | "created_at">>;

export interface IpoSyncResult {
  synced: number;
  sources: string[];
}

export async function getPublishedIpos(): Promise<IpoRecord[]> {
  const { data, error } = await supabase
    .from("ipo_entries")
    .select("*")
    .eq("published", true)
    .order("issue_open_date", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return (data ?? []) as IpoRecord[];
}

export async function getAllIpos(): Promise<IpoRecord[]> {
  const { data, error } = await supabase
    .from("ipo_entries")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return (data ?? []) as IpoRecord[];
}

export async function getLatestIpoSyncRun(): Promise<IpoSyncRun | null> {
  const { data, error } = await supabase
    .from("ipo_sync_runs")
    .select("*")
    .order("ran_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return data as IpoSyncRun;
}

export async function createIpo(input: CreateIpoInput): Promise<IpoRecord> {
  const { data, error } = await supabase
    .from("ipo_entries")
    .insert(input)
    .select()
    .single();

  if (error) throw error;
  return data as IpoRecord;
}

export async function updateIpo(id: string, input: UpdateIpoInput): Promise<void> {
  const { error } = await supabase
    .from("ipo_entries")
    .update(input)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteIpo(id: string): Promise<void> {
  const { error } = await supabase
    .from("ipo_entries")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function syncIposFromFreeApi(): Promise<IpoSyncResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be logged in as super admin to sync IPO feeds.");
  }

  const response = await fetch("/api/ipo-sync-manual", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | { ok?: boolean; synced?: number; sources?: string[]; error?: string }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? `API sync failed with status ${response.status}`);
  }

  return {
    synced: typeof payload?.synced === "number" ? payload.synced : 0,
    sources: Array.isArray(payload?.sources) ? payload.sources : [],
  };
}

export async function checkIpoSyncHealth(): Promise<IpoSyncHealthResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session?.access_token) {
    throw new Error("You must be logged in as super admin to run sync health check.");
  }

  const response = await fetch("/api/ipo-sync-health", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
  });

  const payload = (await response.json().catch(() => null)) as
    | {
        ok?: boolean;
        role?: string;
        runtime?: {
          supabaseUrl?: boolean;
          anonKey?: boolean;
          serviceRoleKey?: boolean;
          syncToken?: boolean;
          fmpApiKey?: boolean;
          alphaVantageApiKey?: boolean;
          finnhubApiKey?: boolean;
        };
        message?: string;
        error?: string;
      }
    | null;

  if (!response.ok) {
    throw new Error(payload?.error ?? payload?.message ?? `Sync health check failed with status ${response.status}`);
  }

  return {
    ok: payload?.ok === true,
    role: typeof payload?.role === "string" ? payload.role : "unknown",
    runtime: {
      supabaseUrl: payload?.runtime?.supabaseUrl === true,
      anonKey: payload?.runtime?.anonKey === true,
      serviceRoleKey: payload?.runtime?.serviceRoleKey === true,
      syncToken: payload?.runtime?.syncToken === true,
      fmpApiKey: payload?.runtime?.fmpApiKey === true,
      alphaVantageApiKey: payload?.runtime?.alphaVantageApiKey === true,
      finnhubApiKey: payload?.runtime?.finnhubApiKey === true,
    },
    message: typeof payload?.message === "string" ? payload.message : "Health check complete.",
  };
}

