"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { OccurrenceDetailsModal } from "@/components/occurrences/OccurrenceDetailsModal"
import { OccurrenceCloseModal } from "@/components/occurrences/OccurrenceCloseModal"
import { OccurrencesFiltersDrawer } from "@/components/occurrences/OccurrencesFiltersDrawer"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { X, Filter, Eye, CheckCircle, Bell, Calendar, Copy, Download } from "lucide-react"
import { useOccurrencesPermissions } from "@/lib/use-occurrences-permissions"

type OccurrenceRow = {
  id: number
  student_id: string
  student_name?: string | null
  group_id: number
  group_name?: string | null
  type_id: number
  type_name?: string | null
  occurred_at: string
  priority?: 'low'|'medium'|'high'
  is_sensitive?: boolean
  reminder_at?: string | null
  reminder_status?: 'PENDING'|'DONE'|'CANCELLED' | null
  owner_user_id?: string | null
  owner_name?: string | null
  status: 'OPEN'|'DONE'
  updated_at?: string | null
}

export default function OccurrencesManagementPage() {
  const { permissions, loading: permissionsLoading } = useOccurrencesPermissions()
  const [counts, setCounts] = useState<{ total:number; open:number; closed:number }>({ total: 0, open: 0, closed: 0 })
  const [rows, setRows] = useState<OccurrenceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 20

  // Filtros
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")
  const [groupId, setGroupId] = useState("")
  const [typeId, setTypeId] = useState("")
  const [status, setStatus] = useState<'OPEN'|'DONE'|'all'>('OPEN')
  const [hasReminder, setHasReminder] = useState<'yes'|'no'|'all'>('all')
  const [remFrom, setRemFrom] = useState("")
  const [remTo, setRemTo] = useState("")
  const [reminderStatus, setReminderStatus] = useState<'PENDING'|'DONE'|'CANCELLED'|'all'>('all')
  const [owners, setOwners] = useState<string[]>([])
  const [q, setQ] = useState("")
  const [sortBy, setSortBy] = useState<'occurred_at'|'reminder_at'>('occurred_at')
  const [sortOrder, setSortOrder] = useState<'asc'|'desc'>('desc')

  // Modais e Drawer
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [closeModalOpen, setCloseModalOpen] = useState(false)
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false)
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<number | undefined>()

  // Handlers para aplicar filtros do drawer
  function handleApplyFilters(newFilters: typeof initialFilters) {
    setFrom(newFilters.from)
    setTo(newFilters.to)
    setGroupId(newFilters.groupId)
    setTypeId(newFilters.typeId)
    setStatus(newFilters.status)
    setHasReminder(newFilters.hasReminder)
    setRemFrom(newFilters.remFrom)
    setRemTo(newFilters.remTo)
    setReminderStatus(newFilters.reminderStatus)
    setOwners(newFilters.owners)
    setQ(newFilters.q)
  }

  function handleClearFilters() {
    setFrom('')
    setTo('')
    setGroupId('')
    setTypeId('')
    setStatus('OPEN')
    setHasReminder('all')
    setRemFrom('')
    setRemTo('')
    setReminderStatus('all')
    setOwners([])
    setQ('')
  }


  const initialFilters = {
    from,
    to,
    groupId,
    typeId,
    status,
    hasReminder,
    remFrom,
    remTo,
    reminderStatus,
    owners,
    q
  }

  async function fetchList() {
    setLoading(true)
    try{
      const params = new URLSearchParams({ page: String(page), page_size: String(pageSize) })
      if (from) params.set('from', from)
      if (to) params.set('to', to)
      if (groupId) params.set('group_id', groupId)
      if (typeId) params.set('type_id', typeId)
      if (status !== 'all') params.set('status', status)
      if (hasReminder !== 'all') params.set('has_reminder', hasReminder)
      if (remFrom) params.set('reminder_from', remFrom)
      if (remTo) params.set('reminder_to', remTo)
      if (reminderStatus !== 'all') params.set('reminder_status', reminderStatus)
      if (owners.length) params.set('owner_id', owners.join(',')) // backend atual aceita um; aqui enviamos primeiro
      if (q) params.set('q', q)
      params.set('sort_by', sortBy)
      params.set('sort_order', sortOrder)
      const res = await fetch(`/api/occurrences?${params.toString()}`, { cache: 'no-store' })
      const data = await res.json().catch(()=>({}))
      const list = Array.isArray(data?.data)?data.data:[]
      setRows(list)
      const total = Number(data?.pagination?.total || 0)
      const open = list.filter((r:any)=>r.status==='OPEN').length
      const closed = list.filter((r:any)=>r.status==='DONE').length
      setCounts({ total, open, closed })
    } finally { setLoading(false) }
  }

  useEffect(() => { fetchList() }, [page, from, to, groupId, typeId, status, hasReminder, remFrom, remTo, reminderStatus, owners.join('|'), q, sortBy, sortOrder])


  const activeChips = useMemo(() => {
    const arr: Array<{label:string; onClear:()=>void}> = []
    if (from || to) arr.push({ label: `Período ${from||'…'} – ${to||'…'}`, onClear: ()=>{ setFrom(''); setTo('') } })
    if (groupId) arr.push({ label: `Grupo #${groupId}`, onClear: ()=>{ setGroupId(''); setTypeId('') } })
    if (typeId) arr.push({ label: `Tipo #${typeId}`, onClear: ()=> setTypeId('') })
    if (status !== 'all') arr.push({ label: status==='OPEN'?'Abertas':'Encerradas', onClear: ()=> setStatus('all') })
    if (hasReminder !== 'all') arr.push({ label: `Lembrete ${hasReminder==='yes'?'Com':'Sem'}`, onClear: ()=> setHasReminder('all') })
    if (remFrom || remTo) arr.push({ label: `Janela lembrete ${remFrom||'…'} – ${remTo||'…'}`, onClear: ()=>{ setRemFrom(''); setRemTo('') } })
    if (owners.length) arr.push({ label: `Resp: ${owners.length}`, onClear: ()=> setOwners([]) })
    if (q) arr.push({ label: `Busca: ${q}`, onClear: ()=> setQ('') })
    return arr
  }, [from,to,groupId,typeId,status,hasReminder,remFrom,remTo,owners,q])

  function clearAll() {
    setFrom(''); setTo(''); setGroupId(''); setTypeId(''); setStatus('OPEN'); setHasReminder('all'); setRemFrom(''); setRemTo(''); setOwners([]); setQ('')
  }

  // Ações básicas
  async function markReminderDone(row: OccurrenceRow) {
    await fetch(`/api/occurrences/${row.id}/reminder`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ reminder_status: 'DONE' }) })
    fetchList()
  }

  async function updateReminderDate(row: OccurrenceRow) {
    const v = window.prompt('Definir data/hora do lembrete (YYYY-MM-DDTHH:mm):', row.reminder_at || '')
    if (v === null) return
    await fetch(`/api/occurrences/${row.id}/reminder`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ reminder_at: v, reminder_status: 'PENDING' }) })
    fetchList()
  }

  async function cancelReminder(row: OccurrenceRow) {
    if (!confirm('Tem certeza que deseja cancelar este lembrete?')) return
    await fetch(`/api/occurrences/${row.id}/reminder`, { method:'PATCH', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ reminder_status: 'CANCELLED' }) })
    fetchList()
  }

  // Handlers dos modais
  function handleViewEdit(row: OccurrenceRow) {
    setSelectedOccurrenceId(row.id)
    setDetailsModalOpen(true)
  }

  function handleCloseOccurrence(row: OccurrenceRow) {
    setSelectedOccurrenceId(row.id)
    setCloseModalOpen(true)
  }

  function handleModalClose() {
    setDetailsModalOpen(false)
    setCloseModalOpen(false)
    setSelectedOccurrenceId(undefined)
  }

  function handleModalSuccess() {
    fetchList()
    handleModalClose()
  }

  // Verificar permissões
  if (permissionsLoading) {
    return (
      <div className="container max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando permissões...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!permissions.read) {
    return (
      <div className="container max-w-6xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-red-600 mb-2">Acesso Negado</h1>
            <p className="text-muted-foreground">
              Você não tem permissão para visualizar ocorrências.
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container max-w-6xl mx-auto">
      {/* Header compacto */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Gestão de Ocorrências</h1>
            <div className="mt-3 flex gap-3">
              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800">
                <div className="mr-2 h-2 w-2 rounded-full bg-slate-400"></div>
                Total: <span className="ml-1 font-bold">{counts.total}</span>
              </div>
              <div className="inline-flex items-center rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                <div className="mr-2 h-2 w-2 rounded-full bg-amber-500"></div>
                Abertas: <span className="ml-1 font-bold">{counts.open}</span>
              </div>
              <div className="inline-flex items-center rounded-full bg-emerald-100 px-3 py-1 text-sm font-medium text-emerald-800">
                <div className="mr-2 h-2 w-2 rounded-full bg-emerald-500"></div>
                Encerradas: <span className="ml-1 font-bold">{counts.closed}</span>
              </div>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => setFiltersDrawerOpen(true)}
            className="h-9 px-3"
          >
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
      </div>

      {/* Controles de ordenação */}
      <div className="mb-4 flex items-center justify-between rounded-md border bg-gray-50 px-3 py-2">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-700">Ordenar por:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'occurred_at'|'reminder_at')}
            className="rounded border px-2 py-1 text-sm"
          >
            <option value="occurred_at">Data da ocorrência</option>
            <option value="reminder_at">Data do lembrete</option>
          </select>
          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="flex items-center gap-1 rounded border px-2 py-1 text-sm hover:bg-gray-100"
          >
            {sortOrder === 'asc' ? '↑' : '↓'} {sortOrder === 'asc' ? 'Crescente' : 'Decrescente'}
          </button>
        </div>
        {activeChips.length > 0 && (
          <button 
            onClick={clearAll}
            className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="rounded-lg border">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground">Carregando…</div>
        ) : rows.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mb-4 text-6xl">📋</div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Nenhuma ocorrência encontrada</h3>
            <p className="text-slate-500">Tente ajustar os filtros ou criar uma nova ocorrência.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">ID</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Aluno</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Grupo</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Tipo</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Data de abertura</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Responsável</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Status</th>
                  <th className="px-4 py-2 text-left font-semibold text-slate-700">Lembrete</th>
                  <th className="px-4 py-2 text-center font-semibold text-slate-700">Ações</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, index)=> (
                  <tr key={r.id} className={`border-t hover:bg-blue-50/50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'}`}>
                    <td className="px-4 py-2">
                      <button 
                        onClick={() => handleViewEdit(r)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        #{r.id}
                      </button>
                    </td>
                    <td className="px-4 py-2">
                      <div className="max-w-32 truncate" title={r.student_name || '—'}>
                        {r.student_name || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {r.group_name || '—'}
                    </td>
                    <td className="px-4 py-2 text-slate-600">
                      {r.type_name || '—'}
                    </td>
                    <td className="px-4 py-2">
                      {new Date(r.occurred_at).toLocaleDateString('pt-BR')}
                    </td>
                    <td className="px-4 py-2">
                      <div className="max-w-24 truncate" title={r.owner_name || '—'}>
                        {r.owner_name || '—'}
                      </div>
                    </td>
                    <td className="px-4 py-2">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        r.status === 'OPEN' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                      }`}>
                        {r.status === 'OPEN' ? 'Aberta' : 'Encerrada'}
                      </span>
                    </td>
                    <td className="px-4 py-2">
                      {r.reminder_at ? (
                        <div className="flex items-center gap-1">
                          <span className="text-sm">🔔</span>
                          <span className="text-sm text-slate-600">
                            {new Date(r.reminder_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2 text-center">
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none p-1 rounded-md hover:bg-gray-100">
                            ⋮
                          </button>
                        </PopoverTrigger>
                        <PopoverContent 
                          className="w-56 p-2 rounded-2xl border-0 shadow-lg bg-white/95 backdrop-blur-sm sm:w-56 w-full max-w-[calc(100vw-2rem)]" 
                          align="end"
                          side="bottom"
                          sideOffset={6}
                        >
                          <div className="space-y-1">
                            <button 
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors" 
                              onClick={() => handleViewEdit(r)}
                            >
                              <Eye className="h-4 w-4 text-blue-500" />
                              Ver / Editar
                            </button>
                            
                            {r.status==='OPEN' && permissions.close && (
                              <button 
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors" 
                                onClick={() => handleCloseOccurrence(r)}
                              >
                                <CheckCircle className="h-4 w-4 text-green-500" />
                                Encerrar ocorrência
                              </button>
                            )}
                            
                            {r.reminder_status === 'PENDING' && permissions.write && (
                              <button 
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors" 
                                onClick={() => markReminderDone(r)}
                              >
                                <Bell className="h-4 w-4 text-amber-500" />
                                Concluir lembrete
                              </button>
                            )}
                            
                            {r.reminder_status === 'PENDING' && permissions.write && (
                              <button 
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors" 
                                onClick={() => cancelReminder(r)}
                              >
                                <X className="h-4 w-4 text-red-500" />
                                Cancelar lembrete
                              </button>
                            )}
                            
                            {permissions.write && (
                              <button 
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors" 
                                onClick={() => updateReminderDate(r)}
                              >
                                <Calendar className="h-4 w-4 text-purple-500" />
                                Reagendar lembrete
                              </button>
                            )}
                            
                            {permissions.write && (
                              <button 
                                className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors" 
                                onClick={() => alert('Duplicar como rascunho – próximo passo')}
                              >
                                <Copy className="h-4 w-4 text-indigo-500" />
                                Duplicar rascunho
                              </button>
                            )}
                            
                            <button 
                              className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-xl transition-colors" 
                              onClick={() => alert('Baixar anexos – próximo passo')}
                            >
                              <Download className="h-4 w-4 text-slate-500" />
                              Baixar anexos
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
        <span>Total: {counts.total}</span>
        <div className="flex items-center gap-2">
          <button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))} className="rounded-md border px-3 py-1 disabled:opacity-60">Anterior</button>
          <span>Página {page}</span>
          <button disabled={rows.length<pageSize} onClick={()=>setPage(p=>p+1)} className="rounded-md border px-3 py-1 disabled:opacity-60">Próxima</button>
        </div>
      </div>

      {/* Modais e Drawer */}
      <OccurrenceDetailsModal
        open={detailsModalOpen}
        onClose={handleModalClose}
        occurrenceId={selectedOccurrenceId}
        onSave={handleModalSuccess}
      />
      
      <OccurrenceCloseModal
        open={closeModalOpen}
        onClose={handleModalClose}
        occurrenceId={selectedOccurrenceId}
        onSuccess={handleModalSuccess}
      />

      <OccurrencesFiltersDrawer
        open={filtersDrawerOpen}
        onOpenChange={setFiltersDrawerOpen}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
        initialFilters={initialFilters}
      />
    </div>
  )
}


