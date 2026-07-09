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
const menu = [
  { name: "Dashboard", icon: LayoutDashboard },
  { name: "Research", icon: FileText },
  { name: "IPO", icon: Landmark },
  { name: "Watchlist", icon: Star },
  { name: "Market", icon: BarChart3 },
  { name: "Notifications", icon: Bell },
    { name: "Profile", icon: User },
    { name: "Settings", icon: Settings },
];
export default function Sidebar() {
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
              className="flex w-full items-center gap-3 rounded-xl p-3 transition hover:bg-blue-50"
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