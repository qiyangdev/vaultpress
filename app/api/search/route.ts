import { getSiteLanguage } from '@/lib/locale';
import { source } from '@/lib/source';
import { createFromSource } from 'fumadocs-core/search/server';

export const { GET } = createFromSource(source, {
  // https://docs.orama.com/docs/orama-js/supported-languages
  language: getSiteLanguage().searchLanguage,
});
