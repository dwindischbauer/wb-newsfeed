// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs';

export default withNuxt(
  {
    rules: {
      // Prettier-style formatting rules — the codebase wasn't authored to
      // these markup conventions, so enabling them is pure churn with no
      // functional benefit. Keep the bug-catching Vue rules enabled.
      'vue/html-self-closing': 'off',
      'vue/attributes-order': 'off',
      'vue/attribute-hyphenation': 'off',
      'vue/multi-word-component-names': 'off'
    }
  }
);
