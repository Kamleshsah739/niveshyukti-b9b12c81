import { Bell, Search } from "lucide-react";

export default function Topbar() {
  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-5 shadow">

      <div className="flex items-center gap-3">
        <Search className="text-gray-500" />

        <input
          placeholder="Search stocks..."
          className="outline-none"
        />
      </div>

      <div className="flex items-center gap-5">
        <Bell className="cursor-pointer" />

        <img
          src="https://ui-avatars.com/api/?name=Kamlesh+Sah"
          className="h-10 w-10 rounded-full"
        />
      </div>

    </div>
  );
}