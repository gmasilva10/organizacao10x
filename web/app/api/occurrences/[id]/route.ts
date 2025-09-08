import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import { withOccurrencesRBAC } from "@/server/withOccurrencesRBAC"
import { z } from "zod"
import { auditLogger } from "@/lib/audit-logger"
import { createAdminClient } from "@/utils/supabase/admin"

const updateOccurrenceSchema = z.object({
	group_id: z.number().optional(),
	type_id: z.number().optional(),
	notes: z.string().max(500).optional(),
	priority: z.enum(['low', 'medium', 'high']).optional(),
	is_sensitive: z.boolean().optional(),
	owner_user_id: z.string().uuid().optional(),
	reminder_at: z.string().optional(),
	reminder_status: z.enum(['PENDING', 'DONE', 'CANCELLED']).optional()
})

export async function GET(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params
	return withOccurrencesRBAC(request, 'occurrences.read', async (request, { user, membership, tenant_id }) => {
		try {
			const supabase = await createClient()
			const t0 = Date.now()
			
			// Buscar ocorrência sem joins (evitar 404 por RLS/joins)
			console.log('🔎 GET /api/occurrences/[id]', { id, tenant_id })
			const { data: occurrence, error } = await supabase
				.from('student_occurrences')
				.select(`
					id,
					student_id,
					group_id,
					type_id,
					occurred_at,
					notes,
					priority,
					is_sensitive,
					reminder_at,
					reminder_status,
					owner_user_id,
					status,
					created_at,
					updated_at
				`)
				.eq('id', id)
				.eq('tenant_id', tenant_id)
				.single()

			if (error || !occurrence) {
				console.warn('⚠️ Occurrence not found or error', { id, tenant_id, error })
				return NextResponse.json({ error: 'Occurrence not found' }, { status: 404 })
			}

			// Buscar nomes relacionados separadamente
			const [studentRes, groupRes, typeRes, ownerRes] = await Promise.all([
				occurrence.student_id
					? supabase.from('students').select('id, name').eq('id', occurrence.student_id).eq('tenant_id', tenant_id).single()
					: Promise.resolve({ data: null } as any),
				occurrence.group_id
					? supabase.from('occurrence_groups').select('id, name').eq('id', occurrence.group_id).eq('tenant_id', tenant_id).single()
					: Promise.resolve({ data: null } as any),
				occurrence.type_id
					? supabase.from('occurrence_types').select('id, name').eq('id', occurrence.type_id).eq('tenant_id', tenant_id).single()
					: Promise.resolve({ data: null } as any),
				occurrence.owner_user_id
					? supabase.from('professionals').select('user_id, full_name').eq('user_id', occurrence.owner_user_id).eq('tenant_id', tenant_id).single()
					: Promise.resolve({ data: null } as any)
			])

			const owner_name = ownerRes?.data?.full_name || null

			// Verificar permissões de edição
			const canEdit = membership.role === 'admin' ||
							membership.role === 'manager' ||
							occurrence.owner_user_id === user.id

			const result = {
				...occurrence,
				student_name: studentRes?.data?.name || null,
				group_name: groupRes?.data?.name || null,
				type_name: typeRes?.data?.name || null,
				owner_name,
				can_edit: canEdit
			}

			const ms = Date.now() - t0
			return NextResponse.json(result, { 
				headers: { 
					'X-Query-Time': String(ms),
					'X-Row-Count': '1',
					'Cache-Control': 'private, max-age=60, stale-while-revalidate=120'
				} 
			})

		} catch (error) {
			console.error('Error fetching occurrence:', error)
			return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
		}
	})
}

