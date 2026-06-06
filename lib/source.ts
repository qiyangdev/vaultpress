import { docs } from 'collections/server';
import { loader } from 'fumadocs-core/source';
import { lucideIconsPlugin } from 'fumadocs-core/source/lucide-icons';
import { docsContentRoute, docsImageRoute, docsRoute } from './shared';

// See https://fumadocs.dev/docs/headless/source-api for more info
export const source = loader({
  baseUrl: docsRoute,
  source: docs.toFumadocsSource(),
  plugins: [lucideIconsPlugin()],
});

function toSlugSegments(slug?: string | string[]) {
  if (!slug) return undefined;
  return (Array.isArray(slug) ? slug : slug.split('/')).filter((segment) => segment.length > 0);
}

function encodeSlugSegment(segment: string) {
  try {
    return encodeURI(decodeURIComponent(segment));
  } catch {
    return encodeURI(segment);
  }
}

/** Resolve pages for catch-all routes; handles encoded/decoded non-ASCII slugs. */
export function resolvePage(slug?: string | string[]) {
  const segments = toSlugSegments(slug);
  if (!segments || segments.length === 0) return source.getPage([]);

  const candidates = [
    segments,
    segments.map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    }),
    segments.map(encodeSlugSegment),
  ];

  for (const candidate of candidates) {
    const page = source.getPage(candidate);
    if (page) return page;
  }
}

export function getPageImage(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'image.webp'];

  return {
    segments,
    url: `${docsImageRoute}/${segments.join('/')}`,
  };
}

export function getPageMarkdownUrl(page: (typeof source)['$inferPage']) {
  const segments = [...page.slugs, 'content.md'];

  return {
    segments,
    url: `${docsContentRoute}/${segments.join('/')}`,
  };
}

export async function getLLMText(page: (typeof source)['$inferPage']) {
  const processed = await page.data.getText('processed');

  return `# ${page.data.title} (${page.url})

${processed}`;
}
