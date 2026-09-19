import { createFileRoute } from "@tanstack/react-router";
import StockScreener from "@/components/screener/StockScreener";

export const Route = createFileRoute("/screener")({
  head: () => ({
    meta: [
      { title: "Indian Stock Screener | Nivesh Yukti" },
      { name: "description", content: "Screen NSE stocks using end-of-day valuation, quality, growth and technical filters." },
    ],
  }),
  component: StockScreener,
});
