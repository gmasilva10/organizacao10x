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
      
      if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
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
    if (line.includes('tenant_id') && !line.includes('org_id')) {
      issues.push({
        line: index + 1,
        content: line.trim(),
        file: filePath
      });
    }
  });
  
  return issues;
}

function main() {
  console.log('🔍 Verificando uso de tenant_id em APIs...\n');
  
  const apiDir = path.join(__dirname, '..', 'app', 'api');
  const files = findFiles(apiDir, /\.ts$/);
  
  let totalIssues = 0;
  const filesWithIssues = [];
  
  for (const file of files) {
    const issues = checkTenantIdUsage(file);
    if (issues.length > 0) {
      filesWithIssues.push({ file, issues });
      totalIssues += issues.length;
    }
  }
  
  if (totalIssues === 0) {
    console.log('✅ Nenhum uso de tenant_id encontrado!');
    process.exit(0);
  }
  
  console.log(`❌ Encontrados ${totalIssues} usos de tenant_id em ${filesWithIssues.length} arquivos:\n`);
  
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
