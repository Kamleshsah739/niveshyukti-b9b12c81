import { Bell, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function Topbar() {
  const [query, setQuery] = useState("");
  const [displayName, setDisplayName] = useState("User");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      const fullName = user?.user_metadata?.full_name;
      const emailName = user?.email?.split("@")[0] ?? "User";
      setDisplayName(typeof fullName === "string" && fullName.trim().length > 0 ? fullName : emailName);
      setAvatarUrl(typeof user?.user_metadata?.avatar_url === "string" ? user.user_metadata.avatar_url : null);
    };

    void loadUser();

    return () => {
      mounted = false;
    };
  }, []);

  const runSearch = () => {
    const value = query.trim().toLowerCase();
    if (!value) {
      scrollToId("dashboard-overview");
      return;
    }

    if (value.includes("ipo")) {
      scrollToId("ipo-section");
      return;
    }
    if (value.includes("research") || value.includes("stock")) {
      scrollToId("stock-research-section");
      return;
    }
    if (value.includes("watch")) {
      scrollToId("watchlist-section");
      return;
    }
    if (value.includes("market")) {
      scrollToId("market-section");
      return;
    }
    if (value.includes("notif")) {
      scrollToId("notifications-section");
      return;
    }

    scrollToId("dashboard-overview");
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-border bg-card p-5 shadow-[var(--shadow-card)]">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={runSearch}
          className="rounded-md p-2 text-muted-foreground hover:bg-muted"
          aria-label="Search dashboard sections"
        >
          <Search className="h-4 w-4" />
        </button>

        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              runSearch();
            }
          }}
          placeholder="Search sections: IPO, research, watchlist..."
          className="w-72 max-w-[45vw] rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => scrollToId("notifications-section")}
          className="rounded-md p-2 hover:bg-muted"
          aria-label="Open notifications section"
        >
          <Bell className="h-4 w-4" />
        </button>

        <button type="button" onClick={() => scrollToId("profile-section")} className="flex items-center gap-2 rounded-full border border-border px-2 py-1.5 hover:bg-muted/40">
          <img
            src={avatarUrl ?? `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}`}
            alt={displayName}
            className="h-8 w-8 rounded-full"
          />
          <span className="hidden max-w-40 truncate text-sm font-semibold text-foreground md:block">{displayName}</span>
        </button>
      </div>
    </div>
  );
}

function scrollToId(targetId: string) {
  const section = document.getElementById(targetId);
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}
