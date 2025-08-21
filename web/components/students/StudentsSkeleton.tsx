export function StudentsSkeleton({ rows = 10 }: { rows?: number }) {
	return (
		<tbody>
			{Array.from({ length: rows }).map((_, i) => (
				<tr key={i} className="animate-pulse border-t">
					<td className="px-3 py-3"><div className="h-3 w-40 rounded bg-muted" /></td>
					<td className="px-3 py-3"><div className="h-3 w-52 rounded bg-muted" /></td>
					<td className="px-3 py-3"><div className="h-3 w-20 rounded bg-muted" /></td>
					<td className="px-3 py-3"><div className="h-3 w-48 rounded bg-muted" /></td>
					<td className="px-3 py-3"><div className="h-3 w-16 rounded bg-muted" /></td>
				</tr>
			))}
		</tbody>
	)
}


