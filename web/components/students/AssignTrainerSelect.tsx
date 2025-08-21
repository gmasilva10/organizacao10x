type Trainer = { user_id: string; email: string }

export function AssignTrainerSelect({
	value,
	trainers,
	onChange,
}: {
	value: string | null | undefined
	trainers: Trainer[]
	onChange: (v: string | null) => void
}) {
	return (
		<select value={value || ''} onChange={(e) => onChange(e.target.value || null)} className="rounded-md border px-2 py-1">
			<option value="">—</option>
			{trainers.map((t) => (
				<option key={t.user_id} value={t.user_id}>
					{t.email}
				</option>
			))}
		</select>
	)
}


