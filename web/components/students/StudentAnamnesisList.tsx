"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { FileText, Download, Eye, Calendar, User, Plus } from "lucide-react"
import { toast } from "sonner"
import EmptyState from "@/components/ui/EmptyState"
import { showNoAnamnesisFound } from "@/lib/toast-utils"

type AnamnesisResponse = {
  id: string
  student_id: string
  template_id: string
  template_name: string
  status: 'PENDING' | 'COMPLETED' | 'EXPIRED'
  created_at: string
  completed_at?: string
  expires_at?: string
  responses?: any
  created_by?: string
  created_by_name?: string
}

interface StudentAnamnesisListProps {
  studentId: string
  studentName: string
}

export default function StudentAnamnesisList({ studentId, studentName }: StudentAnamnesisListProps) {
  const [anamnesis, setAnamnesis] = useState<AnamnesisResponse[]>([])
  const [loading, setLoading] = useState(false)

  const fetchAnamnesis = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/students/${studentId}/anamnesis`, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-store',
          'Pragma': 'no-cache'
        }
      })
      
      if (!response.ok) {
        throw new Error('Erro ao carregar anamneses')
      }
      
      const data = await response.json()
      setAnamnesis(data.anamnesis || [])
    } catch (error) {
      console.error('Erro ao carregar anamneses:', error)
      toast.error('Erro ao carregar anamneses do aluno')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAnamnesis()
  }, [studentId])

  const handleView = (anamnesisId: string) => {
    // Implementar visualização da anamnese
    console.log('Visualizar anamnese:', anamnesisId)
    toast.info('Funcionalidade de visualização em desenvolvimento')
  }

  const handleDownload = (anamnesisId: string) => {
    // Implementar download PDF
    console.log('Download PDF anamnese:', anamnesisId)
    toast.info('Funcionalidade de download PDF em desenvolvimento')
  }

  const handleNewAnamnesis = () => {
    // Implementar criação de nova anamnese
    console.log('Nova anamnese para aluno:', studentId)
    toast.info('Funcionalidade de nova anamnese em desenvolvimento')
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-green-100 text-green-800 border-green-200'
      case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'EXPIRED': return 'bg-red-100 text-red-800 border-red-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'Concluída'
      case 'PENDING': return 'Pendente'
      case 'EXPIRED': return 'Expirada'
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {anamnesis.length} anamnese(s) encontrada(s) para {studentName}
        </p>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={fetchAnamnesis}
          >
            Atualizar
          </Button>
          <Button onClick={handleNewAnamnesis} size="sm">
            <Plus className="h-4 w-4 mr-1" />
            Nova Anamnese
          </Button>
        </div>
      </div>

      {anamnesis.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="Nenhuma anamnese encontrada"
          description="Este aluno ainda não possui anamneses registradas. Crie a primeira anamnese para começar."
          action={{
            label: "Criar Primeira Anamnese",
            onClick: handleNewAnamnesis
          }}
        />
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Template</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Criada em</TableHead>
                <TableHead>Concluída em</TableHead>
                <TableHead>Criada por</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {anamnesis.map((item) => (
                <TableRow key={item.id} className="hover:bg-muted/50">
                  <TableCell>
                    <span className="font-mono text-sm">#{item.id.slice(0, 8)}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{item.template_name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(item.status)}>
                      {getStatusLabel(item.status)}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {new Date(item.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {item.completed_at ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">
                          {new Date(item.completed_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">{item.created_by_name || '—'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleView(item.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {item.status === 'COMPLETED' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDownload(item.id)}
                          className="h-8 w-8 p-0"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
