import { useState } from "react"

export function StudentCreateModal({
	open,
	onClose,
	onCreate,
	trainers,
}: {
	open: boolean
	onClose: () => void
	onCreate: (payload: { name: string; email: string; phone?: string | null; status?: 'onboarding' | 'active' | 'paused'; trainer_id?: string | null; onboard_opt?: 'nao_enviar'|'enviar'|'enviado' }) => Promise<void>
	trainers: Array<{ id: string; name: string }>
}) {
	const [name, setName] = useState("")
	const [email, setEmail] = useState("")
	const [phone, setPhone] = useState("")
	const [status, setStatus] = useState<'onboarding' | 'active' | 'paused'>("onboarding")
	const [trainerId, setTrainerId] = useState<string>("")
	const [onboardOpt, setOnboardOpt] = useState<'nao_enviar'|'enviar'|'enviado'>("nao_enviar")
	const [loading, setLoading] = useState(false)

	if (!open) return null

	const validEmail = (v: string) => /.+@.+\..+/.test(v)

	function formatPhone(value: string) {
		const digits = value.replace(/\D/g, "").slice(0, 11)
		if (digits.length <= 2) return digits
		if (digits.length <= 6) return `(${digits.slice(0,2)}) ${digits.slice(2)}`
		if (digits.length <= 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`
		return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`
	}

	function sanitizePhoneToDigits(value: string) {
		const digits = value.replace(/\D/g, "")
		return digits.length ? digits : ""
	}

	async function submit(e: React.FormEvent) {
		e.preventDefault()
		if (!name || !validEmail(email)) return
		setLoading(true)
		try {
			await onCreate({
				name,
				email,
				phone: sanitizePhoneToDigits(phone) || null,
				status,
				trainer_id: trainerId || null,
				onboard_opt: onboardOpt,
			})
			setName("")
			setEmail("")
			setPhone("")
			setStatus("onboarding")
			setTrainerId("")
			setOnboardOpt("nao_enviar")
			onClose()
		} finally { setLoading(false) }
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
			<div className="w-full max-w-md rounded-lg bg-background p-5 shadow-lg ring-1 ring-border">
				<h2 className="text-lg font-semibold">Novo aluno</h2>
				<form onSubmit={submit} onKeyDown={(e)=>{ if (e.ctrlKey && e.key === 'Enter') submit(e as unknown as React.FormEvent) }} className="mt-4 space-y-3">
					<div>
						<label className="mb-1 block text-sm">Nome</label>
						<input value={name} onChange={(e)=>setName(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required />
					</div>
					<div>
						<label className="mb-1 block text-sm">E-mail</label>
						<input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm" required />
						{email && !validEmail(email) && <p className="mt-1 text-xs text-red-600">E-mail inválido.</p>}
					</div>
					<div>
						<label className="mb-1 block text-sm">Telefone (opcional)</label>
						<input inputMode="tel" value={phone} onChange={(e)=>setPhone(formatPhone(e.target.value))} className="w-full rounded-md border px-3 py-2 text-sm" placeholder="(11) 91234-5678" />
					</div>
					<div>
						<label className="mb-1 block text-sm">Status</label>
						<select value={status} onChange={(e)=>setStatus(e.target.value as 'onboarding'|'active'|'paused')} className="w-full rounded-md border px-3 py-2 text-sm">
							<option value="onboarding">onboarding</option>
							<option value="active">active</option>
							<option value="paused">paused</option>
						</select>
					</div>
					<div>
						<label className="mb-1 block text-sm">Onboarding</label>
						<select value={onboardOpt} onChange={(e)=>setOnboardOpt(e.target.value as 'nao_enviar'|'enviar'|'enviado')} className="w-full rounded-md border px-3 py-2 text-sm">
							<option value="nao_enviar">não enviar</option>
							<option value="enviar">enviar</option>
							<option value="enviado" disabled>enviado</option>
						</select>
					</div>
					<div>
						<label className="mb-1 block text-sm">Treinador responsável</label>
						<select value={trainerId} onChange={(e)=>setTrainerId(e.target.value)} className="w-full rounded-md border px-3 py-2 text-sm">
							<option value="">—</option>
							{trainers.map((t)=> (
								<option key={t.id} value={t.id}>{t.name}</option>
							))}
						</select>
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


