import fs from 'fs'; import path from 'path'; import postcss from 'postcss';
const [inDir, outDir] = process.argv.slice(2); fs.mkdirSync(outDir, { recursive: true });
for (const f of fs.readdirSync(inDir).filter(f => f.endsWith('.css'))) {
  const root = postcss.parse(fs.readFileSync(path.join(inDir, f), 'utf8'));
  root.walkComments(c => c.remove());
  fs.writeFileSync(path.join(outDir, f), root.toString());
}
