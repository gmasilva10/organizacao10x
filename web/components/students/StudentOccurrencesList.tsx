"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { AlertTriangle, Eye, Edit, Calendar, User, Filter, MessageSquare } from "lucide-react"
import { OccurrenceDetailsModal } from "@/components/occurrences/OccurrenceDetailsModal"
import { toast } from "sonner"
import EmptyState from "@/components/ui/EmptyState"
import { showNoOccurrencesFound } from "@/lib/toast-utils"
import MessageComposer from "../relationship/MessageComposer"

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

interface StudentOccurrencesListProps {
  studentId: string
  studentName: string
}

export default function StudentOccurrencesList({ studentId, studentName }: StudentOccurrencesListProps) {
  const [occurrences, setOccurrences] = useState<OccurrenceRow[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedOccurrenceId, setSelectedOccurrenceId] = useState<number | undefined>()
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [messageComposerOpen, setMessageComposerOpen] = useState(false)
  const [selectedOccurrence, setSelectedOccurrence] = useState<OccurrenceRow | null>(null)

  const fetchOccurrences = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/students/${studentId}/occurrences`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error('Erro ao carregar ocorrências')
      }
      
      const data = await response.json()
      setOccurrences(data.occurrences || [])
    } catch (error) {
      console.error('Erro ao carregar ocorrências:', error)
      toast.error('Erro ao carregar ocorrências do aluno')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOccurrences()
  }, [studentId])

  const handleViewEdit = (occurrence: OccurrenceRow) => {
    setSelectedOccurrenceId(occurrence.id)
    setDetailsModalOpen(true)
  }

  const handleFollowUp = (occurrence: OccurrenceRow) => {
    setSelectedOccurrence(occurrence)
    setMessageComposerOpen(true)
  }

  const handleCloseModal = () => {
    setDetailsModalOpen(false)
    setSelectedOccurrenceId(undefined)
    // Recarregar lista após edição
    fetchOccurrences()
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPriorityLabel = (priority: string) => {
    switch (priority) {
      case 'high': return 'Alta'
      case 'medium': return 'Média'
      case 'low': return 'Baixa'
      default: return priority
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'OPEN': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'DONE': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'OPEN': return 'Aberta'
      case 'DONE': return 'Encerrada'
      default: return status
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {occurrences.length} ocorrência(s) encontrada(s) para {studentName}
          </p>
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchOccurrences}
          >
            <Filter className="h-4 w-4 mr-1" />
            Atualizar
          </Button>
        </div>

        {occurrences.length === 0 ? (
          <EmptyState
            icon={AlertTriangle}
            title="Nenhuma ocorrência encontrada"
            description="Este aluno ainda não possui ocorrências registradas. Clique em 'Nova Ocorrência' para começar."
          />
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Grupo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {occurrences.map((occurrence) => (
                  <TableRow key={occurrence.id} className="hover:bg-muted/50">
                    <TableCell>
                      <button 
                        onClick={() => handleViewEdit(occurrence)}
                        className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        #{occurrence.id}
                      </button>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {occurrence.group_name || '—'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {occurrence.type_name || '—'}
                    </TableCell>
                    <TableCell>
                      {new Date(occurrence.occurred_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{occurrence.owner_name || '—'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getPriorityColor(occurrence.priority || 'medium')}>
                        {getPriorityLabel(occurrence.priority || 'medium')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(occurrence.status)}>
                        {getStatusLabel(occurrence.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewEdit(occurrence)}
                          className="h-8 w-8 p-0"
                          title="Ver detalhes"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFollowUp(occurrence)}
                          className="h-8 w-8 p-0"
                          title="Enviar follow-up"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Modal de Detalhes */}
      {detailsModalOpen && selectedOccurrenceId && (
        <OccurrenceDetailsModal
          occurrenceId={selectedOccurrenceId}
          open={detailsModalOpen}
          onClose={handleCloseModal}
        />
      )}

      {/* MessageComposer Modal */}
      {selectedOccurrence && (
        <MessageComposer
          open={messageComposerOpen}
          onOpenChange={setMessageComposerOpen}
          studentId={selectedOccurrence.student_id}
          studentName={selectedOccurrence.student_name || 'Aluno'}
          initialMessage={`Follow-up da ocorrência #${selectedOccurrence.id}: ${selectedOccurrence.notes || 'Sem descrição'}`}
          onSuccess={() => {
            toast.success('Follow-up enviado com sucesso!')
            fetchOccurrences()
          }}
        />
      )}
    </>
  )
}
