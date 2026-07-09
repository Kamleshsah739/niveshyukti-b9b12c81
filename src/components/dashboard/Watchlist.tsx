const stocks = [
  { name: "TCS", price: "₹4,220" },
  { name: "INFY", price: "₹1,620" },
  { name: "RELIANCE", price: "₹2,980" },
  { name: "SBIN", price: "₹895" },
];

export default function Watchlist() {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-5 text-xl font-bold">
        Watchlist
      </h2>

      <div className="space-y-3">
        {stocks.map((stock) => (
          <div
            key={stock.name}
            className="flex justify-between border-b pb-2"
          >
            <span>{stock.name}</span>
            <span>{stock.price}</span>
          </div>
        ))}
      </div>
    </div>
  );
}