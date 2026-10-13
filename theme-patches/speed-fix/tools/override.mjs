import postcss from 'postcss';
// Cascade-aware removal of declarations that can never win.
// files: [{name, css}] in load order; all must load on every page the earlier ones load on.
// prunable: names whose declarations may be removed (others act only as overriders).
const RISKY_SEL = /-webkit-|-moz-|-ms-|:has\(|::?part\(|:host|@container/i;
const RISKY_VAL = /\b\d*\.?\d+(dvh|svh|lvh|dvw|svw|lvw|cqw|cqh|cqi|cqb|cqmin|cqmax)\b|color-mix\(|oklch\(|oklab\(|\blab\(|\blch\(|light-dark\(|-webkit-|-moz-|-ms-|round\(|mod\(|rem\(|anchor\(/i;
const ctxOf = node => { const c = []; let p = node.parent; while (p && p.type !== 'root') { if (p.type === 'atrule') c.unshift(`@${p.name.toLowerCase()} ${p.params.replace(/\s+/g,' ').trim()}`); p = p.parent; } return c.join(' | '); };
// normalise whitespace around combinators, but never inside quoted strings
const norm = s => s.split(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/).map((part, i) => i % 2 ? part : part.replace(/\s+/g,' ').replace(/\s*([>+~,])\s*/g,'$1')).join('').trim();
export const LOG = [];
export function overridePrune(files, prunable) {
  const roots = files.map(f => postcss.parse(f.css));
  const decls = []; let pos = 0;
  roots.forEach((root, fi) => root.walkDecls(d => {
    const rule = d.parent; if (!rule || rule.type !== 'rule') return;
    if (rule.parent?.type === 'atrule' && /keyframes/i.test(rule.parent.name)) return;
    decls.push({ d, fi, pos: pos++, prop: d.prop.toLowerCase(), imp: !!d.important, ctx: ctxOf(rule),
      sels: rule.selectors.map(norm), safe: !RISKY_SEL.test(rule.selector) && !RISKY_VAL.test(d.value) && !/\\9|\*|_/.test(d.prop[0]) });
  }));
  // index: key(sel|prop) -> list of later candidate overriders
  const idx = new Map();
  for (const x of decls) for (const s of x.sels) { const k = s + '\u0000' + x.prop; (idx.get(k) || idx.set(k, []).get(k)).push(x); }
  let removed = 0;
  for (const x of decls) {
    if (!prunable.has(files[x.fi].name)) continue;
    const dead = x.sels.every(s => (idx.get(s + '\u0000' + x.prop) || []).some(y =>
      y.pos > x.pos && y.safe && (y.imp || !x.imp) && (y.ctx === x.ctx || y.ctx === '')));
    if (dead) { const w = x.sels.map(s => (idx.get(s + '\u0000' + x.prop) || []).find(y => y.pos > x.pos && y.safe && (y.imp || !x.imp) && (y.ctx === x.ctx || y.ctx === '')));
      LOG.push({ file: files[x.fi].name, sel: x.sels.join(','), decl: x.d.toString(), ctx: x.ctx, by: w.map(y => `${files[y.fi].name}: ${y.d.toString()}${y.ctx ? ' @ ' + y.ctx : ''}`) });
      x.d.remove(); removed++; }
  }
  const out = roots.map((root, fi) => {
    root.walkRules(r => { if (r.nodes && r.nodes.length === 0) r.remove(); });
    let ch = true; while (ch) { ch = false; root.walkAtRules(a => { if (/^(media|supports|container)$/i.test(a.name) && a.nodes && a.nodes.length === 0) { a.remove(); ch = true; } }); }
    return { name: files[fi].name, css: root.toString() };
  });
  return { out, removed };
}
