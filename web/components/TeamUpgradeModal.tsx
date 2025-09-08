"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { 
  Crown, 
  Users, 
  CheckCircle, 
  ArrowRight,
  MessageCircle,
  ExternalLink
} from "lucide-react"

interface TeamUpgradeModalProps {
  isOpen: boolean
  onClose: () => void
  onViewPlans?: () => void
  onContactSupport?: () => void
}

export function TeamUpgradeModal({ 
  isOpen, 
  onClose, 
  onViewPlans, 
  onContactSupport 
}: TeamUpgradeModalProps) {
  const [loading, setLoading] = useState(false)

  const handleViewPlans = () => {
    setLoading(true)
    // Simular navegação
    setTimeout(() => {
      setLoading(false)
      onViewPlans?.()
      onClose()
    }, 1000)
  }

  const handleContactSupport = () => {
    setLoading(true)
    // Simular ação
    setTimeout(() => {
      setLoading(false)
      onContactSupport?.()
      onClose()
    }, 1000)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-100 rounded-lg">
              <Crown className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <DialogTitle className="text-xl">Upgrade Necessário</DialogTitle>
              <Badge variant="outline" className="mt-1">
                Plano Basic
              </Badge>
            </div>
          </div>
          <DialogDescription className="text-base">
            Para adicionar mais de 1 profissional, altere para o plano Enterprise.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Limitação atual */}
          <div className="p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Limitação do Plano Basic</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Você pode cadastrar apenas 1 profissional no plano atual.
            </p>
          </div>

          {/* Benefícios do Enterprise */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Com o plano Enterprise você terá:</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Profissionais ilimitados</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Múltiplos responsáveis por aluno</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Relatórios avançados</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <span className="text-sm">Suporte prioritário</span>
              </div>
            </div>
          </div>

          {/* Ações */}
          <div className="flex flex-col gap-2 pt-4">
            <Button 
              onClick={handleViewPlans}
              disabled={loading}
              className="w-full flex items-center gap-2"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <>
                  <ExternalLink className="h-4 w-4" />
                  Ver Planos
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={handleContactSupport}
              disabled={loading}
              className="w-full flex items-center gap-2"
            >
              <MessageCircle className="h-4 w-4" />
              Falar com Suporte
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={onClose}
              disabled={loading}
              className="w-full"
            >
              Cancelar
            </Button>
          </div>

          {/* Nota */}
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Seus dados do formulário serão preservados
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
