import fs from 'node:fs/promises';
import path from 'node:path';
import type { CanvasNode } from '@/lib/canvas-types';
import type {
  RenderableCanvasData,
  RenderableCanvasNode,
} from '@/lib/canvas-renderable';
import { renderCanvasMarkdown } from '@/lib/canvas-markdown';
import {
  getCanvasFileKind,
  resolveCanvasAssetUrl,
} from '@/lib/canvas-paths';
import { parseCanvasData } from '@/lib/load-canvas';
import { resolveCanvasFileUrl } from '@/lib/resolve-canvas-file';
import { source } from '@/lib/source';

function resolveWikilink(target: string) {
  const segments = target
    .replace(/\.(md|mdx)$/i, '')
    .split('/')
    .filter(Boolean);
  return source.getPage(segments)?.url ?? null;
}

async function prepareNode(node: CanvasNode): Promise<RenderableCanvasNode> {
  if (node.type === 'text') {
    return {
      ...node,
      textHtml: renderCanvasMarkdown(node.text, resolveWikilink),
    };
  }

  if (node.type === 'file') {
    const fileKind = getCanvasFileKind(node.file);

    return {
      ...node,
      href: resolveCanvasFileUrl(node.file, node.subpath),
      fileKind,
    };
  }

  if (node.type === 'link') {
    return {
      ...node,
      href: node.url,
    };
  }

  if (node.type === 'group') {
    return {
      ...node,
      ...(node.background
        ? { backgroundUrl: resolveCanvasAssetUrl(node.background) }
        : {}),
    };
  }

  return node;
}

export async function prepareCanvasFromPublic(src: string): Promise<RenderableCanvasData> {
  const filePath = path.join(process.cwd(), 'public', src.replace(/^\//, ''));
  const raw = await fs.readFile(filePath, 'utf8');
  const data = parseCanvasData(raw);

  return {
    nodes: await Promise.all(data.nodes.map(prepareNode)),
    edges: data.edges,
  };
}
