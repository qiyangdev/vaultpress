import { createRelativeLink } from 'fumadocs-ui/mdx';
import { getMDXComponents } from '@/components/mdx';
import { normalizeCanvasPath } from '@/lib/canvas-paths';
import { pageRequiresAuth } from '@/lib/protected';
import { source } from '@/lib/source';

function toSlugSegments(filePath: string) {
  return normalizeCanvasPath(filePath)
    .replace(/\.(md|mdx)$/i, '')
    .split('/')
    .filter(Boolean);
}

type CanvasMdxPreviewProps = {
  file: string;
  hasProtectedAccess: boolean;
};

export async function CanvasMdxPreview({
  file,
  hasProtectedAccess,
}: CanvasMdxPreviewProps) {
  const page = source.getPage(toSlugSegments(file));
  if (!page) {
    return <span className="text-xs text-fd-muted-foreground">Note</span>;
  }

  if (pageRequiresAuth(page) && !hasProtectedAccess) {
    return <span className="text-xs text-fd-muted-foreground">Protected</span>;
  }

  const MDX = page.data.body;

  return (
    <div className="canvas-text-content canvas-mdx-content text-sm leading-relaxed break-words">
      <MDX
        components={getMDXComponents({
          a: createRelativeLink(source, page),
        })}
      />
    </div>
  );
}
