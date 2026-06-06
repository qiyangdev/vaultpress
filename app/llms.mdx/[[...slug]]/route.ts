import { getLLMText, getPageMarkdownUrl, resolvePage, source } from '@/lib/source';
import { hasProtectedAccess, isPageProtected, pageRequiresAuth } from '@/lib/protected';
import { notFound } from 'next/navigation';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: RouteContext<'/llms.mdx/[[...slug]]'>) {
  const { slug } = await params;
  const page = resolvePage(slug?.slice(0, -1));
  if (!page) notFound();

  if (pageRequiresAuth(page) && !(await hasProtectedAccess())) {
    return new Response('Unauthorized', { status: 401 });
  }

  return new Response(await getLLMText(page), {
    headers: {
      'Content-Type': 'text/markdown',
    },
  });
}

export function generateStaticParams() {
  return source.getPages().filter((page) => !isPageProtected(page)).map((page) => ({
    slug: getPageMarkdownUrl(page).segments,
  }));
}
