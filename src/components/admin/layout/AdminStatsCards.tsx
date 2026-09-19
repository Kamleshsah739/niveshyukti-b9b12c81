const cards = [
  { title: "Research Reports", value: "125" },
  { title: "IPO Calendar", value: "18" },
  { title: "Users", value: "8,240" },
  { title: "Premium Members", value: "412" },
];

export default function AdminStatsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

      {cards.map((card) => (
        <div
          key={card.title}
          className="rounded-xl bg-white p-6 shadow"
        >
          <p className="text-slate-500">
            {card.title}
          </p>

          <h2 className="mt-2 text-3xl font-bold">
            {card.value}
          </h2>

        </div>
      ))}

    </div>
  );
}