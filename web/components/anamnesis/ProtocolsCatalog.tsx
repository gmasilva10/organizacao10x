'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Search, Info, Users, User, UserCheck, Calculator, Copy } from 'lucide-react'
import { InlineMath, BlockMath } from 'react-katex'
import 'katex/dist/katex.min.css'

interface AnthroProtocol {
  id: string
  code: string
  label: string
  sexo: 'M' | 'F' | 'ANY'
  skinfolds: string[]
  density_equation: Record<string, number>
  fat_equation: {
    formula: string
    equation: string
  }
  version_tag: string
}

export function ProtocolsCatalog() {
  const [protocols, setProtocols] = useState<AnthroProtocol[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [sexFilter, setSexFilter] = useState<string>('all')
  const [queryTime, setQueryTime] = useState<number>(0)

  useEffect(() => {
    fetchProtocols()
  }, [])

  const fetchProtocols = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/guidelines/catalog/protocols')
      const data = await response.json()
      
      if (response.ok) {
        setProtocols(data.data || [])
        setQueryTime(data.meta?.query_time_ms || 0)
      } else {
        console.error('Erro ao buscar protocolos:', data.error)
      }
    } catch (error) {
      console.error('Erro ao buscar protocolos:', error)
    } finally {
      setLoading(false)
    }
  }

  const filteredProtocols = protocols.filter(protocol => {
    const matchesSearch = protocol.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         protocol.label.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesSex = sexFilter === 'all' || protocol.sexo === sexFilter || protocol.sexo === 'ANY'
    return matchesSearch && matchesSex
  })

  const getSexIcon = (sex: string) => {
    switch (sex) {
      case 'M': return <User className="h-4 w-4" />
      case 'F': return <UserCheck className="h-4 w-4" />
      case 'ANY': return <Users className="h-4 w-4" />
      default: return <Users className="h-4 w-4" />
    }
  }

  const getSexLabel = (sex: string) => {
    switch (sex) {
      case 'M': return 'Masculino'
      case 'F': return 'Feminino'
      case 'ANY': return 'Ambos'
      default: return 'Ambos'
    }
  }

  const formatFormula = (equation: any) => {
    if (!equation) return 'N/A'
    
    // Para density_equation (Record<string, number>)
    if (typeof equation === 'object' && !equation.formula) {
      // Converter para fórmula matemática LaTeX
      const parts = Object.entries(equation).map(([key, value]) => {
        // Mapear variáveis comuns para LaTeX
        const latexKey = key
          .replace('age', '\\text{idade}')
          .replace('height', '\\text{altura}')
          .replace('weight', '\\text{peso}')
          .replace('sum_skinfolds', '\\sum \\text{dobras}')
          .replace('skinfold_sum', '\\sum \\text{dobras}')
        return `${latexKey} = ${value}`
      })
      return parts.join(', ')
    }
    
    // Para fat_equation (com formula e equation)
    if (equation.formula && equation.equation) {
      // Converter equação para LaTeX
      let latexEquation = equation.equation
        .replace(/\*\*/g, '^') // ** para ^
        .replace(/\*/g, ' \\cdot ') // * para \cdot
        .replace(/log/g, '\\log') // log para \log
        .replace(/ln/g, '\\ln') // ln para \ln
        .replace(/sqrt/g, '\\sqrt') // sqrt para \sqrt
        .replace(/sum/g, '\\sum') // sum para \sum
        .replace(/age/g, '\\text{idade}') // age para \text{idade}
        .replace(/height/g, '\\text{altura}') // height para \text{altura}
        .replace(/weight/g, '\\text{peso}') // weight para \text{peso}
        .replace(/skinfolds/g, '\\text{dobras}') // skinfolds para \text{dobras}
        .replace(/density/g, '\\text{densidade}') // density para \text{densidade}
        .replace(/fat/g, '\\%\\text{gordura}') // fat para \%\text{gordura}
      
      return `${equation.formula}: ${latexEquation}`
    }
    
    return 'N/A'
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const renderMathFormula = (formula: string) => {
    try {
      // Se a fórmula contém múltiplas equações (separadas por vírgula), renderizar cada uma
      if (formula.includes(',')) {
        return (
          <div className="space-y-1">
            {formula.split(',').map((eq, index) => (
              <div key={index} className="text-sm">
                <InlineMath math={eq.trim()} />
              </div>
            ))}
          </div>
        )
      }
      
      // Se contém ":", separar título da equação
      if (formula.includes(':')) {
        const [title, equation] = formula.split(':')
        return (
          <div className="space-y-1">
            <div className="text-xs font-medium text-muted-foreground">{title.trim()}</div>
            <div className="text-sm">
              <InlineMath math={equation.trim()} />
            </div>
          </div>
        )
      }
      
      return <InlineMath math={formula} />
    } catch (error) {
      console.warn('Erro ao renderizar fórmula LaTeX:', error)
      return <span className="font-mono text-sm">{formula}</span>
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Protocolos Antropométricos</CardTitle>
          <div className="flex gap-4">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          Protocolos Antropométricos
          <Badge variant="secondary">{filteredProtocols.length} protocolos</Badge>
          {queryTime > 0 && (
            <Badge variant="outline" className="text-xs">
              {queryTime}ms
            </Badge>
          )}
        </CardTitle>
        <div className="flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por código ou nome..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={sexFilter} onValueChange={setSexFilter}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filtrar por sexo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="M">Masculino</SelectItem>
              <SelectItem value="F">Feminino</SelectItem>
              <SelectItem value="ANY">Ambos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProtocols.map((protocol) => (
            <Card key={protocol.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">{protocol.code}</CardTitle>
                    <p className="text-sm text-muted-foreground">{protocol.label}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSexIcon(protocol.sexo)}
                    <Badge variant="secondary" className="text-xs">
                      {protocol.version_tag}
                    </Badge>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getSexLabel(protocol.sexo)}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {protocol.skinfolds.length} dobras
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Dobras Cutâneas */}
                <div>
                  <h4 className="font-medium text-sm text-muted-foreground mb-2">
                    Dobras Cutâneas
                  </h4>
                  <div className="flex flex-wrap gap-1">
                    {protocol.skinfolds.map((site, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {site}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Fórmula de Densidade */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      Densidade Corporal
                    </h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => copyToClipboard(formatFormula(protocol.density_equation))}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copiar fórmula</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-sm font-mono">
                      {renderMathFormula(formatFormula(protocol.density_equation))}
                    </div>
                  </div>
                </div>

                {/* Fórmula de % Gordura */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm text-muted-foreground">
                      % Gordura Corporal
                    </h4>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <button
                            onClick={() => copyToClipboard(formatFormula(protocol.fat_equation))}
                            className="p-1 hover:bg-muted rounded"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Copiar fórmula</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-sm font-mono">
                      {renderMathFormula(formatFormula(protocol.fat_equation))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {filteredProtocols.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              Nenhum protocolo encontrado.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
