import { source } from '@/lib/source';
import type { Graph } from '../components/graph-view';

import { pageRequiresAuth } from '@/lib/protected';

export function buildGraph(hasAccess = false): Graph {
  const pages = source.getPages().filter(
    (page) => hasAccess || !pageRequiresAuth(page),
  );
  const graph: Graph = { links: [], nodes: [] };

  for (const page of pages) {
    graph.nodes.push({
      id: page.url,
      url: page.url,
      text: page.data.title,
      description: page.data.description,
    });

    const { extractedReferences = [] } = page.data;
    for (const ref of extractedReferences) {
      const refPage = source.getPageByHref(ref.href);
      if (!refPage) continue;
      if (!hasAccess && pageRequiresAuth(refPage.page)) continue;

      graph.links.push({
        source: page.url,
        target: refPage.page.url,
      });
    }
  }

  return graph;
}
