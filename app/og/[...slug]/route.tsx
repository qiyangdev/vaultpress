import { getPageImage, resolvePage, source } from '@/lib/source';
import { hasProtectedAccess, isPageProtected, pageRequiresAuth } from '@/lib/protected';
import { notFound } from 'next/navigation';
import { ImageResponse } from '@takumi-rs/image-response';
import { generate as DefaultImage } from 'fumadocs-ui/og/takumi';
import { appName } from '@/lib/shared';

export const dynamic = 'force-dynamic';

export async function GET(_req: Request, { params }: RouteContext<'/og/[...slug]'>) {
  const { slug } = await params;
  const page = resolvePage(slug.slice(0, -1));
  if (!page) notFound();

  if (pageRequiresAuth(page) && !(await hasProtectedAccess())) {
    notFound();
  }

  return new ImageResponse(
    <DefaultImage title={page.data.title} description={page.data.description} site={appName} />,
    {
      width: 1200,
      height: 630,
      format: 'webp',
    },
  );
}

export function generateStaticParams() {
  return source.getPages().filter((page) => !isPageProtected(page)).map((page) => ({
    slug: getPageImage(page).segments,
  }));
}
