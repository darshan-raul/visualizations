export function topicHref(data: { slug: string; legacyPath?: string }) {
  return data.legacyPath || `/${data.slug}`;
}

export function canonicalPathname(value: string) {
  const url = new URL(value, 'https://infra-illustrated.local');
  return url.pathname.replace(/\.html$/, '').replace(/\/$/, '') || '/';
}
