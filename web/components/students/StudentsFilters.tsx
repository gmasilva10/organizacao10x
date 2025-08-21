export function StudentsFilters({
	q,
	status,
	onQ,
	onStatus,
}: {
	q: string
	status: string
	onQ: (v: string) => void
	onStatus: (v: string) => void
}) {
	return (
		<div className="mt-4 flex flex-wrap items-center gap-3">
			<input placeholder="Buscar (q)" value={q} onChange={(e) => onQ(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
			<select value={status} onChange={(e) => onStatus(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
				<option value="">Status (todos)</option>
				<option value="onboarding">Onboarding</option>
				<option value="active">Active</option>
				<option value="paused">Paused</option>
			</select>
		</div>
	)
}


