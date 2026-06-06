import { GraphView } from "@/components/graph-view";
import { buildGraph } from "@/lib/build-graph";
import { hasProtectedAccess } from "@/lib/protected";

export async function GraphPageContent() {
  const hasAccess = await hasProtectedAccess();

  return <GraphView graph={buildGraph(hasAccess)} />;
}
