import { access, readFile, readdir } from 'node:fs/promises';
import { extname, join } from 'node:path';

const siteDirectory = new URL('../dist/', import.meta.url);
const pages = [];

async function walk(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (entry.name.endsWith('.html')) pages.push(path);
  }
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function resolvePage(pathname) {
  const cleanPath = decodeURIComponent(pathname).replace(/^\/+/, '');
  const candidates = cleanPath === ''
    ? [join(siteDirectory.pathname, 'index.html')]
    : extname(cleanPath)
      ? [join(siteDirectory.pathname, cleanPath)]
      : [join(siteDirectory.pathname, cleanPath, 'index.html'), join(siteDirectory.pathname, `${cleanPath}.html`)];

  for (const candidate of candidates) if (await exists(candidate)) return candidate;
}

await walk(siteDirectory.pathname);
const failures = [];

for (const page of pages) {
  const html = await readFile(page, 'utf8');
  const hrefs = [...html.matchAll(/\shref=["']([^"']+)["']/g)].map((match) => match[1]);

  for (const href of hrefs) {
    if (/^(?:https?:|mailto:|tel:|data:|javascript:)/.test(href)) continue;
    const url = new URL(href, `https://infra-illustrated.local/${page.slice(siteDirectory.pathname.length).replace(/index\.html$/, '')}`);
    const target = await resolvePage(url.pathname);
    if (!target) {
      failures.push(`${page}: missing route ${href}`);
      continue;
    }

    if (url.hash) {
      const targetHtml = await readFile(target, 'utf8');
      const id = decodeURIComponent(url.hash.slice(1)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      if (!new RegExp(`\\s(?:id|name)=["']${id}["']`).test(targetHtml)) failures.push(`${page}: missing anchor ${href}`);
    }
  }
}

if (failures.length > 0) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Checked ${pages.length} generated pages; internal routes and anchors resolve.`);
}
