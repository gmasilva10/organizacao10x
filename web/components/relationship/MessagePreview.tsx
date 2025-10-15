/**
 * MessagePreview - Componente de Preview de Mensagens
 * 
 * Mostra preview em tempo real da mensagem com variáveis renderizadas
 */

'use client'

import React, { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { MessageSquare, Eye } from 'lucide-react'
import { renderPreview } from '@/lib/relationship/variable-renderer'

interface MessagePreviewProps {
  template: string
  anchor?: string
  temporalOffset?: number | null
}

export function MessagePreview({ template, anchor, temporalOffset }: MessagePreviewProps) {
  // Renderizar preview com dados de exemplo
  const renderedMessage = useMemo(() => {
    if (!template || template.trim() === '') {
      return ''
    }
    
    return renderPreview(template)
  }, [template])

  // Gerar descrição do agendamento
  const scheduleDescription = useMemo(() => {
    if (!anchor) return null
    
    const anchorLabels: Record<string, string> = {
      'sale_close': 'fechamento da venda',
      'first_workout': 'primeiro treino',
      'weekly_followup': 'último treino',
      'monthly_review': 'aniversário de cadastro',
      'birthday': 'aniversário',
      'renewal_window': 'vencimento do plano',
      'occurrence_followup': 'ocorrência'
    }
    
    const anchorLabel = anchorLabels[anchor] || anchor
    
    if (temporalOffset === null || temporalOffset === undefined) {
      return `Será enviada imediatamente no momento do ${anchorLabel}`
    }
    
    if (temporalOffset === 0) {
      return `Será enviada no momento do ${anchorLabel}`
    }
    
    if (temporalOffset > 0) {
      return `Será enviada ${temporalOffset} dia${temporalOffset > 1 ? 's' : ''} após ${anchorLabel}`
    }
    
    return `Será enviada ${Math.abs(temporalOffset)} dia${Math.abs(temporalOffset) > 1 ? 's' : ''} antes de ${anchorLabel}`
  }, [anchor, temporalOffset])

  if (!template || template.trim() === '') {
    return null
  }

  return (
    <Card className="border-2 border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Eye className="h-4 w-4 text-blue-600" />
          Preview da Mensagem
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Descrição do agendamento */}
        {scheduleDescription && (
          <div className="p-2 bg-blue-100 rounded-md text-xs text-blue-800 font-medium">
            📅 {scheduleDescription}
          </div>
        )}
        
        {/* Preview da mensagem */}
        <div className="p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">
                PT
              </div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500 mb-1">Personal Trainer</div>
              <div className="bg-green-100 rounded-lg rounded-tl-none p-3 text-sm text-gray-800 whitespace-pre-wrap">
                {renderedMessage}
              </div>
              <div className="text-xs text-gray-400 mt-1">
                {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Legenda */}
        <div className="text-xs text-gray-600 space-y-1">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-3 w-3" />
            <span>Preview com dados de exemplo</span>
          </div>
          <div className="text-gray-500">
            As variáveis serão substituídas por dados reais de cada aluno no momento do envio
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
