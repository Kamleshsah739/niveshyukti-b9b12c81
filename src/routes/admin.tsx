import { createFileRoute, redirect } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

import AdminSidebar from "@/components/admin/layout/AdminSidebar";
import AdminTopbar from "@/components/admin/layout/AdminTopbar";
import AdminStatsCards from "@/components/admin/layout/AdminStatsCards";
import ResearchManager from "@/components/admin/research/ResearchManager";
import AdminIpoManager from "@/components/admin/ipo/AdminIpoManager";

type AdminSection =
  | "dashboard"
  | "research"
  | "ipo"
  | "news"
  | "stock-reco"
  | "fo-reco"
  | "commodity-reco"
  | "learning"
  | "users"
  | "premium"
  | "notifications"
  | "settings"
  | "logout";

export const Route = createFileRoute("/admin")({
  beforeLoad: async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      throw redirect({
        to: "/auth/login",
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (profile?.role !== "super_admin") {
      throw redirect({
        to: "/",
      });
    }
  },

  component: AdminPage,
});

function AdminPage() {
  const [activeSection, setActiveSection] = useState<AdminSection>("dashboard");
  const navigate = useNavigate();

  const handleSelect = async (section: AdminSection) => {
    if (section === "logout") {
      await supabase.auth.signOut();
      await navigate({ to: "/auth/login" });
      return;
    }

    setActiveSection(section);
  };

  return (
    <div className="flex min-h-screen bg-slate-100">
      <AdminSidebar activeSection={activeSection} onSelect={handleSelect} />

      <main className="flex-1 p-6 space-y-6">
        {activeSection === "dashboard" ? (
          <section className="space-y-6">
            <AdminTopbar onOpenNotifications={() => setActiveSection("notifications")} />
            <AdminStatsCards />
          </section>
        ) : null}

        {activeSection === "research" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Research Management</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Manage research reports with unique NY codes, publishing, search, filters, and CSV import.
                </p>
              </div>
            </div>
            <ResearchManager />
          </section>
        ) : null}

        {activeSection === "ipo" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <AdminIpoManager />
          </section>
        ) : null}

        {activeSection !== "dashboard" && activeSection !== "research" && activeSection !== "ipo" ? (
          <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">{getSectionTitle(activeSection)}</h2>
            <p className="mt-2 text-sm text-slate-600">
              This section opens from the sidebar and all other sections remain hidden.
            </p>
          </section>
        ) : null}
      </main>
    </div>
  );
}

function getSectionTitle(section: Exclude<AdminSection, "logout">): string {
  switch (section) {
    case "dashboard":
      return "Admin Dashboard";
    case "research":
      return "Research Reports";
    case "ipo":
      return "IPO Calendar";
    case "news":
      return "Market News";
    case "stock-reco":
      return "Stock Recommendations";
    case "fo-reco":
      return "F&O Recommendations";
    case "commodity-reco":
      return "Commodity Recommendations";
    case "learning":
      return "Learning Center";
    case "users":
      return "Users";
    case "premium":
      return "Premium Members";
    case "notifications":
      return "Notifications";
    case "settings":
      return "Settings";
  }
}
