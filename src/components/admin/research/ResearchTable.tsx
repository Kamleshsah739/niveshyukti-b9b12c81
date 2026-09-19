import ResearchRow, { type Audience, type ResearchRecord } from "./ResearchRow";

type Status = "draft" | "published";

interface ResearchTableProps {
  items: ResearchRecord[];
  searchTerm: string;
  onSearchChange: (value: string) => void;
  audienceFilter: "all" | Audience;
  statusFilter: "all" | Status;
  onAudienceFilterChange: (value: "all" | Audience) => void;
  onStatusFilterChange: (value: "all" | Status) => void;
  onEdit: (record: ResearchRecord) => void;
  onDelete: (record: ResearchRecord) => void;
  onTogglePublish: (record: ResearchRecord) => void;
}

export default function ResearchTable({
  items,
  searchTerm,
  onSearchChange,
  audienceFilter,
  statusFilter,
  onAudienceFilterChange,
  onStatusFilterChange,
  onEdit,
  onDelete,
  onTogglePublish,
}: ResearchTableProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <label className="flex-1 space-y-2">
          <span className="text-sm font-medium text-slate-700">Search</span>
          <input
            value={searchTerm}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search by code, company, title..."
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-blue-500"
          />
        </label>

        <div className="flex flex-col gap-3 sm:flex-row">
          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Audience</span>
            <select
              value={audienceFilter}
              onChange={(event) => onAudienceFilterChange(event.target.value as "all" | Audience)}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="all">All</option>
              <option value="public">Public</option>
              <option value="paid">Premium</option>
            </select>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-medium text-slate-700">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => onStatusFilterChange(event.target.value as "all" | Status)}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
            </select>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Code</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Company</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Title</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Audience</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {items.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-sm text-slate-500">
                  No research reports match the current filters.
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <ResearchRow
                  key={item.id}
                  item={item}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onTogglePublish={onTogglePublish}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
