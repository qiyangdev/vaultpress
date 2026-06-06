'use client';

import { Fragment, memo, type MouseEvent } from 'react';
import Image from 'next/image';
import Link from 'fumadocs-core/link';
import { useRouter } from 'next/navigation';
import {
  Handle,
  Position,
  type Node,
  type NodeProps,
  type NodeTypes,
} from '@xyflow/react';
import { useCanvasMdxPreview } from '@/components/canvas-mdx-preview-context';
import { CanvasTextContent } from '@/components/canvas-text-content';
import { cn } from '@/lib/cn';
import { canvasNodeStyle } from '@/lib/canvas-colors';
import { buttonVariants } from 'fumadocs-ui/components/ui/button';
import { getCanvasFileExtensionLabel } from '@/lib/canvas-paths';
import type { RenderableCanvasNode } from '@/lib/canvas-renderable';

export type CanvasFlowNodeData = {
  node: RenderableCanvasNode;
};

const SIDES = [
  { id: 'top', position: Position.Top },
  { id: 'right', position: Position.Right },
  { id: 'bottom', position: Position.Bottom },
  { id: 'left', position: Position.Left },
] as const;

const handleClass =
  '!opacity-0 !min-h-0 !min-w-0 !h-1 !w-1 !border-0 !bg-transparent !pointer-events-none';

function CanvasSideHandles() {
  return (
    <>
      {SIDES.map(({ id, position }) => (
        <Fragment key={id}>
          <Handle
            type="source"
            position={position}
            id={id}
            className={handleClass}
          />
          <Handle
            type="target"
            position={position}
            id={id}
            className={handleClass}
          />
        </Fragment>
      ))}
    </>
  );
}

function getFileDisplayName(filePath: string) {
  return filePath.split(/[/\\]/).pop() ?? filePath;
}

function CanvasNodeLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute bottom-full left-0 mb-1 max-w-full truncate text-xs font-medium text-fd-muted-foreground">
      {children}
    </div>
  );
}

function LabeledNodeWrapper({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="canvas-labeled-node relative h-full w-full">
      <CanvasNodeLabel>{label}</CanvasNodeLabel>
      {children}
    </div>
  );
}

function isInteractiveTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(
    target.closest('a, button, input, textarea, select, label, [role="button"]'),
  );
}

function getLinkLabel(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.hostname || url;
  } catch {
    return url;
  }
}

const cardClass =
  'h-full w-full overflow-hidden rounded-lg border text-fd-card-foreground shadow-sm';

const groupFrameClass = cn(
  buttonVariants({ color: 'secondary' }),
  'h-full w-full !p-0 hover:bg-fd-secondary hover:text-fd-secondary-foreground',
);

const TextFlowNode = memo(function TextFlowNode({ data }: NodeProps<Node<CanvasFlowNodeData>>) {
  const { node } = data;
  if (node.type !== 'text') return null;

  return (
    <div
      className={`${cardClass} flex flex-col justify-center px-3 py-2`}
      style={canvasNodeStyle(node.color)}
    >
      <CanvasSideHandles />
      {node.textHtml ? (
        <CanvasTextContent html={node.textHtml} />
      ) : (
        <div className="whitespace-pre-wrap text-sm leading-relaxed">{node.text}</div>
      )}
    </div>
  );
});

