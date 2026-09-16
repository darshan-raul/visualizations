import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const slug = 'kubernetes-api-server';
let html = await readFile(join(root, 'dist', slug, 'index.html'), 'utf8');

const styles = [...html.matchAll(/<link rel="stylesheet" href="(\/_astro\/[^\"]+\.css)">/g)];
for (const match of styles) {
  const css = (await readFile(join(root, 'dist', match[1].slice(1)), 'utf8'))
    .replace(/@import\s+["']https:\/\/fonts\.googleapis\.com\/[^"']+["'];?/g, '')
    .replace(/@import\s+url\([^)]*fonts\.googleapis\.com[^)]*\);?/g, '');
  html = html.replace(match[0], `<style>\n${css}\n</style>`);
}

const scripts = [...html.matchAll(/<script type="module" src="(\/_astro\/[^\"]+\.js)"><\/script>/g)];
for (const match of scripts) {
  const js = await readFile(join(root, 'dist', match[1].slice(1)), 'utf8');
  if (/\bimport\s*(?:\{|\*|["'])/.test(js)) throw new Error(`Cannot inline imported module ${match[1]}`);
  html = html.replace(match[0], `<script type="module">\n${js}\n</script>`);
}

if (/<(?:link|script)[^>]+(?:src|href)="\/_astro\//.test(html)) throw new Error('Prototype still references a generated build asset.');
html = html.replace('<body>', '<body data-approval-prototype="kubernetes-api-server">');
const output = join(root, 'guide', 'topics', slug, `${slug}-visual-prototype.html`);
await mkdir(dirname(output), { recursive: true });
await writeFile(output, html);
process.stdout.write(`Wrote ${slug} approval prototype with ${styles.length} inline stylesheets and ${scripts.length} inline modules.\n`);
