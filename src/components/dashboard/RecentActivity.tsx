const activity = [
  "Logged in",
  "Viewed Tata Motors research",
  "Added Infosys to watchlist",
  "Checked IPO Calendar",
];

export default function RecentActivity() {
  return (
    <div className="rounded-xl bg-white p-6 shadow">
      <h2 className="mb-5 text-xl font-bold">
        Recent Activity
      </h2>

      <div className="space-y-3">
        {activity.map((item) => (
          <div
            key={item}
            className="rounded-lg bg-gray-50 p-3"
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}