const FileFlowNode = memo(function FileFlowNode({
  id,
  data,
}: NodeProps<Node<CanvasFlowNodeData>>) {
  const { node } = data;
  const mdxPreview = useCanvasMdxPreview(id);
  const router = useRouter();
  if (node.type !== 'file') return null;

  const href = node.href ?? `/${node.file}`;

  const openNode = (event: MouseEvent<HTMLElement>) => {
    if (isInteractiveTarget(event.target)) return;
    router.push(href);
  };
  const displayName = getFileDisplayName(node.file);
  const nodeStyle = canvasNodeStyle(node.color);
  const fileKind = node.fileKind ?? 'other';

  if (fileKind === 'image') {
    return (
      <LabeledNodeWrapper label={displayName}>
        <Link
          href={href}
          aria-label={displayName}
          className={`${cardClass} relative block hover:opacity-90 transition-opacity`}
          style={nodeStyle}
        >
          <CanvasSideHandles />
          <Image
            src={href}
            alt=""
            fill
            className="object-cover"
            sizes={`${Math.round(node.width)}px`}
          />
        </Link>
      </LabeledNodeWrapper>
    );
  }

  if (fileKind === 'video') {
    return (
      <LabeledNodeWrapper label={displayName}>
        <div className={cardClass} style={nodeStyle}>
          <CanvasSideHandles />
          <video
            src={href}
            className="h-full w-full object-cover"
            controls
            preload="metadata"
            playsInline
          />
        </div>
      </LabeledNodeWrapper>
    );
  }

  if (fileKind === 'audio') {
    return (
      <LabeledNodeWrapper label={displayName}>
        <div
          className={`${cardClass} flex flex-col justify-center px-3 py-2`}
          style={nodeStyle}
        >
          <CanvasSideHandles />
          <audio src={href} controls preload="metadata" className="w-full" />
        </div>
      </LabeledNodeWrapper>
    );
  }

  if (fileKind === 'pdf') {
    return (
      <LabeledNodeWrapper label={displayName}>
        <div className={cardClass} style={nodeStyle}>
          <CanvasSideHandles />
          <iframe
            src={href}
            title={displayName}
            className="h-full w-full border-0 bg-fd-background"
          />
        </div>
      </LabeledNodeWrapper>
    );
  }

  if (fileKind === 'markdown') {
    return (
      <LabeledNodeWrapper label={displayName}>
        <div
          role="link"
          tabIndex={0}
          onClick={openNode}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !isInteractiveTarget(event.target)) {
              router.push(href);
            }
          }}
          className={`${cardClass} block cursor-pointer hover:bg-fd-accent/40 transition-colors`}
          style={nodeStyle}
        >
          <CanvasSideHandles />
          <div className="h-full overflow-auto px-3 py-2">
            {mdxPreview ?? (
              <span className="text-xs text-fd-muted-foreground">Note</span>
            )}
          </div>
        </div>
      </LabeledNodeWrapper>
    );
  }

  const typeLabel = getCanvasFileExtensionLabel(node.file);

  return (
    <LabeledNodeWrapper label={displayName}>
      <Link
        href={href}
        className={`${cardClass} flex flex-col justify-center px-3 py-2 text-sm hover:bg-fd-accent/40 transition-colors`}
        style={nodeStyle}
      >
        <CanvasSideHandles />
        <span className="text-xs text-fd-muted-foreground">{typeLabel}</span>
      </Link>
    </LabeledNodeWrapper>
  );
});

const LinkFlowNode = memo(function LinkFlowNode({ data }: NodeProps<Node<CanvasFlowNodeData>>) {
  const { node } = data;
  if (node.type !== 'link') return null;

  const label = getLinkLabel(node.url);

  return (
    <Link
      href={node.href ?? node.url}
      external
      className={`${cardClass} flex flex-col justify-center gap-0.5 px-3 py-2 text-sm hover:bg-fd-accent/40 transition-colors`}
      style={canvasNodeStyle(node.color)}
    >
      <CanvasSideHandles />
      <span className="truncate font-medium">{label}</span>
      <span className="truncate text-xs text-fd-muted-foreground">{node.url}</span>
    </Link>
  );
});

const GroupFlowNode = memo(function GroupFlowNode({ data }: NodeProps<Node<CanvasFlowNodeData>>) {
  const { node } = data;
  if (node.type !== 'group') return null;

  const backgroundSize =
    node.backgroundStyle === 'repeat'
      ? 'auto'
      : node.backgroundStyle === 'ratio'
        ? 'contain'
        : 'cover';

  return (
    <div className="canvas-labeled-node relative h-full w-full">
      {node.label && <CanvasNodeLabel>{node.label}</CanvasNodeLabel>}
      <div
        className={groupFrameClass}
        style={{
          backgroundImage: node.backgroundUrl ? `url(${node.backgroundUrl})` : undefined,
          backgroundRepeat: node.backgroundStyle === 'repeat' ? 'repeat' : 'no-repeat',
          backgroundSize,
          backgroundPosition: 'center',
        }}
      >
        <CanvasSideHandles />
      </div>
    </div>
  );
});

export const canvasNodeTypes = {
  text: TextFlowNode,
  file: FileFlowNode,
  link: LinkFlowNode,
  canvasGroup: GroupFlowNode,
} satisfies NodeTypes;
