// Script para testar as APIs de catálogos
const testCatalogs = async () => {
  console.log('=== TESTANDO APIS DE CATÁLOGOS ===\n');
  
  const apis = [
    { name: 'Protocolos', url: '/api/guidelines/catalog/protocols' },
    { name: 'RIR', url: '/api/guidelines/catalog/rir' },
    { name: 'Prontidão', url: '/api/guidelines/catalog/readiness' }
  ];
  
  for (const api of apis) {
    console.log(`--- ${api.name} ---`);
    try {
      const response = await fetch(`http://localhost:3000${api.url}`);
      const data = await response.json();
      
      console.log(`Status: ${response.status}`);
      console.log(`Headers X-Query-Time: ${response.headers.get('X-Query-Time') || 'N/A'}`);
      
      if (response.ok) {
        console.log(`Dados: ${JSON.stringify(data, null, 2).substring(0, 200)}...`);
      } else {
        console.log(`Erro: ${data.error || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.log(`Erro de conexão: ${error.message}`);
    }
    console.log('');
  }
};

testCatalogs();
