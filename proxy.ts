import { NextRequest, NextResponse } from 'next/server';
import { isMarkdownPreferred, rewritePath } from 'fumadocs-core/negotiation';
import { docsContentRoute, docsRoute } from '@/lib/shared';
import {
  getSlugFromContentPath,
  hasProtectedAccess,
  isProtectedSlug,
} from '@/lib/protected';

const { rewrite: rewriteDocs } = rewritePath(
  `${docsRoute}{/*path}`,
  `${docsContentRoute}{/*path}/content.md`,
);
const { rewrite: rewriteSuffix } = rewritePath(
  `${docsRoute}{/*path}.md`,
  `${docsContentRoute}{/*path}/content.md`,
);

export default async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  let rewriteTarget = rewriteSuffix(pathname);
  if (!rewriteTarget && isMarkdownPreferred(request)) {
    rewriteTarget = rewriteDocs(pathname);
  }

  if (rewriteTarget) {
    const slug = getSlugFromContentPath(rewriteTarget);
    if (slug && isProtectedSlug(slug) && !(await hasProtectedAccess())) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    return NextResponse.rewrite(new URL(rewriteTarget, request.nextUrl));
  }

  return NextResponse.next();
}
