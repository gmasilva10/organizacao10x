/**
 * MessagePreviewBubble - Preview Visual Estilo Chat
 * Componente que renderiza uma mensagem no estilo de balão de chat (WhatsApp)
 * Segue o padrão visual estabelecido no plano de reforma
 */

'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface MessagePreviewBubbleProps {
  message: string
  senderName?: string
  senderAvatar?: string
  timestamp?: string
  className?: string
  showAvatar?: boolean
  isOwnMessage?: boolean
}

export function MessagePreviewBubble({
  message,
  senderName = 'Personal Trainer',
  senderAvatar,
  timestamp,
  className,
  showAvatar = true,
  isOwnMessage = false
}: MessagePreviewBubbleProps) {
  // Gerar timestamp se não fornecido
  const displayTime = timestamp || new Date().toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  })

  // Gerar iniciais do nome
  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return (
    <div className={cn(
      "flex items-end gap-2 max-w-xs",
      isOwnMessage ? "flex-row-reverse ml-auto" : "flex-row",
      className
    )}>
      {/* Avatar do remetente */}
      {showAvatar && !isOwnMessage && (
        <div className="w-8 h-8 flex-shrink-0 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-semibold">
          {senderAvatar ? (
            <img 
              src={senderAvatar} 
              alt={senderName}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            getInitials(senderName)
          )}
        </div>
      )}

      {/* Container da mensagem */}
      <div className={cn(
        "flex flex-col gap-1",
        isOwnMessage ? "items-end" : "items-start"
      )}>
        {/* Nome do remetente (apenas para mensagens recebidas) */}
        {!isOwnMessage && showAvatar && (
          <span className="text-xs text-muted-foreground font-medium px-1">
            {senderName}
          </span>
        )}

        {/* Balão da mensagem */}
        <div className={cn(
          "relative px-3 py-2 rounded-2xl max-w-full break-words",
          "shadow-sm border",
          "transition-all duration-200 ease-in-out",
          isOwnMessage 
            ? "bg-primary text-primary-foreground rounded-br-md" 
            : "bg-muted text-foreground rounded-bl-md",
          "hover:shadow-md"
        )}>
          {/* Conteúdo da mensagem */}
          <div className="text-sm leading-relaxed whitespace-pre-wrap">
            {message}
          </div>

          {/* Timestamp e status */}
          <div className={cn(
            "flex items-center justify-end gap-1 mt-1",
            isOwnMessage ? "text-primary-foreground/70" : "text-muted-foreground"
          )}>
            <span className="text-xs">
              {displayTime}
            </span>
            {isOwnMessage && (
              <div className="flex items-center gap-0.5">
                {/* Ícones de status (entregue/lido) */}
                <svg 
                  className="w-3 h-3" 
                  fill="currentColor" 
                  viewBox="0 0 16 16"
                >
                  <path d="M15.854 5.146a.5.5 0 0 1 0 .708l-5 5a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L10.5 9.793l4.646-4.647a.5.5 0 0 1 .708 0z"/>
                </svg>
                <svg 
                  className="w-3 h-3" 
                  fill="currentColor" 
                  viewBox="0 0 16 16"
                >
                  <path d="M15.854 5.146a.5.5 0 0 1 0 .708l-5 5a.5.5 0 0 1-.708 0l-3-3a.5.5 0 0 1 .708-.708L10.5 9.793l4.646-4.647a.5.5 0 0 1 .708 0z"/>
                </svg>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Componente de container para múltiplas mensagens
 * Simula uma conversa completa
 */
interface MessagePreviewContainerProps {
  messages: Array<{
    content: string
    senderName?: string
    senderAvatar?: string
    timestamp?: string
    isOwnMessage?: boolean
  }>
  className?: string
}

export function MessagePreviewContainer({
  messages,
  className
}: MessagePreviewContainerProps) {
  return (
    <div className={cn(
      "space-y-3 p-4 bg-muted/30 rounded-lg border",
      "max-h-96 overflow-y-auto",
      className
    )}>
      {messages.map((message, index) => (
        <MessagePreviewBubble
          key={index}
          message={message.content}
          senderName={message.senderName}
          senderAvatar={message.senderAvatar}
          timestamp={message.timestamp}
          isOwnMessage={message.isOwnMessage}
        />
      ))}
    </div>
  )
}

/**
 * Hook para gerar dados de exemplo para preview
 */
export function usePreviewData() {
  const generateExampleMessages = (template: string) => {
    // Simular renderização de variáveis
    const renderedMessage = template
      .replace(/\[PrimeiroNome\]/g, 'João')
      .replace(/\[SaudacaoTemporal\]/g, 'Bom dia')
      .replace(/\[NomePersonal\]/g, 'Carlos Personal')
      .replace(/\[DataTreino\]/g, '15/10/2025')
      .replace(/\[DataVencimento\]/g, '30/11/2025')
      .replace(/\[ValorPlano\]/g, 'R$ 150,00')

    return [
      {
        content: renderedMessage,
        senderName: 'Personal Trainer',
        isOwnMessage: false,
        timestamp: new Date().toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit'
        })
      }
    ]
  }

  return { generateExampleMessages }
}
