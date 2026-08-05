import { getSiteLanguage } from '@/lib/locale';
import { hasProtectedAccess } from '@/lib/protected';
import { getAuthorizedSearchUrl } from '@/lib/search-access';
import { source } from '@/lib/source';
import type { StructuredData } from 'fumadocs-core/mdx-plugins/remark-structure';
import { createFromSource } from 'fumadocs-core/search/server';

const server = createFromSource(source, {
  language: getSiteLanguage().searchLanguage,
  buildIndex: async (page) => {
    const data = page.data as {
      title?: string;
      description?: string;
      structuredData?: unknown;
      protected?: boolean;
      load?: () => Promise<{ structuredData?: unknown }>;
    };

    let structuredData = data.structuredData;
    if (!structuredData && typeof data.load === 'function') {
      structuredData = (await data.load()).structuredData;
    }

    if (!structuredData) {
      throw new Error(`Cannot index page: ${page.url}`);
    }

    return {
      title: data.title ?? page.url,
      description: data.description,
      url: page.url,
      id: page.url,
      structuredData: structuredData as StructuredData,
      tag: data.protected ? 'protected' : 'public',
    };
  },
});

export async function GET(request: Request) {
  const hasAccess = await hasProtectedAccess();
  const url = getAuthorizedSearchUrl(request.url, hasAccess);

  return server.GET(new Request(url, request));
}
