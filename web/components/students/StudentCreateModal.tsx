import { useState } from "react"

export function StudentCreateModal({
	open,
	onClose,
	onCreate,
}: {
	open: boolean
	onClose: () => void
	onCreate: (payload: { name: string; email: string }) => Promise<void>
}) {
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [loading, setLoading] = useState(false)

	if (!open) return null

	const validEmail = (v: string) => /.+@.+\..+/.test(v)

	async function submit(e: React.FormEvent) {
		e.preventDefault()
		if (!name || !validEmail(email)) return
		setLoading(true)
		try { await onCreate({ name, email }); setName(""); setEmail(""); onClose() } finally { setLoading(false) }
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
			<div className="w-full max-w-md rounded-lg bg-background p-5 shadow-lg ring-1 ring-border">
				<h2 className="text-lg font-semibold">Novo aluno</h2>
				<form onSubmit={submit} className="mt-4 space-y-3">
					<div>
						<label className="mb-1 block text-sm">Nome</label>
						<input value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required />
					</div>
					<div>
						<label className="mb-1 block text-sm">E-mail</label>
						<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required />
						{email && !validEmail(email) && <p className="mt-1 text-xs text-red-600">E-mail inválido.</p>}
					</div>
					<div className="flex justify-end gap-2">
						<button type="button" onClick={onClose} className="rounded-md border px-4 py-2 text-sm">Cancelar</button>
						<button disabled={loading || !name || !validEmail(email)} className="rounded-md bg-primary px-4 py-2 text-sm text-white disabled:opacity-60">Criar</button>
					</div>
				</form>
			</div>
		</div>
	)
}


