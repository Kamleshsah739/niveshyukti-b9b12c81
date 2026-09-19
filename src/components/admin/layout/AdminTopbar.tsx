import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function AdminTopbar({ onOpenNotifications }: { onOpenNotifications?: () => void }) {
  const [displayName, setDisplayName] = useState("Super Admin");

  useEffect(() => {
    let mounted = true;

    const loadUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!mounted) return;

      const fullName = user?.user_metadata?.full_name;
      const email = user?.email;
      setDisplayName(typeof fullName === "string" && fullName.trim().length > 0 ? fullName : email ?? "Super Admin");
    };

    void loadUser();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow">

      <div>
        <h2 className="text-2xl font-bold">
          Dashboard
        </h2>

        <p className="text-sm text-slate-500">
          Welcome back, Super Admin 👋
        </p>
      </div>

      <div className="flex items-center gap-4">

        <button type="button" onClick={onOpenNotifications} className="rounded-lg border px-4 py-2 hover:bg-slate-50">
          🔔 Notifications
        </button>

        <div className="font-semibold text-slate-800">
          {displayName}
        </div>

      </div>

    </div>
  );
}