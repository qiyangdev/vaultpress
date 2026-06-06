import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { remarkMdxMermaid } from "fumadocs-core/mdx-plugins";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { remarkWikilinks } from "./lib/remark-wikilinks";

export const docs = defineDocs({
  dir: "content",
  docs: {
    schema: pageSchema,
    postprocess: {
      includeProcessedMarkdown: true,
      extractLinkReferences: true,
    },
  },
  meta: {
    schema: metaSchema,
  },
});

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [remarkWikilinks, remarkMdxMermaid, remarkMath],
    rehypePlugins: (v) => [rehypeKatex, ...v],
  },
});
