#!/usr/bin/env node
/* Inlines styles.css and main.js into one portable HTML file.
   Usage: node tools/build-single-file.mjs [outfile]   (default: dist/index.html) */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

const out = process.argv[2] ?? 'dist/index.html';

const [html, css, js] = await Promise.all([
  readFile('index.html', 'utf8'),
  readFile('assets/css/styles.css', 'utf8'),
  readFile('assets/js/main.js', 'utf8'),
]);

const single = html
  .replace(
    '<link rel="stylesheet" href="assets/css/styles.css">',
    `<style>\n${css}\n</style>`
  )
  .replace(
    '<script src="assets/js/main.js"></script>',
    `<script>\n${js}\n</script>`
  );

await mkdir(dirname(out), { recursive: true });
await writeFile(out, single);
console.log(`${out} — ${(single.length / 1024).toFixed(1)} kB`);
