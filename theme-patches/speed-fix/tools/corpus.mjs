import fs from 'fs'; import path from 'path';
export const walk = d => fs.readdirSync(d,{withFileTypes:true}).flatMap(e => e.isDirectory()? walk(path.join(d,e.name)) : [path.join(d,e.name)]);
export function buildCorpus(themeDir, contentDir) {
  const files = [...walk(themeDir).filter(f => /\.(liquid|js|json)$/.test(f)), ...walk(contentDir)];
  const text = files.map(f => fs.readFileSync(f,'utf8')).join('\n');
  const tokens = new Set(text.match(/[A-Za-z0-9_-]+/g));
  // dynamic stems: a class-like token that ends in - or _ and is immediately followed by
  // Liquid output, JS concatenation or a template-literal hole, e.g. "x--{{ y }}", 'x-' + y, `x-${y}`
  const stems = new Set();
  for (const m of text.matchAll(/([A-Za-z][A-Za-z0-9_-]*[-_])(?=\{\{|\{%|'\s*\+|"\s*\+|\$\{)/g)) stems.add(m[1]);
  // JS classList / className built from variables: keep any token that is used as a prefix argument
  for (const m of text.matchAll(/['"`]([A-Za-z][A-Za-z0-9_-]*[-_])['"`]/g)) stems.add(m[1]);
  return { files, tokens, stems: [...stems].filter(s => s.length >= 3) };
}
