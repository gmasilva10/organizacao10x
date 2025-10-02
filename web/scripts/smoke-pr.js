#!/usr/bin/env node

/**
 * Smoke Test para Pull Requests
 * Executa testes básicos para validar que as mudanças não quebraram funcionalidades críticas
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Iniciando Smoke Test para PR...\n');

// Configurações
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const TIMEOUT = 30000; // 30 segundos

// Lista de testes críticos para PR
const CRITICAL_TESTS = [
  {
    name: 'Login e Navegação',
    file: 'smoke-auth-nav.spec.ts',
    description: 'Valida autenticação e navegação básica'
  },
  {
    name: 'Webhooks Hotmart',
    file: 'hotmart-webhooks.spec.ts', 
    description: 'Valida processamento de webhooks'
  }
];

async function runSmokeTest() {
  try {
    // 1. Verificar se o servidor está rodando
    console.log('📡 Verificando se o servidor está rodando...');
    try {
      const response = await fetch(BASE_URL);
      if (!response.ok) {
        throw new Error(`Servidor retornou status ${response.status}`);
      }
      console.log('✅ Servidor está rodando\n');
    } catch (error) {
      console.error('❌ Servidor não está acessível:', error.message);
      console.log('💡 Execute "npm run dev" antes de rodar os smoke tests');
      process.exit(1);
    }

    // 2. Executar testes críticos
    console.log('🧪 Executando testes críticos...\n');
    
    for (const test of CRITICAL_TESTS) {
      console.log(`📋 ${test.name}: ${test.description}`);
      
      try {
        const testPath = path.join(__dirname, '..', 'tests', 'e2e', 'specs', test.file);
        
        if (!fs.existsSync(testPath)) {
          console.log(`⚠️  Arquivo de teste não encontrado: ${test.file}`);
          continue;
        }

        // Executar teste específico
        const command = `npx playwright test ${testPath} --project=chromium --timeout=${TIMEOUT}`;
        console.log(`   Executando: ${command}`);
        
        execSync(command, { 
          stdio: 'inherit',
          cwd: path.join(__dirname, '..'),
          env: { ...process.env, BASE_URL }
        });
        
        console.log(`✅ ${test.name} - PASSOU\n`);
        
      } catch (error) {
        console.error(`❌ ${test.name} - FALHOU`);
        console.error(`   Erro: ${error.message}\n`);
        
        // Para PRs, falhar no primeiro erro crítico
        console.log('🛑 Smoke test falhou - PR não deve ser mergeado');
        process.exit(1);
      }
    }

    // 3. Verificar linting
    console.log('🔍 Verificando linting...');
    try {
      execSync('npm run lint', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Linting passou\n');
    } catch (error) {
      console.error('❌ Linting falhou');
      console.log('🛑 Corrija os erros de linting antes de fazer merge');
      process.exit(1);
    }

    // 4. Verificar build
    console.log('🏗️  Verificando build...');
    try {
      execSync('npm run build', { 
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
      });
      console.log('✅ Build passou\n');
    } catch (error) {
      console.error('❌ Build falhou');
      console.log('🛑 Corrija os erros de build antes de fazer merge');
      process.exit(1);
    }

    console.log('🎉 Smoke test concluído com sucesso!');
    console.log('✅ PR está pronto para merge');

  } catch (error) {
    console.error('💥 Erro inesperado no smoke test:', error.message);
    process.exit(1);
  }
}

// Executar smoke test
runSmokeTest();
