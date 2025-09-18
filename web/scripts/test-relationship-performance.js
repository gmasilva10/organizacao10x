/**
 * Script para testar performance das APIs de relacionamento
 * Mede p95, p99 e tempo médio de resposta
 */

const { performance } = require('perf_hooks')

// Configurações
const BASE_URL = 'http://localhost:3000'
const TEST_ITERATIONS = 10
const CONCURRENT_REQUESTS = 5

// Função para fazer requisição HTTP
async function makeRequest(url, options = {}) {
  const start = performance.now()
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    })
    
    const end = performance.now()
    const duration = end - start
    
    return {
      success: response.ok,
      status: response.status,
      duration,
      error: null
    }
  } catch (error) {
    const end = performance.now()
    const duration = end - start
    
    return {
      success: false,
      status: 0,
      duration,
      error: error.message
    }
  }
}

// Função para testar performance de uma API
async function testApiPerformance(apiName, url, options = {}) {
  console.log(`\n🧪 Testando ${apiName}...`)
  
  const results = []
  
  // Teste sequencial
  for (let i = 0; i < TEST_ITERATIONS; i++) {
    const result = await makeRequest(url, options)
    results.push(result)
    
    if (i % 5 === 0) {
      console.log(`  Iteração ${i + 1}/${TEST_ITERATIONS} - ${result.duration.toFixed(2)}ms`)
    }
  }
  
  // Calcular estatísticas
  const durations = results.map(r => r.duration).sort((a, b) => a - b)
  const successCount = results.filter(r => r.success).length
  const errorCount = results.filter(r => !r.success).length
  
  const stats = {
    api: apiName,
    total_requests: results.length,
    success_count: successCount,
    error_count: errorCount,
    success_rate: (successCount / results.length * 100).toFixed(2) + '%',
    min_duration: Math.min(...durations).toFixed(2) + 'ms',
    max_duration: Math.max(...durations).toFixed(2) + 'ms',
    avg_duration: (durations.reduce((a, b) => a + b, 0) / durations.length).toFixed(2) + 'ms',
    p50_duration: durations[Math.floor(durations.length * 0.5)].toFixed(2) + 'ms',
    p95_duration: durations[Math.floor(durations.length * 0.95)].toFixed(2) + 'ms',
    p99_duration: durations[Math.floor(durations.length * 0.99)].toFixed(2) + 'ms'
  }
  
  console.log(`  ✅ Sucesso: ${stats.success_rate}`)
  console.log(`  ⏱️  Média: ${stats.avg_duration}`)
  console.log(`  📊 P95: ${stats.p95_duration}`)
  console.log(`  📊 P99: ${stats.p99_duration}`)
  
  return stats
}

// Função principal
async function runPerformanceTests() {
  console.log('🚀 Iniciando testes de performance das APIs de relacionamento...')
  console.log(`📊 Configuração: ${TEST_ITERATIONS} iterações, ${CONCURRENT_REQUESTS} requests concorrentes`)
  
  const allStats = []
  
  // Teste 1: API de Templates
  try {
    const templatesStats = await testApiPerformance(
      'Templates GET',
      `${BASE_URL}/api/relationship/templates`
    )
    allStats.push(templatesStats)
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`)
  }
  
  // Teste 2: API de Tarefas
  try {
    const tasksStats = await testApiPerformance(
      'Tasks GET',
      `${BASE_URL}/api/relationship/tasks`
    )
    allStats.push(tasksStats)
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`)
  }
  
  // Teste 3: API de Recalculate (Dry-run)
  try {
    const recalculateStats = await testApiPerformance(
      'Recalculate Dry-run',
      `${BASE_URL}/api/relationship/recalculate`,
      {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: 'test-tenant-id',
          dry_run: true
        })
      }
    )
    allStats.push(recalculateStats)
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`)
  }
  
  // Teste 4: API de Job
  try {
    const jobStats = await testApiPerformance(
      'Job POST',
      `${BASE_URL}/api/relationship/job`,
      {
        method: 'POST',
        body: JSON.stringify({
          tenant_id: 'test-tenant-id'
        })
      }
    )
    allStats.push(jobStats)
  } catch (error) {
    console.log(`  ❌ Erro: ${error.message}`)
  }
  
  // Resumo final
  console.log('\n📊 RESUMO FINAL:')
  console.log('=' * 80)
  
  allStats.forEach(stats => {
    console.log(`\n${stats.api}:`)
    console.log(`  Sucesso: ${stats.success_rate}`)
    console.log(`  Média: ${stats.avg_duration}`)
    console.log(`  P95: ${stats.p95_duration}`)
    console.log(`  P99: ${stats.p99_duration}`)
  })
  
  // Verificar critérios de aceite
  console.log('\n✅ CRITÉRIOS DE ACEITE:')
  const p95Threshold = 250 // ms
  const successRateThreshold = 95 // %
  
  let allPassed = true
  
  allStats.forEach(stats => {
    const p95 = parseFloat(stats.p95_duration)
    const successRate = parseFloat(stats.success_rate)
    
    const p95Pass = p95 <= p95Threshold
    const successPass = successRate >= successRateThreshold
    
    console.log(`  ${stats.api}:`)
    console.log(`    P95 ≤ ${p95Threshold}ms: ${p95Pass ? '✅' : '❌'} (${stats.p95_duration})`)
    console.log(`    Sucesso ≥ ${successRateThreshold}%: ${successPass ? '✅' : '❌'} (${stats.success_rate})`)
    
    if (!p95Pass || !successPass) {
      allPassed = false
    }
  })
  
  console.log(`\n🎯 RESULTADO FINAL: ${allPassed ? '✅ APROVADO' : '❌ REPROVADO'}`)
  
  return allStats
}

// Executar se chamado diretamente
if (require.main === module) {
  runPerformanceTests().catch(console.error)
}

module.exports = { runPerformanceTests }
