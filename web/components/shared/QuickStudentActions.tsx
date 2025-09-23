"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Edit, 
  Paperclip, 
  Settings,
  FileText,
  MessageSquare,
  Mail,
  UserCheck,
  GraduationCap,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'

interface QuickStudentActionsProps {
  studentId: string
  studentName: string
  studentPhone?: string
  onActionComplete?: () => void
  variant?: 'card' | 'modal'
}

export function QuickStudentActions({ 
  studentId, 
  studentName, 
  studentPhone,
  onActionComplete,
  variant = 'card'
}: QuickStudentActionsProps) {
  const [loading, setLoading] = useState(false)

  // Estados para modais (serão gerenciados pelo componente pai)
  const [modals, setModals] = useState({
    edit: false,
    arquivos: false,
    anamnese: false,
    diretriz: false,
    whatsapp: false,
    email: false,
    matricular: false,
    onboarding: false,
    ocorrencia: false
  })

  const handleAction = async (action: () => void) => {
    try {
      setLoading(true)
      await action()
      onActionComplete?.()
    } catch (error) {
      console.error('Erro na ação:', error)
      toast.error('Erro ao executar ação')
    } finally {
      setLoading(false)
    }
  }

  const openModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: true }))
  }

  const closeModal = (modalName: keyof typeof modals) => {
    setModals(prev => ({ ...prev, [modalName]: false }))
  }

  const handleWhatsApp = () => {
    if (!studentPhone) {
      toast.error('Telefone não disponível para este aluno')
      return
    }
    
    const phone = studentPhone.replace(/\D/g, '')
    const whatsappUrl = `https://wa.me/55${phone}`
    window.open(whatsappUrl, '_blank')
  }

  const handleEmail = () => {
    // Implementar envio de email
    toast.info('Funcionalidade de email em desenvolvimento')
  }

  const handleEditStudent = () => {
    // Abrir modal de edição do aluno
    window.open(`/app/students/${studentId}/edit`, '_blank')
  }

  const handleArquivos = () => {
    // Abrir página de arquivos do aluno
    window.open(`/app/students/${studentId}/anexos`, '_blank')
  }

  const handleAnamnese = () => {
    // Abrir modal de anamnese
    openModal('anamnese')
  }

  const handleDiretriz = () => {
    // Abrir modal de diretriz
    openModal('diretriz')
  }

  const handleMatricular = () => {
    // Abrir modal de matrícula
    openModal('matricular')
  }

  const handleOnboarding = () => {
    // Abrir modal de onboarding
    openModal('onboarding')
  }

  const handleOcorrencia = () => {
    // Abrir modal de ocorrência
    openModal('ocorrencia')
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 w-8 p-0 hover:bg-gray-100"
            disabled={loading}
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {/* Ações Principais */}
          <DropdownMenuItem onClick={() => handleAction(handleEditStudent)}>
            <Edit className="h-4 w-4 mr-2 text-blue-600" />
            Editar Aluno
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleAction(handleArquivos)}>
            <Paperclip className="h-4 w-4 mr-2 text-gray-600" />
            Arquivos
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Processos */}
          <DropdownMenuItem onClick={() => handleAction(handleMatricular)}>
            <GraduationCap className="h-4 w-4 mr-2 text-purple-600" />
            Matricular Aluno
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleAction(handleOnboarding)}>
            <UserCheck className="h-4 w-4 mr-2 text-blue-600" />
            Enviar Onboarding
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleAction(handleOcorrencia)}>
            <AlertTriangle className="h-4 w-4 mr-2 text-orange-600" />
            Nova Ocorrência
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleAction(handleAnamnese)}>
            <FileText className="h-4 w-4 mr-2 text-blue-600" />
            Gerar Anamnese
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleAction(handleDiretriz)}>
            <FileText className="h-4 w-4 mr-2 text-green-600" />
            Gerar Diretriz
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          {/* Comunicação */}
          <DropdownMenuItem 
            onClick={() => handleAction(handleWhatsApp)}
            disabled={!studentPhone}
          >
            <MessageSquare className="h-4 w-4 mr-2 text-green-600" />
            Enviar WhatsApp
            {!studentPhone && <span className="ml-auto text-xs text-gray-400">Sem telefone</span>}
          </DropdownMenuItem>
          
          <DropdownMenuItem onClick={() => handleAction(handleEmail)}>
            <Mail className="h-4 w-4 mr-2 text-blue-600" />
            Enviar E-mail
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modais serão renderizados pelo componente pai */}
      {/* Aqui apenas gerenciamos o estado */}
    </>
  )
}
