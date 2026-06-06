import { getAccessiblePages, hasProtectedAccess } from '@/lib/protected';
import { appName } from '@/lib/shared';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasAccess = await hasProtectedAccess();
  const pages = getAccessiblePages(hasAccess);
  const body = pages
    .map((page) => `- [${page.data.title}](${page.url})`)
    .join('\n');

  return new Response(`# ${appName}\n\n${body}\n`);
}
