const reports = [
  "Reliance Industries",
  "Tata Motors",
  "Infosys",
  "HDFC Bank",
  "ICICI Bank",
];

export default function ResearchList() {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-5 text-xl font-bold">
        Latest Research
      </h2>

      <ul className="space-y-3">
        {reports.map((stock) => (
          <li
            key={stock}
            className="rounded-lg bg-gray-50 p-3"
          >
            {stock}
          </li>
        ))}
      </ul>
    </div>
  );
}