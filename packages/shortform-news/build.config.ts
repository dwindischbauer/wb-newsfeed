import { defineBuildConfig } from 'unbuild';

export default defineBuildConfig({
  entries: [
    {
      builder: 'mkdist',
      input: 'src/',
      outDir: 'dist/',
      pattern: ['**/*.ts', '**/*.vue', '!**/*.test.ts', '!components/NewComponent.vue']
    }
  ],
  declaration: true,
  clean: true,
  externals: ['vue', '@nuxt/kit', '@nuxt/schema']
});
