const recommendations = [
  {
    symbol: "TCS",
    type: "Equity",
    category: "Stock",
    result: "+18.2%",
    date: "2026-06-12",
    status: "Closed",
  },
  {
    symbol: "BANKNIFTY 56000 PE",
    type: "F&O",
    category: "FNO",
    result: "+42.0%",
    date: "2026-06-05",
    status: "Closed",
  },
  {
    symbol: "GOLD",
    type: "Commodity",
    category: "Commodity",
    result: "+9.6%",
    date: "2026-05-28",
    status: "Closed",
  },
  {
    symbol: "RELIANCE",
    type: "Equity",
    category: "Stock",
    result: "+15.6%",
    date: "2026-05-18",
    status: "Closed",
  },
];

const tradeTypes = ["All", "Stock", "FNO", "Commodity"];

export default function PastRecommendations() {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">Past Recommendations</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review published research performance by date, trade type and asset class.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="flex flex-col text-sm font-medium text-foreground">
            Date range
            <input
              type="date"
              className="mt-2 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </label>
          <label className="flex flex-col text-sm font-medium text-foreground">
            Trade type
            <select className="mt-2 rounded-xl border border-input bg-background px-4 py-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
              {tradeTypes.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div className="mt-6 overflow-x-auto">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Symbol</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Trade Type</th>
              <th className="px-4 py-3">Result</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {recommendations.map((rec) => (
              <tr key={rec.symbol + rec.date} className="hover:bg-slate-50">
                <td className="px-4 py-4">{rec.date}</td>
                <td className="px-4 py-4 font-semibold">{rec.symbol}</td>
                <td className="px-4 py-4">{rec.category}</td>
                <td className="px-4 py-4">{rec.type}</td>
                <td className="px-4 py-4 text-emerald-600">{rec.result}</td>
                <td className="px-4 py-4 text-sm text-muted-foreground">{rec.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
