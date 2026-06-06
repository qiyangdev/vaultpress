import type { CanvasData, CanvasNode } from '@/lib/canvas-types';
import type { CanvasFileKind } from '@/lib/canvas-paths';

export type RenderableCanvasNode = CanvasNode & {
  href?: string;
  fileKind?: CanvasFileKind;
  backgroundUrl?: string;
  textHtml?: string;
};

export type RenderableCanvasData = {
  nodes: RenderableCanvasNode[];
  edges: CanvasData['edges'];
};
