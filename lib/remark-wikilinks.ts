import { frontmatter } from 'fumadocs-core/content/md/frontmatter';
import { buildWikilinkIndex } from './wikilink-index';

const WIKILINK = /\[\[([^[\]|]+)(?:\|([^[\]]+))?\]\]/g;

type MdastText = { type: 'text'; value: string };
type MdastLink = {
  type: 'link';
  url: string;
  children: { type: 'text'; value: string }[];
};
type MdastParent = { type?: string; children: MdastNode[] };
type MdastNode = MdastText | MdastLink | MdastParent;

function splitWikilinks(
  node: { type: 'text'; value: string },
  resolve: (target: string) => string,
): MdastNode[] | null {
  const { value } = node;
  if (!value.includes('[[')) return null;

  const parts: MdastNode[] = [];
  let last = 0;

  for (const match of value.matchAll(WIKILINK)) {
    const start = match.index ?? 0;
    if (start > last) parts.push({ type: 'text', value: value.slice(last, start) });

    const target = match[1].trim();
    const label = (match[2] ?? target).trim();
    parts.push({
      type: 'link',
      url: resolve(target),
      children: [{ type: 'text', value: label }],
    });
    last = start + match[0].length;
  }

  if (last < value.length) parts.push({ type: 'text', value: value.slice(last) });
  return parts.length > 0 ? parts : null;
}

function transformWikilinks(parent: MdastParent, resolve: (target: string) => string) {
  for (let i = 0; i < parent.children.length; i++) {
    const child = parent.children[i];

    if (child.type === 'text' && 'value' in child) {
      const parts = splitWikilinks(child, resolve);
      if (parts) parent.children.splice(i, 1, ...parts);
      continue;
    }

    if ('children' in child && Array.isArray(child.children)) {
      transformWikilinks(child, resolve);
    }
  }
}

export function remarkWikilinks(contentDir = 'content') {
  const index = buildWikilinkIndex(contentDir, (raw) => {
    const { data } = frontmatter(raw);
    const title = (data as { title?: unknown }).title;
    return typeof title === 'string' ? title : undefined;
  });

  const resolve = (target: string) =>
    index.get(target.toLowerCase()) ??
    `./${target.toLowerCase().replace(/\s+/g, '-')}`;

  return (tree: MdastParent) => {
    transformWikilinks(tree, resolve);
  };
}
