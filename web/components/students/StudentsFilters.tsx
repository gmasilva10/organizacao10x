type TrainerOption = { id: string; name: string }

export function StudentsFilters({
	q,
	status,
	trainerId,
	trainers,
	onQ,
	onStatus,
	onTrainer,
}: {
	q: string
	status: string
	trainerId: string
	trainers: TrainerOption[]
	onQ: (v: string) => void
	onStatus: (v: string) => void
	onTrainer: (v: string) => void
}) {
	return (
		<div className="mt-4 flex flex-wrap items-center gap-3">
			<input aria-label="Buscar por nome" placeholder="Buscar por nome…" value={q} onChange={(e) => onQ(e.target.value)} className="rounded-md border px-3 py-2 text-sm" />
			<select aria-label="Filtrar por status" value={status} onChange={(e) => onStatus(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
				<option value="">Status (todos)</option>
				<option value="active">Active</option>
				<option value="paused">Paused</option>
				<option value="archived">Archived</option>
			</select>
			<select aria-label="Filtrar por treinador" value={trainerId} onChange={(e) => onTrainer(e.target.value)} className="rounded-md border px-3 py-2 text-sm">
				<option value="">Treinador (todos)</option>
				{trainers.map(t => (
					<option key={t.id} value={t.id}>{t.name}</option>
				))}
			</select>
		</div>
	)
}


