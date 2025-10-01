import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID()
  console.log(`🔍 [${requestId}] API /api/anamnesis/generate-pdf POST chamada`)
  
  try {
    const cookieStore = cookies()
    const supabase = await createClient()
    
    // Verificar autenticação
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.warn(`⚠️ [${requestId}] Auth falhou:`, authError)
      return NextResponse.json({ 
        error: 'Unauthorized', 
        code: 'AUTH_FAILED',
        requestId 
      }, { status: 401 })
    }

    const { input, result } = await request.json()
    
    if (!input || !result) {
      return NextResponse.json({ 
        error: 'Dados inválidos', 
        code: 'VALIDATION_ERROR',
        requestId 
      }, { status: 422 })
    }

    // Gerar HTML do PDF
    const html = generatePDFHTML(input, result, requestId)
    
    // Por enquanto, retornar HTML (em produção, usar puppeteer ou similar)
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `attachment; filename="anamnese-${new Date().toISOString().split('T')[0]}.html"`
      }
    })

  } catch (error) {
    console.error(`❌ [${requestId}] Erro inesperado:`, error)
    return NextResponse.json({ 
      error: 'Erro interno', 
      code: 'INTERNAL_ERROR',
      requestId 
    }, { status: 500 })
  }
}

function generatePDFHTML(input: any, result: any, requestId: string): string {
  const currentDate = new Date().toLocaleDateString('pt-BR')
  const currentTime = new Date().toLocaleTimeString('pt-BR')
  
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Anamnese - ${currentDate}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 20px;
            background: white;
            color: #333;
        }
        .header {
            text-align: center;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
            margin-bottom: 30px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 28px;
        }
        .header p {
            margin: 5px 0 0 0;
            color: #666;
        }
        .section {
            margin-bottom: 30px;
            page-break-inside: avoid;
        }
        .section h2 {
            color: #2563eb;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
        }
        .card {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            background: #f9fafb;
        }
        .card h3 {
            margin: 0 0 10px 0;
            color: #374151;
            font-size: 16px;
        }
        .card p {
            margin: 5px 0;
            font-size: 14px;
        }
        .badge {
            display: inline-block;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: bold;
            margin: 2px;
        }
        .badge-success {
            background: #dcfce7;
            color: #166534;
        }
        .badge-warning {
            background: #fef3c7;
            color: #92400e;
        }
        .badge-danger {
            background: #fee2e2;
            color: #991b1b;
        }
        .protocol {
            border: 1px solid #e5e7eb;
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 15px;
            background: white;
        }
        .protocol h4 {
            margin: 0 0 10px 0;
            color: #374151;
        }
        .protocol p {
            margin: 5px 0;
            font-size: 14px;
            color: #6b7280;
        }
        .warning {
            background: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 15px;
            margin: 15px 0;
        }
        .warning h4 {
            margin: 0 0 10px 0;
            color: #92400e;
        }
        .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 12px;
            color: #6b7280;
        }
        .hash {
            font-family: monospace;
            background: #f3f4f6;
            padding: 2px 6px;
            border-radius: 4px;
        }
        @media print {
            body { margin: 0; }
            .section { page-break-inside: avoid; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>Anamnese de Treinamento</h1>
        <p>Relatório gerado em ${currentDate} às ${currentTime}</p>
        <p>Request ID: <span class="hash">${requestId}</span></p>
    </div>

    <div class="section">
        <h2>Dados de Entrada</h2>
        <div class="grid">
            <div class="card">
                <h3>Informações Pessoais</h3>
                <p><strong>Idade:</strong> ${input.age} anos</p>
                <p><strong>Peso:</strong> ${input.weight} kg</p>
                <p><strong>Altura:</strong> ${input.height} cm</p>
                <p><strong>Gênero:</strong> ${input.gender === 'male' ? 'Masculino' : 'Feminino'}</p>
            </div>
            ${input.fcr ? `
            <div class="card">
                <h3>Dados Cardíacos</h3>
                <p><strong>FCR:</strong> ${input.fcr} bpm</p>
                ${input.pse ? `<p><strong>PSE:</strong> ${input.pse}/10</p>` : ''}
                ${input.vvo2 ? `<p><strong>vVO2:</strong> ${input.vvo2} km/h</p>` : ''}
                ${input.mfel ? `<p><strong>MFEL:</strong> ${input.mfel}/10</p>` : ''}
            </div>
            ` : ''}
            ${input.rir !== undefined ? `
            <div class="card">
                <h3>Treinamento</h3>
                <p><strong>RIR:</strong> ${input.rir} repetições</p>
            </div>
            ` : ''}
        </div>
    </div>

    <div class="section">
        <h2>Resultados da Análise</h2>
        <div class="grid">
            <div class="card">
                <h3>IMC</h3>
                <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${result.bmi.toFixed(1)}</p>
                <span class="badge ${result.bmi < 25 ? 'badge-success' : result.bmi < 30 ? 'badge-warning' : 'badge-danger'}">
                    ${result.bmiCategory}
                </span>
            </div>
            <div class="card">
                <h3>Peso Ideal</h3>
                <p><strong>Faixa:</strong> ${result.idealWeight.min.toFixed(1)} - ${result.idealWeight.max.toFixed(1)} kg</p>
                <p><strong>Atual:</strong> ${result.idealWeight.current.toFixed(1)} kg</p>
                <p><strong>Diferença:</strong> ${(result.idealWeight.current - result.idealWeight.min).toFixed(1)} kg</p>
            </div>
        </div>
    </div>

    ${result.heartRateZones ? `
    <div class="section">
        <h2>Zonas de Frequência Cardíaca</h2>
        <div class="grid">
            ${Object.entries(result.heartRateZones).map(([zone, data]: [string, any]) => `
            <div class="card">
                <h3>${zone.replace('zone', 'Zona ')}</h3>
                <p><strong>${data.description}</strong></p>
                <p style="font-size: 18px; font-weight: bold;">${Math.round(data.min)} - ${Math.round(data.max)} bpm</p>
            </div>
            `).join('')}
        </div>
    </div>
    ` : ''}

    ${result.oneRepMax ? `
    <div class="section">
        <h2>Intensidade de Treino</h2>
        <div class="card">
            <h3>%1RM Baseado no RIR</h3>
            <p style="font-size: 24px; font-weight: bold; margin: 10px 0;">${result.oneRepMax.percentage}%</p>
            <p><strong>Descrição:</strong> ${result.oneRepMax.description}</p>
            <p><strong>RIR:</strong> ${result.oneRepMax.rir} repetições</p>
        </div>
    </div>
    ` : ''}

    <div class="section">
        <h2>Protocolos Recomendados (${result.protocols.length})</h2>
        ${result.protocols.map((protocol: any, index: number) => `
        <div class="protocol">
            <h4>${protocol.name}</h4>
            <p>${protocol.description}</p>
            <p><strong>Intensidade:</strong> ${protocol.intensity}</p>
            ${protocol.contraindications.length > 0 ? `
            <p><strong>Contraindicações:</strong> ${protocol.contraindications.join(', ')}</p>
            ` : ''}
            ${protocol.observations.length > 0 ? `
            <p><strong>Observações:</strong> ${protocol.observations.join(', ')}</p>
            ` : ''}
        </div>
        `).join('')}
    </div>

    <div class="section">
        <h2>Recomendações</h2>
        <ul>
            ${result.recommendations.map((rec: string) => `<li>${rec}</li>`).join('')}
        </ul>
    </div>

    ${result.warnings.length > 0 ? `
    <div class="warning">
        <h4>⚠️ Avisos Importantes</h4>
        <ul>
            ${result.warnings.map((warning: string) => `<li>${warning}</li>`).join('')}
        </ul>
    </div>
    ` : ''}

    <div class="footer">
        <p>Relatório gerado automaticamente pelo Sistema Organização10x</p>
        <p>Hash do commit: <span class="hash">${process.env.NEXT_PUBLIC_COMMIT_HASH || 'dev'}</span></p>
        <p>Versão: ${result.version} | Data: ${result.calculatedAt}</p>
    </div>
</body>
</html>
  `
}
