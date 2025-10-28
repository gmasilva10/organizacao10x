'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  MessageSquare, 
  Smartphone, 
  Globe, 
  Loader2,
  CheckCircle,
  XCircle,
  Settings
} from 'lucide-react'
import { toast } from 'sonner'
import { whatsappService } from '@/lib/integrations/whatsapp/service'
import { WhatsAppContact, WhatsAppMessage, WhatsAppMethod } from '@/lib/integrations/whatsapp/types'

interface WhatsAppButtonProps {
  contact: WhatsAppContact
  message?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'sm' | 'default' | 'lg'
  showMethod?: boolean
  onSuccess?: (result: any) => void
  onError?: (error: string) => void
  className?: string
}

export function WhatsAppButton({
  contact,
  message,
  variant = 'default',
  size = 'default',
  showMethod = true,
  onSuccess,
  onError,
  className
}: WhatsAppButtonProps) {
  const [loading, setLoading] = useState(false)
  const [availableMethods, setAvailableMethods] = useState<WhatsAppMethod[]>([])
  const [currentMethod, setCurrentMethod] = useState<WhatsAppMethod>('desktop')

  // Detecta métodos disponíveis na montagem
  React.useEffect(() => {
    const detectMethods = async () => {
      const methods = await whatsappService.getAvailableMethods()
      setAvailableMethods(methods)
      
      if (methods.length > 0) {
        setCurrentMethod(methods[0])
      }
    }
    
    detectMethods()
  }, [])

  const handleClick = async () => {
    if (loading) return
    
    setLoading(true)
    
    try {
      let result
      
      if (message) {
        // Enviar mensagem
        const whatsappMessage: WhatsAppMessage = {
          text: message,
          contact
        }
        result = await whatsappService.sendMessage(whatsappMessage)
      } else {
        // Apenas abrir chat
        result = await whatsappService.openChat(contact)
      }
      
      if (result.success) {
        const methodName = result.method === 'desktop' ? 'WhatsApp Desktop' : 'WhatsApp Web'
        toast.success(`Abrindo ${methodName}...`, {
          description: `Chat com ${contact.name || contact.phone} iniciado`,
          icon: <CheckCircle className="h-4 w-4" />
        })
        
        onSuccess?.(result)
      } else {
        throw new Error(result.error || 'Erro desconhecido')
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro ao abrir WhatsApp'
      
      toast.error('Erro ao abrir WhatsApp', {
        description: errorMessage,
        icon: <XCircle className="h-4 w-4" />
      })
      
      onError?.(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const getMethodIcon = (method: WhatsAppMethod) => {
    switch (method) {
      case 'desktop':
        return <Smartphone className="h-4 w-4" />
      case 'web':
        return <Globe className="h-4 w-4" />
      case 'api':
        return <Settings className="h-4 w-4" />
      default:
        return <MessageSquare className="h-4 w-4" />
    }
  }

  const getMethodLabel = (method: WhatsAppMethod) => {
    switch (method) {
      case 'desktop':
        return 'Desktop'
      case 'web':
        return 'Web'
      case 'api':
        return 'API'
      default:
        return 'WhatsApp'
    }
  }

  const getMethodColor = (method: WhatsAppMethod) => {
    switch (method) {
      case 'desktop':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'web':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
      case 'api':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
    }
  }

  if (availableMethods.length === 0) {
    return (
      <Button
        variant="outline"
        size={size}
        disabled
        className={className}
      >
        <XCircle className="h-4 w-4 mr-2" />
        WhatsApp Indisponível
      </Button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={handleClick}
        disabled={loading}
        variant={variant}
        size={size}
        className={className}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
        ) : (
          <MessageSquare className="h-4 w-4 mr-2" />
        )}
        {message ? 'Enviar Mensagem' : 'Abrir WhatsApp'}
      </Button>
      
      {showMethod && availableMethods.length > 0 && (
        <Badge 
          variant="secondary" 
          className={`${getMethodColor(currentMethod)} text-xs`}
        >
          {getMethodIcon(currentMethod)}
          <span className="ml-1">{getMethodLabel(currentMethod)}</span>
        </Badge>
      )}
    </div>
  )
}

// Componente simplificado para uso rápido
interface QuickWhatsAppProps {
  phone: string
  name?: string
  message?: string
  className?: string
}

export function QuickWhatsApp({ phone, name, message, className }: QuickWhatsAppProps) {
  const contact: WhatsAppContact = {
    phone,
    name
  }

  return (
    <WhatsAppButton
      contact={contact}
      message={message}
      variant="outline"
      size="sm"
      showMethod={false}
      className={className}
    />
  )
}
