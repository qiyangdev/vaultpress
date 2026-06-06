'use client';

import { cn } from '@/lib/cn';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { Panel, useReactFlow, useStore } from '@xyflow/react';
import { Maximize2, Minus, Plus } from 'lucide-react';

const controlButtonClass = buttonVariants({
  color: 'secondary',
  size: 'icon-sm',
});

type CanvasControlsProps = {
  fitViewPadding?: number;
};

export function CanvasControls({ fitViewPadding = 0.15 }: CanvasControlsProps) {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const minZoomReached = useStore((state) => state.transform[2] <= state.minZoom);
  const maxZoomReached = useStore((state) => state.transform[2] >= state.maxZoom);

  return (
    <Panel
      position="bottom-left"
      className="canvas-controls !m-3 flex flex-col gap-1 !bg-transparent !shadow-none"
    >
      <button
        type="button"
        className={cn(controlButtonClass)}
        onClick={() => zoomIn()}
        disabled={maxZoomReached}
        aria-label="Zoom In"
        title="Zoom In"
      >
        <Plus />
      </button>
      <button
        type="button"
        className={cn(controlButtonClass)}
        onClick={() => zoomOut()}
        disabled={minZoomReached}
        aria-label="Zoom Out"
        title="Zoom Out"
      >
        <Minus />
      </button>
      <button
        type="button"
        className={cn(controlButtonClass)}
        onClick={() => fitView({ padding: fitViewPadding, duration: 200 })}
        aria-label="Fit View"
        title="Fit View"
      >
        <Maximize2 />
      </button>
    </Panel>
  );
}
