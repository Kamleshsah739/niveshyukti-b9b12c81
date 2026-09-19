import { supabase } from "@/lib/supabase/client";

export type AccessLevel = "user" | "super_admin" | "premium";

export async function getAccessLevel(userId: string): Promise<AccessLevel> {
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (profile?.role === "super_admin") return "super_admin";

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .eq("status", "active")
    .order("current_period_end", { ascending: false })
    .limit(1)
    .maybeSingle();

  const endDate = subscription?.current_period_end ? new Date(subscription.current_period_end) : null;
  return subscription && (!endDate || endDate > new Date()) ? "premium" : "user";
}
