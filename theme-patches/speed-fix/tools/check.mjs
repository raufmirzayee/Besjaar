import fs from 'fs'; import postcss from 'postcss';
for (const f of process.argv.slice(2)) {
  const s = fs.readFileSync(f,'utf8');
  try { postcss.parse(s); console.log('OK  ', f); }
  catch (e) { const lines = s.split('\n'); console.log('FAIL', f, `line ${e.line} col ${e.column}: ${e.reason}`);
    const L = lines[e.line-1] ?? ''; console.log('     context:', JSON.stringify(L.slice(Math.max(0,e.column-200), e.column+60))); }
}
