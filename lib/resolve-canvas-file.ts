import { source } from '@/lib/source';
import { normalizeCanvasPath } from '@/lib/canvas-paths';

function stripMarkdownExtension(filePath: string) {
  return filePath.replace(/\.(md|mdx)$/i, '');
}

function toSlugSegments(filePath: string) {
  return stripMarkdownExtension(normalizeCanvasPath(filePath))
    .split('/')
    .filter(Boolean);
}

export function resolveCanvasFileUrl(filePath: string, subpath?: string) {
  const normalized = normalizeCanvasPath(filePath);
  const page = source.getPage(toSlugSegments(normalized));

  if (page) {
    return `${page.url}${subpath ?? ''}`;
  }

  if (/\.(md|mdx)$/i.test(normalized)) {
    const fallback = `/${stripMarkdownExtension(normalized)}`;
    return `${fallback}${subpath ?? ''}`;
  }

  return `/${normalized}${subpath ?? ''}`;
}
