import fs from 'fs'; import path from 'path'; import postcss from 'postcss';
// Remove selectors that REQUIRE a class known to never appear in any markup.
// A class only counts as required when it sits outside every (...) group, so
// :not(.x), :is(.x,.y), :where(), :has() alternatives are never treated as required.
export function prune(css, dead) {
  const root = postcss.parse(css);
  let removedSel = 0, removedRules = 0;
  const required = sel => { let depth = 0, out = '';
    for (const ch of sel) { if (ch === '(') depth++; else if (ch === ')') depth--; else if (depth === 0) out += ch; }
    return [...out.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)].map(m => m[1]); };
  root.walkRules(rule => {
    if (rule.parent?.type === 'atrule' && /keyframes/i.test(rule.parent.name)) return;
    const sels = rule.selectors; const keep = sels.filter(s => !required(s).some(c => dead.has(c)));
    if (keep.length === sels.length) return;
    removedSel += sels.length - keep.length;
    if (keep.length) rule.selectors = keep; else { rule.remove(); removedRules++; }
  });
  // drop at-rules (media/supports/layer) left empty
  let changed = true; while (changed) { changed = false;
    root.walkAtRules(a => { if (/^(media|supports|layer|container)$/i.test(a.name) && a.nodes && a.nodes.length === 0) { a.remove(); changed = true; } }); }
  return { css: root.toString(), removedSel, removedRules };
}
if (process.argv[1].endsWith('prune.mjs')) {
  const [root, deadFile, ...files] = process.argv.slice(2);
  const dead = new Set(fs.readFileSync(deadFile,'utf8').split('\n').filter(Boolean));
  let before = 0, after = 0;
  for (const f of files) { const p = path.join(root, f); const s = fs.readFileSync(p,'utf8'); const r = prune(s, dead);
    before += s.length; after += r.css.length;
    console.log(`${f.padEnd(42)} ${String(s.length).padStart(7)} -> ${String(r.css.length).padStart(7)}  (-${((1-r.css.length/s.length)*100).toFixed(1)}%)  selectors removed ${r.removedSel}, rules removed ${r.removedRules}`); }
  console.log(`TOTAL ${before} -> ${after} bytes (-${((1-after/before)*100).toFixed(1)}%)`);
}
