import {
  LayoutDashboard,
  FileText,
  BarChart3,
  Landmark,
  Star,
  Bell,
  User,
  Settings,
} from "lucide-react";
import { useState } from "react";

const menu = [
  { name: "Dashboard", icon: LayoutDashboard, targetId: "dashboard-overview" },
  { name: "Research", icon: FileText, targetId: "stock-research-section" },
  { name: "IPO", icon: Landmark, targetId: "ipo-section" },
  { name: "Watchlist", icon: Star, targetId: "watchlist-section" },
  { name: "Market", icon: BarChart3, targetId: "market-section" },
  { name: "Notifications", icon: Bell, targetId: "notifications-section" },
  { name: "Profile", icon: User, targetId: "profile-section" },
  { name: "Settings", icon: Settings, targetId: "settings-section" },
] as const;

export default function Sidebar() {
  const [active, setActive] = useState<string>("Dashboard");

  const scrollToSection = (targetId: string, label: string) => {
    const section = document.getElementById(targetId);
    if (section) {
      section.scrollIntoView({ behavior: "smooth", block: "start" });
      setActive(label);
    }
  };

  return (
    <aside className="w-64 bg-white shadow-lg h-screen p-6">
      <h1 className="text-2xl font-bold text-blue-600">
        Nivesh Yukti
      </h1>

      <div className="mt-10 space-y-2">
        {menu.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.name}
              type="button"
              onClick={() => scrollToSection(item.targetId, item.name)}
              className={`flex w-full items-center gap-3 rounded-xl p-3 transition ${
                active === item.name
                  ? "bg-blue-100 text-blue-700"
                  : "hover:bg-blue-50"
              }`}
            >
              <Icon size={20} />
              <span>{item.name}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
