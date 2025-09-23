import puppeteer from 'puppeteer'

interface AnamneseData {
  name: string
  age: number
  gender: string
  phone: string
  weight: number
  height: number
  skinfolds: {
    tricipital: number
    peitoral: number
    subescapular: number
    suprailíaca: number
    axilar_media: number
    abdominal: number
    coxa: number
  }
  fcr: number
  pse: number
  vvo2: number
  mfel: number
  rir: number
  contraindications: string[]
  observations: string[]
  goals: string[]
}

export async function generateAnamnesePDF(data: AnamneseData, studentName: string): Promise<Buffer> {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  try {
    const page = await browser.newPage()
    
    const html = generateHTML(data, studentName)
    await page.setContent(html, { waitUntil: 'networkidle0' })
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    })
    
    return pdf
  } finally {
    await browser.close()
  }
}

function generateHTML(data: AnamneseData, studentName: string): string {
  const currentDate = new Date().toLocaleDateString('pt-BR')
  
  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Anamnese - ${studentName}</title>
      <style>
        body {
          font-family: 'Arial', sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
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
          margin-bottom: 25px;
          page-break-inside: avoid;
        }
        .section h2 {
          color: #2563eb;
          border-bottom: 1px solid #e5e7eb;
          padding-bottom: 5px;
          margin-bottom: 15px;
          font-size: 18px;
        }
        .field-group {
          display: flex;
          flex-wrap: wrap;
          gap: 20px;
          margin-bottom: 15px;
        }
        .field {
          flex: 1;
          min-width: 200px;
        }
        .field label {
          font-weight: bold;
          color: #374151;
          display: block;
          margin-bottom: 5px;
        }
        .field .value {
          background: #f9fafb;
          padding: 8px 12px;
          border-radius: 4px;
          border: 1px solid #e5e7eb;
        }
        .skinfolds-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
          margin-top: 10px;
        }
        .textarea-field {
          margin-top: 10px;
        }
        .textarea-field .value {
          min-height: 60px;
          white-space: pre-wrap;
        }
        .footer {
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #e5e7eb;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        @media print {
          body { margin: 0; }
          .section { page-break-inside: avoid; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Anamnese Personal Global</h1>
        <p>Aluno: ${studentName}</p>
        <p>Data: ${currentDate}</p>
      </div>

      <div class="section">
        <h2>Dados Pessoais</h2>
        <div class="field-group">
          <div class="field">
            <label>Nome Completo</label>
            <div class="value">${data.name || 'Não informado'}</div>
          </div>
          <div class="field">
            <label>Idade</label>
            <div class="value">${data.age || 'Não informado'} anos</div>
          </div>
          <div class="field">
            <label>Sexo</label>
            <div class="value">${data.gender === 'male' ? 'Masculino' : data.gender === 'female' ? 'Feminino' : 'Outro'}</div>
          </div>
          <div class="field">
            <label>Telefone</label>
            <div class="value">${data.phone || 'Não informado'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Antropometria</h2>
        <div class="field-group">
          <div class="field">
            <label>Peso</label>
            <div class="value">${data.weight || 'Não informado'} kg</div>
          </div>
          <div class="field">
            <label>Altura</label>
            <div class="value">${data.height || 'Não informado'} cm</div>
          </div>
        </div>
        
        <h3>Dobras Cutâneas (mm)</h3>
        <div class="skinfolds-grid">
          <div class="field">
            <label>Tricipital</label>
            <div class="value">${data.skinfolds?.tricipital || '0'}</div>
          </div>
          <div class="field">
            <label>Peitoral</label>
            <div class="value">${data.skinfolds?.peitoral || '0'}</div>
          </div>
          <div class="field">
            <label>Subescapular</label>
            <div class="value">${data.skinfolds?.subescapular || '0'}</div>
          </div>
          <div class="field">
            <label>Suprailíaca</label>
            <div class="value">${data.skinfolds?.suprailíaca || '0'}</div>
          </div>
          <div class="field">
            <label>Axilar Média</label>
            <div class="value">${data.skinfolds?.axilar_media || '0'}</div>
          </div>
          <div class="field">
            <label>Abdominal</label>
            <div class="value">${data.skinfolds?.abdominal || '0'}</div>
          </div>
          <div class="field">
            <label>Coxa</label>
            <div class="value">${data.skinfolds?.coxa || '0'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Avaliação Aeróbia</h2>
        <div class="field-group">
          <div class="field">
            <label>FCR (bpm)</label>
            <div class="value">${data.fcr || 'Não informado'}</div>
          </div>
          <div class="field">
            <label>PSE (1-10)</label>
            <div class="value">${data.pse || 'Não informado'}</div>
          </div>
          <div class="field">
            <label>vVO2 (km/h)</label>
            <div class="value">${data.vvo2 || 'Não informado'}</div>
          </div>
          <div class="field">
            <label>MFEL (Limiar)</label>
            <div class="value">${data.mfel || 'Não informado'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Força e RIR</h2>
        <div class="field-group">
          <div class="field">
            <label>RIR (Repetições na Reserva)</label>
            <div class="value">${data.rir || 'Não informado'}</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Objetivos e Observações</h2>
        <div class="textarea-field">
          <label>Objetivos</label>
          <div class="value">${data.goals?.join('\n') || 'Não informado'}</div>
        </div>
        
        <div class="textarea-field">
          <label>Contraindicações</label>
          <div class="value">${data.contraindications?.join('\n') || 'Nenhuma'}</div>
        </div>
        
        <div class="textarea-field">
          <label>Observações</label>
          <div class="value">${data.observations?.join('\n') || 'Nenhuma'}</div>
        </div>
      </div>

      <div class="footer">
        <p>Anamnese gerada automaticamente em ${currentDate}</p>
        <p>Personal Global - Sistema de Gestão</p>
      </div>
    </body>
    </html>
  `
}