export async function PATCH(
	request: NextRequest,
	{ params }: { params: Promise<{ id: string }> }
) {
	const { id } = await params
	return withOccurrencesRBAC(request, 'occurrences.write', async (request, { user, membership, tenant_id }) => {
		try {
			const supabase = await createClient()
			
			// Validar dados
			const body = await request.json()
			const validatedData = updateOccurrenceSchema.parse(body)
			const updateData = validatedData as any

			// Verificar se ocorrência existe e pertence ao tenant
			const { data: existingOccurrence } = await supabase
				.from('student_occurrences')
				.select('id, owner_user_id, group_id, type_id, notes, priority, is_sensitive, reminder_at, reminder_status, occurred_at')
				.eq('id', id)
				.eq('tenant_id', tenant_id)
				.single()

			if (!existingOccurrence) {
				return NextResponse.json({ error: 'Occurrence not found' }, { status: 404 })
			}

			// Verificar permissões específicas de edição
			const canEdit = membership.role === 'admin' || 
						membership.role === 'manager' || 
						existingOccurrence.owner_user_id === user.id

			if (!canEdit) {
				return NextResponse.json({ error: 'Insufficient permissions to edit this occurrence' }, { status: 403 })
			}

			// Validações de referência
			if (validatedData.group_id) {
				const { data: group } = await supabase
					.from('occurrence_groups')
					.select('id')
					.eq('id', validatedData.group_id)
					.eq('tenant_id', tenant_id)
					.single()

				if (!group) {
					return NextResponse.json({ 
						error: 'Grupo de ocorrência inválido', 
						details: 'O grupo selecionado não existe ou não pertence à sua organização' 
					}, { status: 400 })
				}
			}

			if (validatedData.type_id) {
				const { data: type } = await supabase
					.from('occurrence_types')
					.select('id')
					.eq('id', validatedData.type_id)
					.eq('tenant_id', tenant_id)
					.single()

				if (!type) {
					return NextResponse.json({ 
						error: 'Tipo de ocorrência inválido', 
						details: 'O tipo selecionado não existe ou não pertence à sua organização' 
					}, { status: 400 })
				}
			}

			// Validar regra de negócio reminder_at >= occurred_at
			if (updateData.reminder_at && existingOccurrence.occurred_at) {
				const rem = new Date(updateData.reminder_at)
				const occ = new Date(existingOccurrence.occurred_at)
				if (isFinite(rem.getTime()) && isFinite(occ.getTime()) && rem < occ) {
					return NextResponse.json({ error: 'Data do lembrete deve ser posterior à data da ocorrência' }, { status: 422 })
				}
			}

			// Atualizar ocorrência
			const normalizedUpdate: Record<string, any> = { ...updateData }
			if (normalizedUpdate.reminder_at === '' || normalizedUpdate.reminder_at === undefined) {
				normalizedUpdate.reminder_at = null
			}

			const { data: updatedOccurrence, error } = await supabase
				.from('student_occurrences')
				.update({
					...normalizedUpdate,
					updated_at: new Date().toISOString()
				})
				.eq('id', id)
				.eq('tenant_id', tenant_id)
				.select()
				.single()

			if (error) {
				console.error('Error updating occurrence:', error)
				return NextResponse.json({ error: 'Failed to update occurrence' }, { status: 500 })
			}

			// Auditoria: identificar mudanças e registrar
			let auditId: string | undefined
			try {
				const changes: Record<string, any> = {}
				const previousValues: Record<string, any> = {}
				Object.keys(updateData).forEach(key => {
					if (updateData[key as keyof typeof updateData] !== undefined) {
						const newValue = updateData[key as keyof typeof updateData]
						const oldValue = (existingOccurrence as any)[key]
						if (newValue !== oldValue) {
							changes[key] = newValue
							previousValues[key] = oldValue
						}
					}
				})

				if (Object.keys(changes).length > 0) {
					try {
						auditId = await auditLogger.logOccurrenceUpdated(
							id,
							user.id,
							tenant_id,
							{ changes, previousValues }
						)
					} catch (e: any) {
						const admin = createAdminClient()
						const safeError = {
							code: e?.code || e?.status || 'unknown',
							message: e?.message || String(e),
							details: e?.details || null
						}
						await admin.from('audit_log_degraded').insert({
							org_id: tenant_id,
							entity_type: 'student_occurrence',
							entity_id: id,
							action: 'occurrence_updated',
							error: safeError,
							payload_after: { ...normalizedUpdate },
							created_at: new Date().toISOString()
						})
						console.error('Auditoria degradada registrada:', safeError)
					}
				}
			} catch (auditError: any) {
				try {
					const admin = createAdminClient()
					const safeError = {
						code: auditError?.code || 'unknown',
						message: auditError?.message || String(auditError),
						details: auditError?.details || null
					}
					await admin.from('audit_log_degraded').insert({
						org_id: tenant_id,
						entity_type: 'student_occurrence',
						entity_id: id,
						action: 'occurrence_updated',
						error: safeError,
						payload_after: { ...normalizedUpdate },
						created_at: new Date().toISOString()
					})
					console.error('Auditoria degradada (catch externo):', safeError)
				} catch {}
			}

			return NextResponse.json({ ...updatedOccurrence, _auditId: auditId })

		} catch (error) {
			if (error instanceof z.ZodError) {
				const fieldMessages = error.errors.map(e => {
					const field = e.path.join('.')
					return `${field}: ${e.message}`
				}).join('; ')
				
				return NextResponse.json({ 
					error: 'Dados inválidos',
					details: fieldMessages
				}, { status: 400 })
			}
			
			console.error('Error updating occurrence:', error)
			return NextResponse.json({ 
				error: 'Erro interno do servidor', 
				details: 'Ocorreu um erro inesperado. Tente novamente em alguns instantes.' 
			}, { status: 500 })
		}
	})
}