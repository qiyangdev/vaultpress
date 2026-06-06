import { MarkerType, type Edge, type Node } from '@xyflow/react';
import type { CanvasFlowNodeData } from '@/components/canvas-flow-nodes';
import { resolveCanvasColor } from '@/lib/canvas-colors';
import type { CanvasEdge } from '@/lib/canvas-types';
import type { RenderableCanvasData } from '@/lib/canvas-renderable';

function edgeMarkers(edge: CanvasEdge, color: string) {
  const fromEnd = edge.fromEnd ?? 'none';
  const toEnd = edge.toEnd ?? 'arrow';
  const marker = {
    type: MarkerType.ArrowClosed,
    width: 16,
    height: 16,
    color,
  };

  return {
    markerStart: fromEnd === 'arrow' ? marker : undefined,
    markerEnd: toEnd === 'none' ? undefined : marker,
  };
}

export function canvasToFlow(data: RenderableCanvasData) {
  const nodes: Node<CanvasFlowNodeData>[] = data.nodes.map((node, index) => ({
    id: node.id,
    type: node.type === 'group' ? 'canvasGroup' : node.type,
    position: { x: node.x, y: node.y },
    data: { node },
    style: {
      width: node.width,
      height: node.height,
      ...(node.type === 'group' || node.type === 'file' ? { overflow: 'visible' } : {}),
    },
    zIndex: index,
    draggable: false,
    selectable: false,
    connectable: false,
  }));

  const edges: Edge[] = data.edges.flatMap((edge) => {
    const sourceExists = nodes.some((node) => node.id === edge.fromNode);
    const targetExists = nodes.some((node) => node.id === edge.toNode);
    if (!sourceExists || !targetExists) return [];

    const stroke = resolveCanvasColor(edge.color) ?? 'var(--color-fd-muted-foreground)';
    const markers = edgeMarkers(edge, stroke);

    return [
      {
        id: edge.id,
        source: edge.fromNode,
        target: edge.toNode,
        ...(edge.fromSide ? { sourceHandle: edge.fromSide } : {}),
        ...(edge.toSide ? { targetHandle: edge.toSide } : {}),
        label: edge.label,
        type: 'smoothstep',
        selectable: false,
        focusable: false,
        ...markers,
        style: {
          stroke,
          strokeWidth: 2,
        },
        labelStyle: {
          fill: 'var(--color-fd-muted-foreground)',
          fontSize: 11,
          fontWeight: 500,
        },
        labelBgStyle: {
          fill: 'var(--color-fd-background)',
          fillOpacity: 0.92,
        },
        labelBgPadding: [6, 4] as [number, number],
        labelBgBorderRadius: 4,
      },
    ];
  });

  return { nodes, edges };
}
