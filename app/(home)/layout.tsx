import { source } from '@/lib/source';
import { DocsLayout } from 'fumadocs-ui/layouts/docs';
import { baseOptions } from '@/lib/layout.shared';
import { filterPageTree, hasProtectedAccess } from '@/lib/protected';

export default async function Layout({ children }: LayoutProps<'/'>) {
  const hasAccess = await hasProtectedAccess();

  return (
    <DocsLayout tree={filterPageTree(source.getPageTree(), hasAccess)} {...baseOptions()}>
      {children}
    </DocsLayout>
  );
}
