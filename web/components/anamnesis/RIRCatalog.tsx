'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Info, Table } from 'lucide-react'

interface RIRData {
  matrix: Record<number, Record<number, number>>
  raw_data: Array<{
    rir_level: number
    reps: number
    percentage_1rm: number
  }>
}

export function RIRCatalog() {
  const [rirData, setRirData] = useState<RIRData | null>(null)
  const [loading, setLoading] = useState(true)
  const [queryTime, setQueryTime] = useState<number>(0)

  useEffect(() => {
    fetchRIRData()
  }, [])

  const fetchRIRData = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/guidelines/catalog/rir')
      const data = await response.json()
      
      if (response.ok) {
        setRirData(data.data)
        setQueryTime(data.meta?.query_time_ms || 0)
      } else {
        console.error('Erro ao buscar dados RIR:', data.error)
      }
    } catch (error) {
      console.error('Erro ao buscar dados RIR:', error)
    } finally {
      setLoading(false)
    }
  }

  // Gerar matriz de RIR para exibição
  const generateRIRMatrix = () => {
    if (!rirData?.matrix) return null

    const rirLevels = Object.keys(rirData.matrix).map(Number).sort((a, b) => b - a) // Ordem decrescente (10, 9, 8, 7, 6, 5)
    const repsRange = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]

    return { rirLevels, repsRange }
  }

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return 'bg-red-100 text-red-800'
    if (percentage >= 80) return 'bg-orange-100 text-orange-800'
    if (percentage >= 70) return 'bg-yellow-100 text-yellow-800'
    if (percentage >= 60) return 'bg-green-100 text-green-800'
    return 'bg-blue-100 text-blue-800'
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matriz RIR (Reps in Reserve)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    )
  }

  const matrixData = generateRIRMatrix()

  if (!matrixData || !rirData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Matriz RIR (Reps in Reserve)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Erro ao carregar dados RIR.
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Table className="h-5 w-5" />
          Matriz RIR (Reps in Reserve)
          <Badge variant="secondary">{rirData.raw_data.length} entradas</Badge>
          {queryTime > 0 && (
            <Badge variant="outline" className="text-xs">
              {queryTime}ms
            </Badge>
          )}
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Info className="h-4 w-4" />
          <span>Tabela de referência de intensidade por RIR</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 bg-muted font-medium text-left">RIR</th>
                {matrixData.repsRange.map(reps => (
                  <th key={reps} className="border p-2 bg-muted font-medium text-center">
                    {reps} reps
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrixData.rirLevels.map(rirLevel => (
                <tr key={rirLevel}>
                  <td className="border p-2 font-medium bg-muted">
                    RIR {rirLevel}
                  </td>
                  {matrixData.repsRange.map(reps => {
                    const percentage = rirData.matrix[rirLevel]?.[reps]
                    return (
                      <td key={reps} className="border p-2 text-center">
                        {percentage ? (
                          <Badge 
                            variant="outline" 
                            className={`text-xs ${getPercentageColor(percentage)}`}
                            title={`RIR ${rirLevel} com ${reps} repetições = ${percentage}% de 1RM`}
                          >
                            {percentage}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <h4 className="font-medium text-sm mb-2">Legenda de Intensidade:</h4>
            <div className="flex flex-wrap gap-2">
              <Badge className="bg-red-100 text-red-800">90%+ (Máxima)</Badge>
              <Badge className="bg-orange-100 text-orange-800">80-89% (Muito Alta)</Badge>
              <Badge className="bg-yellow-100 text-yellow-800">70-79% (Alta)</Badge>
              <Badge className="bg-green-100 text-green-800">60-69% (Moderada)</Badge>
              <Badge className="bg-blue-100 text-blue-800">50-59% (Baixa)</Badge>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            <p><strong>RIR (Reps in Reserve):</strong> Número de repetições que o indivíduo conseguiria realizar além das completadas.</p>
            <p><strong>Exemplo:</strong> Se o indivíduo completou 8 repetições e poderia fazer mais 2, o RIR é 2.</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
