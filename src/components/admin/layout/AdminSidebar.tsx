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

interface AdminSidebarProps {
  activeSection: Exclude<AdminSection, "logout">;
  onSelect: (section: AdminSection) => void;
}

const menus: Array<{ label: string; section: AdminSection }> = [
  { label: "Dashboard", section: "dashboard" },
  { label: "Research Reports", section: "research" },
  { label: "IPO Calendar", section: "ipo" },
  { label: "Market News", section: "news" },
  { label: "Stock Recommendations", section: "stock-reco" },
  { label: "F&O Recommendations", section: "fo-reco" },
  { label: "Commodity Recommendations", section: "commodity-reco" },
  { label: "Learning Center", section: "learning" },
  { label: "Users", section: "users" },
  { label: "Premium Members", section: "premium" },
  { label: "Notifications", section: "notifications" },
  { label: "Settings", section: "settings" },
  { label: "Logout", section: "logout" },
];

export default function AdminSidebar({ activeSection, onSelect }: AdminSidebarProps) {

  return (
    <aside className="w-72 min-h-screen bg-slate-900 text-white p-6">

      <h1 className="text-2xl font-bold mb-8">
        Nivesh Yukti
      </h1>

      <nav className="space-y-2">

        {menus.map((menu) => (
          <button
            key={menu.section}
            type="button"
            onClick={() => onSelect(menu.section)}
            className={`w-full rounded-lg px-4 py-3 text-left transition ${
              activeSection === menu.section
                ? "bg-blue-600 text-white"
                : "hover:bg-slate-800"
            }`}
          >
            {menu.label}
          </button>
        ))}

      </nav>

    </aside>
  );
}