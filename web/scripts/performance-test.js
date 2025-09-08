const fetch = require('node-fetch');

// Simular requisições autenticadas para teste de performance
const BASE_URL = 'http://localhost:3000';

// Headers simulando autenticação
const authHeaders = {
  'Cookie': 'sb-access-token=test-token',
  'Content-Type': 'application/json'
};

async function testRoute(route, iterations = 20) {
  console.log(`\n🔍 Testando ${route} (${iterations} iterações)...`);
  const times = [];
  
  for (let i = 0; i < iterations; i++) {
    const start = Date.now();
    try {
      const response = await fetch(`${BASE_URL}${route}`, {
        headers: authHeaders
      });
      const end = Date.now();
      const duration = end - start;
      
      if (response.ok) {
        times.push(duration);
        const queryTime = response.headers.get('x-query-time');
        const rowCount = response.headers.get('x-row-count');
        console.log(`  ${i+1}: ${duration}ms (Query: ${queryTime}ms, Rows: ${rowCount})`);
      } else {
        console.log(`  ${i+1}: ERRO ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.log(`  ${i+1}: ERRO - ${error.message}`);
    }
    
    // Pequena pausa entre requisições
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  if (times.length === 0) {
    console.log('  ❌ Nenhuma requisição bem-sucedida');
    return null;
  }
  
  // Calcular estatísticas
  times.sort((a, b) => a - b);
  const p50 = times[Math.floor(times.length * 0.5)];
  const p95 = times[Math.floor(times.length * 0.95)];
  const p99 = times[Math.floor(times.length * 0.99)];
  const avg = times.reduce((a, b) => a + b, 0) / times.length;
  
  console.log(`  📊 Estatísticas:`);
  console.log(`     Média: ${avg.toFixed(1)}ms`);
  console.log(`     P50: ${p50}ms`);
  console.log(`     P95: ${p95}ms`);
  console.log(`     P99: ${p99}ms`);
  console.log(`     Sucessos: ${times.length}/${iterations}`);
  
  return { avg, p50, p95, p99, success: times.length, total: iterations };
}

async function runPerformanceTest() {
  console.log('🚀 Iniciando teste de performance GATE 9.6...');
  console.log('📅', new Date().toISOString());
  
  const routes = [
    '/api/students/summary',
    '/api/occurrences?page=1&page_size=20',
    '/api/occurrences/1',
    '/api/kanban/board'
  ];
  
  const results = {};
  
  for (const route of routes) {
    results[route] = await testRoute(route, 25);
  }
  
  console.log('\n📋 RESUMO DOS RESULTADOS:');
  console.log('========================');
  
  for (const [route, stats] of Object.entries(results)) {
    if (stats) {
      console.log(`${route}:`);
      console.log(`  P50: ${stats.p50}ms | P95: ${stats.p95}ms | P99: ${stats.p99}ms`);
      console.log(`  Sucesso: ${stats.success}/${stats.total}`);
    } else {
      console.log(`${route}: FALHOU`);
    }
  }
  
  // Verificar metas do GATE 9.6
  console.log('\n🎯 VERIFICAÇÃO DAS METAS GATE 9.6:');
  console.log('P95 < 400ms local | P99 < 650ms local');
  
  let allTargetsMet = true;
  for (const [route, stats] of Object.entries(results)) {
    if (stats) {
      const p95Ok = stats.p95 < 400;
      const p99Ok = stats.p99 < 650;
      const status = p95Ok && p99Ok ? '✅' : '❌';
      console.log(`${status} ${route}: P95=${stats.p95}ms, P99=${stats.p99}ms`);
      if (!p95Ok || !p99Ok) allTargetsMet = false;
    }
  }
  
  console.log(`\n${allTargetsMet ? '🎉' : '⚠️'} Metas ${allTargetsMet ? 'ATINGIDAS' : 'NÃO ATINGIDAS'}`);
}

runPerformanceTest().catch(console.error);
