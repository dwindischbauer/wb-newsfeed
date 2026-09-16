import { defineNuxtModule, addComponent, createResolver } from '@nuxt/kit';
import type { NuxtModule } from '@nuxt/schema';

// Empty for now — reserved for future module options (e.g. component prefix).
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ModuleOptions {}

/**
 * Nuxt module entry point — lets an external Nuxt project add
 * `modules: ['@wb-news/shortform-news/nuxt']` to auto-register <ShortformCard>
 * and <ShortformFeed> as global components, without any manual import.
 * The monorepo's own admin/feed apps don't use this — they import the
 * components/utils directly from the package's main entry instead.
 */
const shortformNewsModule: NuxtModule<ModuleOptions> = defineNuxtModule<ModuleOptions>({
  meta: {
    name: '@wb-news/shortform-news',
    configKey: 'shortformNews'
  },
  defaults: {},
  setup() {
    const resolver = createResolver(import.meta.url);

    addComponent({
      name: 'ShortformCard',
      filePath: resolver.resolve('./components/ShortformCard.vue')
    });

    addComponent({
      name: 'ShortformFeed',
      filePath: resolver.resolve('./components/ShortformFeed.vue')
    });
  }
});

export default shortformNewsModule;
