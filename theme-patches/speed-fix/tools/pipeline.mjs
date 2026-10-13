import fs from 'fs'; import path from 'path'; import postcss from 'postcss';
import { buildCorpus } from './corpus.mjs'; import { prune } from './prune.mjs'; import { overridePrune, LOG } from './override.mjs';
const [srcDir, corpusDir, contentDir, outDir] = process.argv.slice(2);
const css = n => fs.readFileSync(path.join(srcDir, 'assets', n + '.css'), 'utf8');
// Every stylesheet any reachable page can load (from layout/theme.liquid + sections)
const GLOBAL = ['besjaar-seo-base','besjaar-ui-cart','besjaar-seo-design','besjaar-seo-commerce','besjaar-seo-finish','besjaar-discount-badge','besjaar-seo-carriers-early','besjaar-seo-carriers-late'];
const PAGE_HEAD = { // position = index of the global file it follows; later globals override it on every page it loads
  'besjaar-store-home': 0, 'besjaar-ui-product-page': 1, 'besjaar-ui-bundle': 1, 'besjaar-ui-recommendations': 1,
  'besjaar-ui-catalog': 1,
  'besjaar-ui-pages': 1, 'besjaar-ui-account': 1, 'besjaar-home-step2': 2, 'besjaar-mobile-feature-cards': 2,
  'besjaar-product-step4': 2, 'besjaar-mobile-detail-clarity': 3, 'besjaar-ui-consent': 4 };
const PAGE_BODY = ['besjaar-product-detail', 'besjaar-reviews', 'besjaar-campaign',
  // also loaded again from body sections, so a copy sits AFTER the globals: retired-class cleanup only
  'besjaar-shower-collection', 'besjaar-collection-step3', 'besjaar-collection-actions-1134', 'besjaar-ui-shower-trust-education']; // loaded after the header group: nothing global follows
const CANDIDATES = [...GLOBAL, ...Object.keys(PAGE_HEAD), ...PAGE_BODY];
const SKIPPED = [];
const ALL = CANDIDATES.filter(n => { try { postcss.parse(fs.readFileSync(path.join(srcDir,'assets',n+'.css'),'utf8')); return true; }
  catch (e) { if (GLOBAL.includes(n)) throw new Error('global file does not parse: ' + n); SKIPPED.push(`${n} (${e.reason} at ${e.line}:${e.column})`); return false; } });
for (const n of SKIPPED) delete PAGE_HEAD[n.split(' ')[0]];
// fix the one stylesheet with a stray "}" exactly as browsers do (drop it and the rule it swallows)
const src = Object.fromEntries(ALL.map(n => [n, css(n)]));
// dead classes over ALL processed files
const { tokens, stems } = buildCorpus(corpusDir, contentDir);
const APP = /^(jdgm|shopify|spr-|pp-|klaviyo|needsclick|kl-|gp-|swiper|glide|tns|flickity|lazy)/;
const dead = new Set();
for (const n of ALL) postcss.parse(src[n]).walkRules(r => { for (const m of r.selector.matchAll(/\.(-?[A-Za-z_][A-Za-z0-9_-]*)/g)) {
  const c = m[1]; if (!tokens.has(c) && !APP.test(c) && !stems.some(s => c.startsWith(s))) dead.add(c); } });
const step1 = Object.fromEntries(ALL.map(n => [n, prune(src[n], dead).css]));
// override pass 1: global chain
const g = overridePrune(GLOBAL.map(n => ({ name: n, css: step1[n] })), new Set(GLOBAL.filter(n => n !== 'besjaar-ui-cart')));
const out = { ...step1 }; for (const f of g.out) out[f.name] = f.css;
let removedOv = g.removed;
// override pass 2: each head page file against the globals that load after it (using ORIGINAL global text as overriders is wrong once
// globals were pruned; use the pruned globals: a pruned global declaration was itself overridden by an even later one, so coverage is preserved)
for (const [n, at] of Object.entries(PAGE_HEAD)) {
  const chain = [{ name: n, css: out[n] }, ...GLOBAL.slice(at + 1).map(x => ({ name: x, css: out[x] }))];
  const r = overridePrune(chain, new Set([n])); out[n] = r.out[0].css; removedOv += r.removed;
}
fs.mkdirSync(outDir, { recursive: true });
let b = 0, a = 0; const rows = [];
for (const n of ALL) { fs.writeFileSync(path.join(outDir, n + '.css'), out[n]); b += src[n].length; a += out[n].length;
  rows.push(`${n.padEnd(36)} ${String(src[n].length).padStart(7)} -> ${String(out[n].length).padStart(7)}  -${((1 - out[n].length / src[n].length) * 100).toFixed(1)}%`); }
fs.writeFileSync('override-log.json', JSON.stringify(LOG, null, 1)); fs.writeFileSync('dead-classes.txt', [...dead].sort().join('\n'));
console.log(rows.join('\n')); console.log('left unchanged (does not parse cleanly):', SKIPPED.join('; ') || 'none'); console.log(`dead classes: ${dead.size}, overridden declarations removed: ${removedOv}`);
console.log(`ALL ${ALL.length} files: ${b} -> ${a} (-${((1 - a / b) * 100).toFixed(1)}%)`);
