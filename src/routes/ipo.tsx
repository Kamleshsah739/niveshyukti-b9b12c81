import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/ipo")({
  component: IpoPage,
});

function IpoPage() {
  useEffect(() => {
    window.location.replace("/#ipo");
  }, []);

  return (
    <main className="min-h-screen grid place-items-center bg-slate-100 px-4 py-10">
      <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm text-slate-600 shadow-sm">
        Redirecting to IPO section...
      </div>
    </main>
  );
}
