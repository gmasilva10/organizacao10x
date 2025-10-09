#!/usr/bin/env node
/*
 Audit script to prevent reintroduction of tenant_id references in the codebase.
 Fails with a non-zero exit code if critical patterns are found in source code.
*/
import fs from 'fs'
import path from 'path'

const root = process.cwd();

// Directories to scan (focused on source code)
const includeDirs = [
  'web/app',
  'web/server',
  'web/utils',
  'web/components',
  'web/lib',
  'web/hooks',
  'web/types',
  'web/tests',
];

// Paths to ignore (noise or legacy history)
const ignoreDirs = new Set([
  '.git', 'node_modules', '.next', 'dist', 'build', 'coverage',
  'playwright-report', 'web/playwright-report', 'web/test-results',
  'artifacts', 'evidencias', 'web/evidencias', 'docs', 'web/docs',
  'supabase/migrations', 'web/supabase/migrations',
]);

const codeExtensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs', '.sql']);

// Patterns considered critical (functional usage)
const patterns = [
  /\btenant_id\b/,        // direct DB column only (functional risk)
  /\btenantId\b(?!\s*[:=]\s*['"]?allowed)/, // accidental variable usage in code
];

// Simple allowlist of lines to ignore (comments only or documented references)
function isAllowedLine(line) {
  const trimmed = line.trim();
  if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) return true;
  if (trimmed.startsWith('#')) return true;
  // ignore URL query examples or doc strings
  if (/^".*tenant_id.*"$/.test(trimmed)) return true;
  // allow occurrences inside structured docs in Estrutura/evidencias
  if (rel.includes('Estrutura/') || rel.includes('evidencias/')) return true;
  return false;
}

function walk(dir, acc) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(root, full).replace(/\\/g, '/');
    if (e.isDirectory()) {
      if ([...ignoreDirs].some((p) => rel === p || rel.startsWith(p + '/'))) continue;
      walk(full, acc);
    } else {
      const ext = path.extname(e.name);
      if (codeExtensions.has(ext)) acc.push(rel);
    }
  }
}

function scanFile(rel) {
  const content = fs.readFileSync(rel, 'utf8');
  const lines = content.split(/\r?\n/);
  const hits = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isAllowedLine(line)) continue;
    for (const rx of patterns) {
      if (rx.test(line)) {
        hits.push({ line: i + 1, text: line.trim() });
        break;
      }
    }
  }
  return hits;
}

const files = [];
for (const d of includeDirs) {
  const abs = path.join(root, d);
  if (fs.existsSync(abs)) walk(abs, files);
}

let totalHits = 0;
const report = [];

for (const rel of files) {
  const hits = scanFile(rel);
  if (hits.length) {
    totalHits += hits.length;
    report.push({ file: rel, hits });
  }
}

if (totalHits > 0) {
  console.error('❌ tenant_id audit failed. Found references that must be removed:');
  for (const r of report) {
    console.error(`\nFile: ${r.file}`);
    r.hits.slice(0, 5).forEach((h) => console.error(`  L${h.line}: ${h.text}`));
    if (r.hits.length > 5) console.error(`  ...and ${r.hits.length - 5} more`);
  }
  process.exit(1);
}

console.log('✅ tenant_id audit passed (no functional references found).');
process.exit(0);


