import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import jsxA11y from 'eslint-plugin-jsx-a11y'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  // .browser-test-build holds the browser runner's builds and Vite dependency cache.
  globalIgnores(['dist', '.browser-test-build']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
  },
  {
    // console.log stays in production bundles and can expose orders or keys in the visitor's console.
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Accessibility rules for JSX: labels, names, roles and keyboard use. Fixes for existing code are in the same PR.
    files: ['src/**/*.tsx'],
    plugins: { 'jsx-a11y': jsxA11y },
    rules: {
      ...jsxA11y.flatConfigs.recommended.rules,
      // CustomSelect renders a <button>, which a wrapping <label> names. The upload labels wrap their file input three levels down.
      'jsx-a11y/label-has-associated-control': ['error', { controlComponents: ['CustomSelect'], depth: 3 }],
      // Safari drops list semantics from lists styled with list-style: none, so role="list" is kept on purpose.
      'jsx-a11y/no-redundant-roles': ['error', { ul: ['list'], ol: ['list'] }],
      // A scrollable region needs focus so keyboard users can scroll it.
      'jsx-a11y/no-noninteractive-tabindex': ['error', { tags: [], roles: ['tabpanel', 'region'] }],
    },
  },
])
