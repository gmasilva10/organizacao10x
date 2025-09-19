"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { 
  User, 
  Phone, 
  Download, 
  MessageSquare, 
  AlertCircle, 
  Edit,
  CheckCircle
} from "lucide-react"
import { generateVCard, downloadVCard, VCardData } from "@/utils/vcard"
import { openWhatsApp, DEFAULT_WHATSAPP_MESSAGES } from "@/utils/wa"
import { normalizeToE164DigitsBR } from "@/lib/phone-normalize"
import { toast } from "sonner"
import Link from "next/link"

interface WhatsAppContactModalProps {
  open: boolean
  onClose: () => void
  studentId: string
  studentName: string
  studentPhone?: string
}

export default function WhatsAppContactModal({
  open,
  onClose,
  studentId,
  studentName,
  studentPhone
}: WhatsAppContactModalProps) {
  const [phone, setPhone] = useState(studentPhone || '')
  const [firstName, setFirstName] = useState(studentName.split(' ')[0] || studentName)
  const [isValidPhone, setIsValidPhone] = useState(false)

  // Validar telefone
  useEffect(() => {
    if (phone) {
      const cleanPhone = phone.replace(/\D/g, '')
      setIsValidPhone(cleanPhone.length >= 10) // Mínimo 10 dígitos
    } else {
      setIsValidPhone(false)
    }
  }, [phone])

  const handleDownloadVCard = () => {
    if (!isValidPhone) {
      toast.error('Telefone inválido para gerar vCard')
      return
    }

    try {
      const vcardData: VCardData = {
        firstName,
        lastName: studentName.split(' ').slice(1).join(' '),
        phone,
        studentId
      }

      const vcardContent = generateVCard(vcardData)
      const filename = `${firstName.toLowerCase()}_contato.vcf`
      
      downloadVCard(vcardContent, filename)
      
      toast.success('Contato gerado e baixado!')
      
      // Log da ação
      logContactAction('vcard_downloaded', { studentId, phone })
      
    } catch (error) {
      console.error('Erro ao gerar vCard:', error)
      toast.error('Erro ao gerar contato')
    }
  }

  const handleOpenWhatsApp = () => {
    if (!isValidPhone) {
      toast.error('Telefone inválido para abrir WhatsApp')
      return
    }

    try {
      const message = DEFAULT_WHATSAPP_MESSAGES['greeting']
      openWhatsApp(phone, message)
      
      toast.success('WhatsApp aberto!')
      
      // Log da ação
      logContactAction('whatsapp_opened', { studentId, phone, message })
      
    } catch (error) {
      console.error('Erro ao abrir WhatsApp:', error)
      toast.error('Erro ao abrir WhatsApp')
    }
  }

  const [adding, setAdding] = useState(false)

  const handleAddContactApi = async () => {
    if (!isValidPhone) {
      toast.error('Telefone inválido para adicionar contato')
      return
    }

    const normalized = normalizeToE164DigitsBR(phone)
    if (!normalized.ok || !normalized.value) {
      toast.error('Telefone inválido para adicionar contato')
      return
    }

    try {
      setAdding(true)
      
      // Debug: verificar variáveis de ambiente
      console.log('🔍 [WHATSAPP CONTACT] Variáveis de ambiente:', {
        instance: process.env.NEXT_PUBLIC_ZAPI_INSTANCE,
        token: process.env.NEXT_PUBLIC_ZAPI_TOKEN ? '✅ Presente' : '❌ Ausente'
      })
      
      console.log('🔍 [WHATSAPP CONTACT] Dados do contato:', {
        name: firstName,
        phone: normalized.value,
        studentId
      })
      
      // Usar a nova API que resolve o CORS
      const res = await fetch('/api/whatsapp/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: firstName,
          phone: normalized.value,
          instance: process.env.NEXT_PUBLIC_ZAPI_INSTANCE,
          token: process.env.NEXT_PUBLIC_ZAPI_TOKEN
        })
      })
      
      console.log('🔍 [WHATSAPP CONTACT] Resposta da API:', {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText
      })
      
        // Capturar resposta como texto primeiro para debug
        const responseText = await res.text()
        console.log('🔍 [WHATSAPP CONTACT] Resposta bruta:', responseText)
        
        let data = {}
        try {
          data = JSON.parse(responseText)
          console.log('🔍 [WHATSAPP CONTACT] Dados da resposta (JSON):', data)
          
          // Mostrar logs de teste se disponíveis
          if (data.testLogs) {
            console.log('🧪 [WHATSAPP CONTACT] LOGS DE TESTE DOS ENDPOINTS:')
            data.testLogs.forEach((log: any, index: number) => {
              console.log(`🧪 [TESTE ${index + 1}] Endpoint: ${log.endpoint}`)
              console.log(`🧪 [TESTE ${index + 1}] URL: ${log.url}`)
              console.log(`🧪 [TESTE ${index + 1}] Sucesso: ${log.success}`)
              if (log.error) {
                console.log(`🧪 [TESTE ${index + 1}] Erro: ${log.error}`)
              }
              if (log.status) {
                console.log(`🧪 [TESTE ${index + 1}] Status: ${log.status}`)
              }
              if (log.result) {
                console.log(`🧪 [TESTE ${index + 1}] Resultado:`, log.result)
              }
              console.log('---')
            })
          }
        } catch (parseError) {
          console.error('❌ [WHATSAPP CONTACT] Erro ao fazer parse do JSON:', parseError)
          console.log('🔍 [WHATSAPP CONTACT] Resposta não é JSON válido:', responseText)
          data = { error: 'Resposta inválida do servidor', raw: responseText }
        }
      
      if (res.ok && data?.success) {
        toast.success('Contato adicionado ao WhatsApp!')
        logContactAction('wa_add_contact_success', { studentId, phone: normalized.value })
      } else {
        const reason = data?.error || res.statusText || 'Falha desconhecida'
        toast.error(`Falha ao adicionar contato: ${reason}`)
        logContactAction('wa_add_contact_error', { studentId, phone: normalized.value, reason })
      }
    } catch (e: any) {
      console.error('❌ [WHATSAPP CONTACT] Erro:', e)
      toast.error('Falha ao adicionar contato: erro de rede')
      logContactAction('wa_add_contact_error', { studentId, reason: 'network_error' })
    } finally {
      setAdding(false)
    }
  }

  const logContactAction = async (action: string, data: any) => {
    try {
      const res = await fetch('/api/relationship/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          student_id: data.studentId,
          action,
          channel: 'whatsapp',
          template_code: data?.templateCode || null,
          task_id: data?.taskId || null,
          meta: data || {}
        })
      })
      if (!res.ok) {
        const t = await res.json().catch(() => ({}))
        console.warn('Falha ao registrar log:', t)
      }
    } catch (error) {
      console.error('Erro ao salvar log:', error)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <MessageSquare className="h-5 w-5 text-green-600" />
            </div>
            Criar Contato WhatsApp
          </DialogTitle>
          <DialogDescription className="text-base text-muted-foreground">
            Gere vCard e adicione contato para <span className="font-medium text-foreground">{firstName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações do Contato */}
          <div className="space-y-4">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-medium text-foreground">
                Primeiro Nome
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="name" 
                  value={firstName} 
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Nome do contato"
                  className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500" 
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Nome para identificação do contato no WhatsApp
              </p>
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="text-sm font-medium text-foreground">
                Telefone
              </Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  id="phone" 
                  value={phone} 
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(11) 99999-9999" 
                  className="pl-10 h-11 border-gray-200 focus:border-green-500 focus:ring-green-500" 
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Formato: DDD + número. Ex.: (11) 98765-4321
              </p>
              
              {/* Validação do telefone */}
              {phone && !isValidPhone && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-3">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Telefone inválido</p>
                    <p className="text-xs text-red-600">Verifique o formato do número</p>
                  </div>
                  <Link 
                    href={`/app/students/${studentId}/edit`} 
                    className="text-xs text-red-600 underline hover:no-underline flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Editar aluno
                  </Link>
                </div>
              )}
              
              {isValidPhone && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-3">
                  <CheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                  <p className="text-sm font-medium text-green-800">Telefone válido</p>
                </div>
              )}
            </div>
          </div>

          {/* Ações */}
          <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100">
            <Button 
              onClick={handleDownloadVCard} 
              disabled={!isValidPhone} 
              variant="outline"
              className="flex-1 h-11 border-gray-200 hover:bg-gray-50 hover:border-gray-300"
            >
              <Download className="h-4 w-4 mr-2" />
              Baixar vCard
            </Button>
            
            {(process.env.NEXT_PUBLIC_WA_ADD_CONTACT_ENABLED === 'true' || process.env.WA_ADD_CONTACT_ENABLED === 'true') && (
              <Button 
                onClick={handleAddContactApi} 
                disabled={!isValidPhone || adding} 
                className="flex-1 h-11 bg-green-600 hover:bg-green-700 text-white"
              >
                {adding ? (
                  <>
                    <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Adicionando...
                  </>
                ) : (
                  <>
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Adicionar
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
