#!/usr/bin/env node
/**
 * Varredura de encoding PT-BR: corrige mojibake (á, ç, ã, etc.)
 * Aplica apenas em arquivos de texto comuns do projeto.
 */
const fs = require('fs');
const path = require('path');

const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdx', '.yml', '.yaml', '.css', '.scss', '.html', '.txt']);
const skipDirs = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'artifacts']);

// Mapa de substitui��o (mojibake -> caractere correto)
const map = new Map(Object.entries({
  'á':'�','â':'�','ã':'�','ä':'�','� ': '�','ê':'�','é':'�','è':'�','ë':'�',
  'í':'�','î':'�','ï':'�','ó':'�','ô':'�','õ':'�','ö':'�','ú':'�','û':'�','ü':'�',
  'ç':'�','ñ':'�',
  '�?':'�','Â':'�','Ã':'�','Ä':'�','À':'�','Ê':'�','É':'�','È':'�','Ë':'�',
  '�?':'�','Î':'�','�?':'�','Ó':'�','Ô':'�','Õ':'�','Ö':'�','Ú':'�','Û':'�','Ü':'�',
  'Ç':'�','Ñ':'�',
  '«':'�','»':'�','·':'�','º':'�','ª':'�','°':'�','º':'�','©':'�','®':'�','§':'�',
  '–':'�','—':'�','‘':'�','’':'�','“':'�','�?':'�','•':'�','…':'�','›':'�','‹':'�','™':'�','€':'�','�':' '
}));

function fixMojibake(text){
  let out = text;
  for (const [bad, good] of map){
    out = out.split(bad).join(good);
  }
  // Heur�stica: se ainda sobrou muito "�" seguido de vogal, tentar latin1->utf8
  if (/�[\w\W]/.test(out)){
    try {
      const repaired = Buffer.from(out, 'latin1').toString('utf8');
      // aplica apenas se diminuir ocorr�ncias de "�"
      if ((repaired.match(/�/g)||[]).length < (out.match(/�/g)||[]).length){
        out = repaired;
      }
    } catch {}
  }
  return out;
}

function shouldProcess(file){
  const ext = path.extname(file).toLowerCase();
  return exts.has(ext);
}

function walk(dir, acc=[]) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })){
    if (skipDirs.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (entry.isFile() && shouldProcess(full)) acc.push(full);
  }
  return acc;
}

const roots = [process.cwd(), path.join(process.cwd(), 'web')];
const files = Array.from(new Set(roots.flatMap(r => fs.existsSync(r) ? walk(r) : [])));
let changed = 0;
for (const f of files){
  try{
    const buf = fs.readFileSync(f);
    const txt = buf.toString('utf8');
    if (!/[��’“�]/.test(txt)) continue; // atalho
    const fixed = fixMojibake(txt);
    if (fixed !== txt){
      fs.writeFileSync(f, fixed);
      changed++;
      console.log('Corrigido:', f);
    }
  } catch(e){
    // ignora
  }
}
console.log(`Total de arquivos corrigidos: ${changed}`);
