import { createFileRoute } from "@tanstack/react-router";
import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";
import StatsCards from "@/components/dashboard/StatsCards";
import PortfolioChart from "@/components/dashboard/PortfolioChart";
import MarketOverview from "@/components/dashboard/MarketOverview";
import ResearchList from "@/components/dashboard/ResearchList";
import Watchlist from "@/components/dashboard/Watchlist";
import RecentActivity from "@/components/dashboard/RecentActivity";
import PastRecommendations from "@/components/dashboard/PastRecommendations";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <main className="flex-1 p-6 space-y-6">

        <Topbar />

        <StatsCards />

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          <div className="xl:col-span-2">
            <PortfolioChart />
          </div>

          <MarketOverview />

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <ResearchList />

          <Watchlist />

          <RecentActivity />

        </div>

        <PastRecommendations />

      </main>
    </div>
  );
}