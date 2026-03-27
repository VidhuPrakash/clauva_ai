import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Disable the pages-directory rule since ESLint runs from the repo root.
  { rules: { '@next/next/no-html-link-for-pages': 'off' } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // shadcn/ui generated components
    '**/components/ui/**',
  ]),
])

export default eslintConfig
