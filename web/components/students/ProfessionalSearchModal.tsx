"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { 
  Search, 
  User, 
  Mail, 
  Phone, 
  CheckCircle, 
  Loader2,
  X
} from "lucide-react"
import { toast } from "sonner"

interface Professional {
  id: number
  full_name: string
  email: string
  whatsapp_work: string
  professional_profiles: {
    name: string
  }
  is_active: boolean
}

interface ProfessionalSearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelect: (professional: Professional) => void
  title: string
  placeholder?: string
}

export default function ProfessionalSearchModal({
  open,
  onOpenChange,
  onSelect,
  title,
  placeholder = "Buscar profissional..."
}: ProfessionalSearchModalProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [professionals, setProfessionals] = useState<Professional[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null)
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (open) {
      loadProfessionals()
    }
  }, [open])

  const loadProfessionals = async (query: string = '') => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        status: 'active',
        limit: '20'
      })
      
      if (query.trim()) {
        params.set('q', query.trim())
      }
      
      const response = await fetch(`/api/professionals?${params}`)
      
      if (!response.ok) {
        throw new Error('Erro ao carregar profissionais')
      }
      
      const data = await response.json()
      setProfessionals(data.professionals || [])
    } catch (error) {
      console.error('Erro ao carregar profissionais:', error)
      toast.error('Erro ao carregar profissionais')
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (value: string) => {
    setSearchTerm(value)
    
    // Limpar timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout)
    }
    
    // Configurar novo timeout para debounce (300ms)
    const timeout = setTimeout(() => {
      loadProfessionals(value)
    }, 300)
    
    setSearchTimeout(timeout)
  }

  // Cleanup do timeout ao desmontar
  useEffect(() => {
    return () => {
      if (searchTimeout) {
        clearTimeout(searchTimeout)
      }
    }
  }, [searchTimeout])

  const handleSelect = (professional: Professional) => {
    setSelectedProfessional(professional)
  }

  const handleConfirm = () => {
    if (selectedProfessional) {
      onSelect(selectedProfessional)
      onOpenChange(false)
      setSelectedProfessional(null)
      setSearchTerm("")
    }
  }

  const filteredProfessionals = professionals.filter(professional => 
    professional.is_active && (
      professional.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      professional.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 space-y-4">
          {/* Busca */}
          <div className="space-y-2">
            <Label htmlFor="search" className="sr-only">Buscar profissional</Label>
            <Input
              id="search"
              value={searchTerm}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={placeholder}
              className="w-full"
            />
            {loading && (
              <div className="flex items-center justify-center py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Buscando...</span>
              </div>
            )}
          </div>

          {/* Lista de Profissionais */}
          <div className="flex-1 overflow-y-auto space-y-2">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="ml-2">Carregando profissionais...</span>
              </div>
            ) : filteredProfessionals.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum profissional encontrado</p>
                {searchTerm && (
                  <p className="text-sm">Tente outro termo de busca</p>
                )}
              </div>
            ) : (
              filteredProfessionals.map((professional) => (
                <Card 
                  key={professional.id}
                  className={`cursor-pointer transition-colors hover:bg-muted/50 ${
                    selectedProfessional?.id === professional.id 
                      ? 'ring-2 ring-primary bg-primary/5' 
                      : ''
                  }`}
                  onClick={() => handleSelect(professional)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-medium">{professional.full_name}</h3>
                          <Badge variant="outline" className="text-xs">
                            {professional.professional_profiles.name}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            Ativo
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {professional.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {professional.whatsapp_work}
                          </div>
                        </div>
                      </div>
                      {selectedProfessional?.id === professional.id && (
                        <CheckCircle className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Rodapé */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!selectedProfessional}
          >
            Selecionar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
