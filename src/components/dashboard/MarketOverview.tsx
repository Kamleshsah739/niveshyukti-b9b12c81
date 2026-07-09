const markets = [
  { name: "NIFTY 50", value: "24,500", change: "+0.85%" },
  { name: "SENSEX", value: "80,430", change: "+0.74%" },
  { name: "BANK NIFTY", value: "53,180", change: "+1.10%" },
];

export default function MarketOverview() {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-5 text-xl font-bold">
        Market Overview
      </h2>

      <div className="space-y-4">
        {markets.map((market) => (
          <div
            key={market.name}
            className="flex justify-between border-b pb-2"
          >
            <div>
              <h3 className="font-semibold">
                {market.name}
              </h3>

              <p className="text-gray-500">
                {market.value}
              </p>
            </div>

            <span className="font-bold text-green-600">
              {market.change}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}