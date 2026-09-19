export type Audience = "public" | "paid";

export interface ResearchRecord {
	id: string;
	created_by: string;
	research_code: string;
	company: string;
	sector: string;
	title: string;
	recommendation: string;
	current_price: number | null;
	target_price: number | null;
	stop_loss: number | null;
	risk: string;
	time_horizon: string;
	summary: string;
	detailed_analysis: string;
	pdf_url: string;
	chart_url: string;
	audience: Audience;
	published: boolean;
	created_at: string;
	updated_at: string;
	home_slider_slot: number | null;
}

interface ResearchRowProps {
	item: ResearchRecord;
	onEdit: (record: ResearchRecord) => void;
	onDelete: (record: ResearchRecord) => void;
	onTogglePublish: (record: ResearchRecord) => void;
}

export default function ResearchRow({
	item,
	onEdit,
	onDelete,
	onTogglePublish,
}: ResearchRowProps) {
	return (
		<tr className="hover:bg-slate-50">
			<td className="px-4 py-3 text-sm font-semibold text-slate-900">{item.research_code}</td>
			<td className="px-4 py-3 text-sm text-slate-700">{item.company}</td>
			<td className="px-4 py-3 text-sm text-slate-700">{item.title}</td>
			<td className="px-4 py-3 text-sm text-slate-700">{item.audience === "paid" ? "Premium" : "Public"}</td>
			<td className="px-4 py-3 text-sm">
				<span
					className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
						item.published ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
					}`}
				>
					{item.published ? "Published" : "Draft"}
				</span>
			</td>
			<td className="px-4 py-3 text-sm">
				<div className="flex flex-wrap gap-2">
					<button
						type="button"
						onClick={() => onTogglePublish(item)}
						className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
					>
						{item.published ? "Unpublish" : "Publish"}
					</button>
					<button
						type="button"
						onClick={() => onEdit(item)}
						className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
					>
						Edit
					</button>
					<button
						type="button"
						onClick={() => onDelete(item)}
						className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
					>
						Delete
					</button>
				</div>
			</td>
		</tr>
	);
}
