#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function findFiles(dir, pattern) {
  const files = [];
  
  function traverse(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (
        stat.isDirectory() &&
        !item.startsWith('.') &&
        item !== 'node_modules' &&
        !fullPath.includes(path.join('web', 'evidencias')) &&
        !fullPath.includes(path.join('web', 'Estrutura')) &&
        !fullPath.includes(path.join('web', 'testsprite_tests')) &&
        !fullPath.includes(path.join('web', 'tests'))
      ) {
        traverse(fullPath);
      } else if (stat.isFile() && pattern.test(item)) {
        files.push(fullPath);
      }
    }
  }
  
  traverse(dir);
  return files;
}

function checkTenantIdUsage(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    const isComment = trimmed.startsWith('//') || trimmed.startsWith('--') || trimmed.startsWith('/*') || trimmed.startsWith('*');
    if (isComment) return;
    if (trimmed.includes('tenant_id') && !trimmed.includes('org_id')) {
      issues.push({
        line: index + 1,
        content: trimmed,
        file: filePath
      });
    }
  });
  
  return issues;
}

function main() {
  console.log('🔍 Verificando uso indevido de tenant_id no código (fora das áreas permitidas)...\n');
  
  const webDir = path.join(__dirname, '..');
  const files = findFiles(webDir, /\.(ts|tsx|js|sql)$/);
  
  let totalIssues = 0;
  const filesWithIssues = [];
  
  for (const file of files) {
    // Permitir tenant_id em migrações antigas e server/events.ts (tabela events usa tenant_id)
    if (file.includes(path.join('web', 'supabase', 'migrations')) || 
        file.includes(path.join('server', 'events.ts'))) {
      continue;
    }
    // Ignorar o próprio script de verificação
    if (path.basename(file) === 'check-tenant-id.js') {
      continue;
    }
    const issues = checkTenantIdUsage(file);
    if (issues.length > 0) {
      filesWithIssues.push({ file, issues });
      totalIssues += issues.length;
    }
  }
  
  if (totalIssues === 0) {
    console.log('✅ Nenhum uso indevido de tenant_id encontrado!');
    process.exit(0);
  }
  
  console.log(`❌ Encontrados ${totalIssues} usos de tenant_id (sem org_id) em ${filesWithIssues.length} arquivos:\n`);
  
  filesWithIssues.forEach(({ file, issues }) => {
    const relativePath = path.relative(process.cwd(), file);
    console.log(`📁 ${relativePath}:`);
    
    issues.forEach(({ line, content }) => {
      console.log(`   ${line}: ${content}`);
    });
    
    console.log('');
  });
  
  console.log('💡 Dica: Use org_id em vez de tenant_id');
  process.exit(1);
}

if (require.main === module) {
  main();
}
