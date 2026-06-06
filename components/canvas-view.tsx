'use client';

import { useEffect, useMemo, type ReactNode } from 'react';
import { CanvasMdxPreviewContext } from '@/components/canvas-mdx-preview-context';
import {
  Background,
  BackgroundVariant,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
} from '@xyflow/react';
import type { RenderableCanvasData } from '@/lib/canvas-renderable';
import { canvasToFlow } from '@/lib/canvas-to-flow';
import { CanvasControls } from '@/components/canvas-controls';
import { canvasNodeTypes } from '@/components/canvas-flow-nodes';

export type CanvasViewProps = {
  data: RenderableCanvasData;
  mdxPreviews?: Record<string, ReactNode>;
};

function CanvasFlow({ data }: CanvasViewProps) {
  const { fitView } = useReactFlow();
  const { nodes, edges } = useMemo(() => canvasToFlow(data), [data]);

  useEffect(() => {
    const id = requestAnimationFrame(() => {
      fitView({ padding: 0.15, duration: 0 });
    });
    return () => cancelAnimationFrame(id);
  }, [fitView, nodes, edges]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={canvasNodeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={false}
      panOnDrag
      panOnScroll
      zoomOnScroll
      zoomOnPinch
      colorMode="system"
      proOptions={{ hideAttribution: true }}
      className="canvas-flow bg-fd-muted/20"
    >
      <Background variant={BackgroundVariant.Dots} gap={20} size={1} />
      <CanvasControls fitViewPadding={0.15} />
    </ReactFlow>
  );
}

export function CanvasView({ data, mdxPreviews = {} }: CanvasViewProps) {
  if (data.nodes.length === 0) {
    return (
      <div className="not-prose flex h-[min(480px,60vh)] items-center justify-center rounded-xl border bg-fd-background text-sm text-fd-muted-foreground">
        Empty canvas
      </div>
    );
  }

  return (
    <div className="not-prose relative h-[min(640px,75vh)] w-full max-w-full overflow-hidden rounded-xl border [&_.canvas-flow]:h-full">
      <CanvasMdxPreviewContext.Provider value={mdxPreviews}>
        <ReactFlowProvider>
          <CanvasFlow data={data} />
        </ReactFlowProvider>
      </CanvasMdxPreviewContext.Provider>
      <div className="pointer-events-none absolute bottom-3 right-3 z-10 rounded-md border bg-fd-background/90 px-2 py-1 text-xs text-fd-muted-foreground">
        Drag to pan · Scroll to zoom
      </div>
    </div>
  );
}
