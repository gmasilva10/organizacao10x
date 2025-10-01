"use client"

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AnamneseInput, AnamneseResult } from '@/lib/anamnese/engine'
import { Loader2, Download, AlertTriangle, CheckCircle } from 'lucide-react'

interface AnamnesePreviewProps {
  input: AnamneseInput
  onClose: () => void
}

export function AnamnesePreview({ input, onClose }: AnamnesePreviewProps) {
  const [result, setResult] = useState<AnamneseResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const calculateAnamnese = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/anamnesis/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input)
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao calcular anamnese')
      }
      
      const data = await response.json()
      setResult(data.result)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido')
    } finally {
      setLoading(false)
    }
  }

  const generatePDF = async () => {
    if (!result) return
    
    try {
      const response = await fetch('/api/anamnesis/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input, result })
      })
      
      if (!response.ok) {
        throw new Error('Erro ao gerar PDF')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `anamnese-${new Date().toISOString().split('T')[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (err) {
      console.error('Erro ao gerar PDF:', err)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Preview da Anamnese</h2>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
          <Button onClick={calculateAnamnese} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculando...
              </>
            ) : (
              'Calcular'
            )}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="space-y-6">
          {/* Antropometria */}
          <Card>
            <CardHeader>
              <CardTitle>Antropometria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">IMC</label>
                  <p className="text-2xl font-bold">{result.bmi.toFixed(1)}</p>
                  <Badge variant={result.bmi < 25 ? 'default' : 'destructive'}>
                    {result.bmiCategory}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Peso Ideal</label>
                  <p className="text-lg">
                    {result.idealWeight.min.toFixed(1)} - {result.idealWeight.max.toFixed(1)} kg
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Atual: {result.idealWeight.current.toFixed(1)} kg
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Zonas de Frequência Cardíaca */}
          {result.heartRateZones && (
            <Card>
              <CardHeader>
                <CardTitle>Zonas de Frequência Cardíaca</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(result.heartRateZones).map(([zone, data]) => (
                    <div key={zone} className="p-3 border rounded-lg">
                      <h4 className="font-medium capitalize">{zone.replace('zone', 'Zona ')}</h4>
                      <p className="text-sm text-muted-foreground">{data.description}</p>
                      <p className="text-lg font-bold">
                        {Math.round(data.min)} - {Math.round(data.max)} bpm
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* %1RM */}
          {result.oneRepMax && (
            <Card>
              <CardHeader>
                <CardTitle>Intensidade de Treino (%1RM)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold">{result.oneRepMax.percentage}%</p>
                    <p className="text-sm text-muted-foreground">1RM</p>
                  </div>
                  <div>
                    <p className="font-medium">{result.oneRepMax.description}</p>
                    <p className="text-sm text-muted-foreground">
                      RIR: {result.oneRepMax.rir} repetições
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Protocolos */}
          <Card>
            <CardHeader>
              <CardTitle>Protocolos Recomendados ({result.protocols.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {result.protocols.map((protocol, index) => (
                  <div key={index} className="p-4 border rounded-lg">
                    <h4 className="font-medium">{protocol.name}</h4>
                    <p className="text-sm text-muted-foreground mb-2">{protocol.description}</p>
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{protocol.intensity}</Badge>
                    </div>
                    {protocol.contraindications.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-red-600">Contraindicações:</p>
                        <ul className="text-sm text-red-600 list-disc list-inside">
                          {protocol.contraindications.map((contra, i) => (
                            <li key={i}>{contra}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {protocol.observations.length > 0 && (
                      <div className="mt-2">
                        <p className="text-sm font-medium text-blue-600">Observações:</p>
                        <ul className="text-sm text-blue-600 list-disc list-inside">
                          {protocol.observations.map((obs, i) => (
                            <li key={i}>{obs}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recomendações */}
          <Card>
            <CardHeader>
              <CardTitle>Recomendações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{rec}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Avisos */}
          {result.warnings.length > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-800">Avisos Importantes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {result.warnings.map((warning, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-yellow-800">{warning}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Ações */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
            <Button onClick={generatePDF}>
              <Download className="mr-2 h-4 w-4" />
              Gerar PDF
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
