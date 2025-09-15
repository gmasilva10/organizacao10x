/**
 * GATE A-10.2.5 - Componente para criar contato WhatsApp
 * 
 * Ação direta: normaliza telefone, gera vCard, abre chat
 * Sem modal - execução imediata com toasts
 */

"use client"

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { normalizeToE164, isValidForWhatsApp } from '@/utils/phone'
import { buildStudentVCard, downloadVCard } from '@/utils/vcard'
import { openWhatsAppChat, canOpenPopups } from '@/utils/wa'
import { DEFAULT_CONTACT_GREETING, WHATSAPP_ACTIONS, WHATSAPP_CHANNEL, WHATSAPP_ORIGIN } from '@/constants/whatsapp'

interface WhatsAppContactCreatorProps {
  student: {
    id: string
    name: string
    phone?: string | null
    email?: string | null
  }
  onSuccess?: () => void
}

export function WhatsAppContactCreator({ student, onSuccess }: WhatsAppContactCreatorProps) {
  const [loading, setLoading] = useState(false)

  // Executar automaticamente quando o componente é montado
  useEffect(() => {
    handleCreateContact()
  }, [])

  const handleCreateContact = async () => {
    if (loading) return

    setLoading(true)

    try {
      // 1. Normalizar telefone
      if (!student.phone) {
        toast.error('Aluno sem telefone válido. Edite o cadastro para continuar.', {
          action: {
            label: 'Editar aluno',
            onClick: () => {
              // TODO: Focar no campo telefone do formulário
              console.log('Focar no campo telefone')
            }
          }
        })
        return
      }

      const phoneResult = normalizeToE164(student.phone)
      
      if (!phoneResult.e164) {
        toast.error('Telefone inválido. Verifique o formato e tente novamente.', {
          action: {
            label: 'Editar aluno',
            onClick: () => {
              // TODO: Focar no campo telefone do formulário
              console.log('Focar no campo telefone')
            }
          }
        })
        return
      }

      // 2. Validar se é compatível com WhatsApp
      if (!isValidForWhatsApp(phoneResult.e164)) {
        toast.warning('Número pode não funcionar no WhatsApp. Recomendamos celular com 11 dígitos.')
      }

      // 3. Mostrar toast informativo se usou DDD padrão
      if (phoneResult.source === 'org_default_ddd') {
        toast.info('Assumido DDD 11 (org padrão). Edite o aluno para ajustar.')
      }

      // 4. Gerar vCard
      const vcard = buildStudentVCard(student, phoneResult.e164)
      
      // 5. Baixar vCard
      downloadVCard(vcard)

      // 6. Log: contact_vcard_generated
      await logRelationshipAction({
        action: WHATSAPP_ACTIONS.CONTACT_VCARD_GENERATED,
        student_id: student.id,
        meta: {
          phone_e164: phoneResult.masked || '***',
          normalized_phone_source: phoneResult.source,
          origin: WHATSAPP_ORIGIN
        }
      })

      // 7. Verificar se pode abrir popups
      if (!canOpenPopups()) {
        toast.warning('Permita popups para abrir o WhatsApp automaticamente.')
      }

      // 8. Resolver mensagem de saudação
      const firstName = student.name.split(' ')[0] || 'Aluno'
      const greeting = DEFAULT_CONTACT_GREETING.replace('{PrimeiroNome}', firstName)

      // 9. Abrir WhatsApp Web
      await openWhatsAppChat(phoneResult.e164, greeting)

      // 10. Log: whatsapp_chat_opened
      await logRelationshipAction({
        action: WHATSAPP_ACTIONS.WHATSAPP_CHAT_OPENED,
        student_id: student.id,
        meta: {
          phone_e164: phoneResult.masked || '***',
          normalized_phone_source: phoneResult.source,
          origin: WHATSAPP_ORIGIN
        }
      })

      // 11. Toast de sucesso
      toast.success('vCard gerado e chat aberto no WhatsApp')

      onSuccess?.()

    } catch (error) {
      console.error('Erro ao criar contato WhatsApp:', error)
      toast.error('Erro ao criar contato. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  // Componente invisível - executa automaticamente
  return null
}

/**
 * Log de ação de relacionamento
 */
async function logRelationshipAction(data: {
  action: string
  student_id: string
  meta: Record<string, any>
}) {
  try {
    const response = await fetch('/api/relationship/logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...data,
        channel: WHATSAPP_CHANNEL,
        template_code: null,
        task_id: null
      })
    })

    if (!response.ok) {
      console.error('Erro ao registrar log:', await response.text())
    }
  } catch (error) {
    console.error('Erro ao registrar log de relacionamento:', error)
  }
}
