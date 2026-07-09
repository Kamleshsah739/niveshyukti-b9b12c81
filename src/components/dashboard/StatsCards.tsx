 import {
  FileText,
  Landmark,
  Star,
  Bell,
} from "lucide-react";

const cards = [
  {
    title: "Research Reports",
    value: "156",
    icon: FileText,
  },
  {
    title: "Active IPOs",
    value: "4",
    icon: Landmark,
  },
  {
    title: "Watchlist Stocks",
    value: "18",
    icon: Star,
  },
  {
    title: "New Updates",
    value: "9",
    icon: Bell,
  },
];

export default function StatsCards() {
  return (
    <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;

        return (
          <div
            key={card.title}
            className="rounded-xl bg-white p-6 shadow"
          >
            <Icon className="mb-4 text-blue-600" />

            <h3 className="text-gray-500">
              {card.title}
            </h3>

            <p className="mt-2 text-3xl font-bold">
              {card.value}
            </p>
          </div>
        );
      })}
    </div>
  );
}