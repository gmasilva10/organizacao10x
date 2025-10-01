#!/usr/bin/env node
/**
 * Varredura de encoding PT-BR: corrige mojibake (Ã¡, Ã§, Ã£, etc.)
 * Aplica apenas em arquivos de texto comuns do projeto.
 */
const fs = require('fs');
const path = require('path');

const exts = new Set(['.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.mdx', '.yml', '.yaml', '.css', '.scss', '.html', '.txt']);
const skipDirs = new Set(['.git', 'node_modules', '.next', 'dist', 'build', 'artifacts']);

// Mapa de substituição (mojibake -> caractere correto)
const map = new Map(Object.entries({
  'Ã¡':'á','Ã¢':'â','Ã£':'ã','Ã¤':'ä','Ã ': 'à','Ãª':'ê','Ã©':'é','Ã¨':'è','Ã«':'ë',
  'Ã­':'í','Ã®':'î','Ã¯':'ï','Ã³':'ó','Ã´':'ô','Ãµ':'õ','Ã¶':'ö','Ãº':'ú','Ã»':'û','Ã¼':'ü',
  'Ã§':'ç','Ã±':'ñ',
  'Ã?':'Á','Ã‚':'Â','Ãƒ':'Ã','Ã„':'Ä','Ã€':'À','ÃŠ':'Ê','Ã‰':'É','Ãˆ':'È','Ã‹':'Ë',
  'Ã?':'Í','ÃŽ':'Î','Ã?':'Ï','Ã“':'Ó','Ã”':'Ô','Ã•':'Õ','Ã–':'Ö','Ãš':'Ú','Ã›':'Û','Ãœ':'Ü',
  'Ã‡':'Ç','Ã‘':'Ñ',
  'Â«':'«','Â»':'»','Â·':'·','Âº':'º','Âª':'ª','Â°':'°','Âº':'º','Â©':'©','Â®':'®','Â§':'§',
  'â€“':'–','â€”':'—','â€˜':'‘','â€™':'’','â€œ':'“','â€?':'”','â€¢':'•','â€¦':'…','â€º':'›','â€¹':'‹','â„¢':'™','â‚¬':'€','Â':' '
}));

function fixMojibake(text){
  let out = text;
  for (const [bad, good] of map){
    out = out.split(bad).join(good);
  }
  // Heurística: se ainda sobrou muito "Ã" seguido de vogal, tentar latin1->utf8
  if (/Ã[\w\W]/.test(out)){
    try {
      const repaired = Buffer.from(out, 'latin1').toString('utf8');
      // aplica apenas se diminuir ocorrências de "Ã"
      if ((repaired.match(/Ã/g)||[]).length < (out.match(/Ã/g)||[]).length){
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
    if (!/[ÃÂâ€™â€œâ€]/.test(txt)) continue; // atalho
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
