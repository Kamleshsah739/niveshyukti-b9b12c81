import { supabase } from "./client";

export type Audience = "public" | "paid";

export interface ResearchReport {
  id: string;
  created_by: string | null;
  research_code: string | null;
  company: string | null;
  sector: string | null;
  title: string | null;
  recommendation: string | null;
  current_price: number | null;
  target_price: number | null;
  stop_loss: number | null;
  risk: string | null;
  time_horizon: string | null;
  summary: string | null;
  detailed_analysis: string | null;
  pdf_url: string | null;
  chart_url: string | null;
  audience: Audience | null;
  published: boolean | null;
  created_at: string | null;
  updated_at: string | null;
  home_slider_slot: number | null;
}

export type CreateResearchInput = Omit<ResearchReport, "id" | "home_slider_slot"> & {
  home_slider_slot?: number | null;
};

export type UpdateResearchInput = Partial<Omit<ResearchReport, "id" | "created_at">>;

export async function getResearchReports(): Promise<ResearchReport[]> {
  const { data, error } = await supabase
    .from("research_reports")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []) as ResearchReport[];
}

export async function createResearch(report: CreateResearchInput): Promise<ResearchReport> {
  const { data, error } = await supabase
    .from("research_reports")
    .insert(report)
    .select()
    .single();

  if (error) throw error;

  return data as ResearchReport;
}

export async function updateResearch(id: string, report: UpdateResearchInput): Promise<void> {
  const { error } = await supabase
    .from("research_reports")
    .update(report)
    .eq("id", id);

  if (error) throw error;
}

export async function deleteResearch(id: string): Promise<void> {
  const { error } = await supabase
    .from("research_reports")
    .delete()
    .eq("id", id);

  if (error) throw error;
}

export async function uploadResearchAsset(file: File, kind: "pdf" | "chart"): Promise<string> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) throw sessionError;
  if (!session) {
    throw new Error("You must be logged in to upload assets.");
  }

  const extension = file.name.split(".").pop()?.toLowerCase() || "bin";
  const filename = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  const path = `research/${session.user.id}/${filename}`;

  const { error } = await supabase.storage
    .from("research-assets")
    .upload(path, file, { upsert: true, cacheControl: "3600" });

  if (error) {
    throw new Error(`Asset upload failed (${error.message}). Ensure bucket 'research-assets' exists and has insert/select policies for authenticated users.`);
  }

  const { data } = supabase.storage.from("research-assets").getPublicUrl(path);
  return data.publicUrl;
}

export async function getHomeSliderReports(): Promise<ResearchReport[]> {
  const { data, error } = await supabase
    .from("research_reports")
    .select("*")
    .eq("published", true)
    .eq("audience", "public")
    .not("home_slider_slot", "is", null)
    .order("home_slider_slot", { ascending: true })
    .limit(6);
  if (error) throw error;
  return (data ?? []) as ResearchReport[];
}
