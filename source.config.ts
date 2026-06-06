import { defineConfig, defineDocs } from "fumadocs-mdx/config";
import { metaSchema, pageSchema } from "fumadocs-core/source/schema";
import { remarkMdxMermaid } from "fumadocs-core/mdx-plugins";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { remarkWikilinks } from "./lib/remark-wikilinks";
import { normalizeProtected } from "./lib/protected-field";
import { normalizeTags } from "./lib/tags";
import { z } from "zod";

export const docs = defineDocs({
  dir: "content",
  docs: {
    schema: pageSchema.extend({
      tags: z
        .union([z.string(), z.array(z.string())])
        .optional()
        .transform(normalizeTags),
      protected: z
        .union([z.boolean(), z.string()])
        .optional()
        .transform(normalizeProtected),
    }),
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
