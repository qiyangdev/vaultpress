import type { CanvasData, CanvasEdge, CanvasNode } from './canvas-types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseNode(value: unknown): CanvasNode | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string') return null;
  if (typeof value.type !== 'string') return null;
  if (typeof value.x !== 'number') return null;
  if (typeof value.y !== 'number') return null;
  if (typeof value.width !== 'number') return null;
  if (typeof value.height !== 'number') return null;

  const base = {
    id: value.id,
    x: value.x,
    y: value.y,
    width: value.width,
    height: value.height,
    color: typeof value.color === 'string' ? value.color : undefined,
  };

  switch (value.type) {
    case 'text':
      if (typeof value.text !== 'string') return null;
      return { ...base, type: 'text', text: value.text };
    case 'file':
      if (typeof value.file !== 'string') return null;
      return {
        ...base,
        type: 'file',
        file: value.file,
        subpath: typeof value.subpath === 'string' ? value.subpath : undefined,
      };
    case 'link':
      if (typeof value.url !== 'string') return null;
      return { ...base, type: 'link', url: value.url };
    case 'group':
      return {
        ...base,
        type: 'group',
        label: typeof value.label === 'string' ? value.label : undefined,
        background: typeof value.background === 'string' ? value.background : undefined,
        backgroundStyle:
          value.backgroundStyle === 'cover' ||
          value.backgroundStyle === 'ratio' ||
          value.backgroundStyle === 'repeat'
            ? value.backgroundStyle
            : undefined,
      };
    default:
      return null;
  }
}

function parseEdge(value: unknown): CanvasEdge | null {
  if (!isRecord(value)) return null;
  if (typeof value.id !== 'string') return null;
  if (typeof value.fromNode !== 'string') return null;
  if (typeof value.toNode !== 'string') return null;

  const side = (v: unknown) =>
    v === 'top' || v === 'right' || v === 'bottom' || v === 'left' ? v : undefined;
  const end = (v: unknown) => (v === 'none' || v === 'arrow' ? v : undefined);

  return {
    id: value.id,
    fromNode: value.fromNode,
    toNode: value.toNode,
    fromSide: side(value.fromSide),
    toSide: side(value.toSide),
    fromEnd: end(value.fromEnd),
    toEnd: end(value.toEnd),
    color: typeof value.color === 'string' ? value.color : undefined,
    label: typeof value.label === 'string' ? value.label : undefined,
  };
}

export function parseCanvasData(raw: string): CanvasData {
  const parsed = JSON.parse(raw) as unknown;
  if (!isRecord(parsed)) {
    return { nodes: [], edges: [] };
  }

  const nodes = Array.isArray(parsed.nodes)
    ? parsed.nodes.map(parseNode).filter((node): node is CanvasNode => node !== null)
    : [];
  const edges = Array.isArray(parsed.edges)
    ? parsed.edges.map(parseEdge).filter((edge): edge is CanvasEdge => edge !== null)
    : [];

  return { nodes, edges };
}
