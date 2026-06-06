import { getLLMText } from '@/lib/source';
import { getAccessiblePages, hasProtectedAccess } from '@/lib/protected';

export const dynamic = 'force-dynamic';

export async function GET() {
  const hasAccess = await hasProtectedAccess();
  const pages = getAccessiblePages(hasAccess);
  const scanned = await Promise.all(pages.map(getLLMText));

  return new Response(scanned.join('\n\n'));
}
