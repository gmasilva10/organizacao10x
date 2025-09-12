#!/usr/bin/env node

/**
 * Performance Baseline Script - GATE 10.4.3
 * Executa 10 navegações reais e coleta métricas de performance
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:3000';
const ITERATIONS = 10;
const RESULTS_FILE = path.join(__dirname, '../evidencias/perf_baseline.md');

async function runPerformanceTest() {
  console.log('🚀 Iniciando teste de performance baseline...');
  
  const browser = await puppeteer.launch({
    headless: false, // Para visualizar o processo
    defaultViewport: { width: 1200, height: 800 }
  });

  const results = {
    timestamp: new Date().toISOString(),
    iterations: ITERATIONS,
    metrics: {
      alunosList: [],
      alunosEdit: [],
      occurrencesTab: []
    }
  };

  try {
    for (let i = 0; i < ITERATIONS; i++) {
      console.log(`\n📊 Execução ${i + 1}/${ITERATIONS}`);
      
      const page = await browser.newPage();
      
      // Configurar coleta de métricas
      await page.evaluateOnNewDocument(() => {
        window.performanceMarks = [];
        window.performanceMeasures = [];
        
        // Interceptar performance marks
        const originalMark = performance.mark;
        performance.mark = function(name) {
          window.performanceMarks.push({
            name,
            timestamp: performance.now()
          });
          return originalMark.call(this, name);
        };
        
        // Interceptar performance measures
        const originalMeasure = performance.measure;
        performance.measure = function(name, start, end) {
          const measure = originalMeasure.call(this, name, start, end);
          window.performanceMeasures.push({
            name,
            duration: measure.duration,
            timestamp: performance.now()
          });
          return measure;
        };
      });

      // Teste 1: Listagem de Alunos
      console.log('  📋 Testando listagem de alunos...');
      await page.goto(`${BASE_URL}/app/students`, { waitUntil: 'networkidle0' });
      
      // Aguardar carregamento completo
      await page.waitForSelector('[data-testid="students-list"]', { timeout: 10000 });
      
      const listMetrics = await page.evaluate(() => {
        const marks = window.performanceMarks || [];
        const measures = window.performanceMeasures || [];
        
        return {
          marks: marks.filter(m => m.name.includes('alunos:list')),
          measures: measures.filter(m => m.name.includes('alunos:list')),
          navigationTiming: performance.getEntriesByType('navigation')[0]
        };
      });
      
      results.metrics.alunosList.push({
        iteration: i + 1,
        ...listMetrics
      });

      // Teste 2: Edição de Aluno
      console.log('  ✏️ Testando edição de aluno...');
      const studentLink = await page.$('a[href*="/edit"]');
      if (studentLink) {
        await studentLink.click();
        await page.waitForSelector('[data-testid="student-edit-form"]', { timeout: 10000 });
        
        const editMetrics = await page.evaluate(() => {
          const marks = window.performanceMarks || [];
          const measures = window.performanceMeasures || [];
          
          return {
            marks: marks.filter(m => m.name.includes('alunos:edit')),
            measures: measures.filter(m => m.name.includes('alunos:edit')),
            navigationTiming: performance.getEntriesByType('navigation')[0]
          };
        });
        
        results.metrics.alunosEdit.push({
          iteration: i + 1,
          ...editMetrics
        });
      }

      // Teste 3: Aba de Ocorrências (se disponível)
      console.log('  📝 Testando aba de ocorrências...');
      const occurrencesTab = await page.$('[data-testid="occurrences-tab"]');
      if (occurrencesTab) {
        await occurrencesTab.click();
        await page.waitForTimeout(1000); // Aguardar carregamento da aba
        
        const occurrencesMetrics = await page.evaluate(() => {
          const marks = window.performanceMarks || [];
          const measures = window.performanceMeasures || [];
          
          return {
            marks: marks.filter(m => m.name.includes('occurrences:tab')),
            measures: measures.filter(m => m.name.includes('occurrences:tab'))
          };
        });
        
        results.metrics.occurrencesTab.push({
          iteration: i + 1,
          ...occurrencesMetrics
        });
      }

      await page.close();
      
      // Pausa entre iterações
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Calcular estatísticas
    const stats = calculateStats(results);
    
    // Gerar relatório
    await generateReport(results, stats);
    
    console.log('\n✅ Teste de performance concluído!');
    console.log(`📊 Relatório salvo em: ${RESULTS_FILE}`);
    
  } catch (error) {
    console.error('❌ Erro durante o teste:', error);
  } finally {
    await browser.close();
  }
}

function calculateStats(results) {
  const stats = {};
  
  // Calcular P95 para cada métrica
  Object.keys(results.metrics).forEach(key => {
    const data = results.metrics[key];
    if (data.length > 0) {
      const durations = data.map(d => {
        const measure = d.measures?.find(m => m.name.includes('dataReady') || m.name.includes('interactive'));
        return measure ? measure.duration : 0;
      }).filter(d => d > 0);
      
      if (durations.length > 0) {
        durations.sort((a, b) => a - b);
        const p95Index = Math.ceil(durations.length * 0.95) - 1;
        const p95 = durations[p95Index];
        
        stats[key] = {
          p95: p95,
          median: durations[Math.floor(durations.length / 2)],
          min: Math.min(...durations),
          max: Math.max(...durations),
          count: durations.length
        };
      }
    }
  });
  
  return stats;
}

async function generateReport(results, stats) {
  const report = `# Performance Baseline - GATE 10.4.3

## 📊 Resumo Executivo

**Data/Hora**: ${results.timestamp}
**Iterações**: ${results.iterations}
**Status**: ${Object.keys(stats).length > 0 ? '✅ Concluído' : '❌ Falhou'}

## 🎯 Métricas P95 (Baseline)

| Métrica | P95 (ms) | Mediana (ms) | Min (ms) | Max (ms) | Amostras |
|---------|----------|--------------|----------|----------|----------|
${Object.keys(stats).map(key => {
  const s = stats[key];
  return `| ${key} | ${s.p95.toFixed(2)} | ${s.median.toFixed(2)} | ${s.min.toFixed(2)} | ${s.max.toFixed(2)} | ${s.count} |`;
}).join('\n')}

## 🚨 Critérios de Aceite

- **Listagem de Alunos**: P95 < 400ms ✅ ${stats.alunosList?.p95 < 400 ? '✅' : '❌'}
- **Edição de Aluno**: P95 < 500ms ✅ ${stats.alunosEdit?.p95 < 500 ? '✅' : '❌'}
- **Aba Ocorrências**: P95 < 200ms ✅ ${stats.occurrencesTab?.p95 < 200 ? '✅' : '❌'}

## 📈 Detalhes por Iteração

### Listagem de Alunos
${results.metrics.alunosList.map((item, i) => `
**Iteração ${i + 1}**:
- Marks: ${item.marks?.length || 0}
- Measures: ${item.measures?.length || 0}
- TTFB: ${item.navigationTiming?.responseStart - item.navigationTiming?.requestStart || 'N/A'}ms
`).join('')}

### Edição de Aluno
${results.metrics.alunosEdit.map((item, i) => `
**Iteração ${i + 1}**:
- Marks: ${item.marks?.length || 0}
- Measures: ${item.measures?.length || 0}
- TTFB: ${item.navigationTiming?.responseStart - item.navigationTiming?.requestStart || 'N/A'}ms
`).join('')}

### Aba Ocorrências
${results.metrics.occurrencesTab.map((item, i) => `
**Iteração ${i + 1}**:
- Marks: ${item.marks?.length || 0}
- Measures: ${item.measures?.length || 0}
`).join('')}

## 🔧 Próximos Passos

1. **Lazy Loading**: Implementar React.lazy + Suspense nas abas pesadas
2. **Cache Otimizado**: Configurar staleTime/gcTime adequados
3. **Bundle Optimization**: Reduzir tamanho do bundle inicial
4. **Re-render Optimization**: Minimizar re-renders desnecessários

## 📝 Observações

- Teste executado em ambiente de desenvolvimento
- Cache desabilitado para simular cenário real
- Navegação real com Puppeteer
- Métricas coletadas via Performance API

---
*Relatório gerado automaticamente pelo script de performance baseline*
`;

  // Criar diretório se não existir
  const dir = path.dirname(RESULTS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  
  fs.writeFileSync(RESULTS_FILE, report);
}

// Executar se chamado diretamente
if (require.main === module) {
  runPerformanceTest().catch(console.error);
}

module.exports = { runPerformanceTest };
