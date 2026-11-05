import { defineConfig } from 'oxlint';

export default defineConfig({
  categories: {
    correctness: 'error',
    pedantic: 'warn',
    perf: 'warn',
    style: 'warn',
    suspicious: 'warn',
  },
  ignorePatterns: ['dist/**/*', '__test/**/*'],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  plugins: ['unicorn', 'typescript', 'oxc'],
  rules: {
    'arrow-body-style': ['warn', 'as-needed'],
    'eslint/no-unused-vars': 'error',
    'func-style': ['error', 'declaration'],
    'max-lines-per-function': 'off',
    'max-statements': 'off',
    'no-ternary': 'off',
    'no-unused-expressions': 'off',
    'no-unused-vars': 'warn',
    'no-use-before-define': 'off',
    'one-var': 'off',
    'typescript/ban-ts-comment': 'off',
    'typescript/explicit-function-return-type': 'off',
    'typescript/explicit-member-accessibility': 'off',
    'typescript/no-empty-interface': 'off',
    'typescript/no-explicit-any': 'warn',
    'typescript/restrict-template-expressions': 'off',
    'typescript/strict-boolean-expressions': 'off',
    'unicorn/explicit-length-check': 'off',
  },
});
