'use client';

type CanvasTextContentProps = {
  html: string;
};

export function CanvasTextContent({ html }: CanvasTextContentProps) {
  return (
    <div
      className="canvas-text-content canvas-mdx-content text-sm leading-relaxed break-words"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
