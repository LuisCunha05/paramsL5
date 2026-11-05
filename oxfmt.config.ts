import { defineConfig } from 'oxfmt';

export default defineConfig({
  arrowParens: 'always',
  bracketSpacing: true,
  endOfLine: 'lf',
  ignorePatterns: ['dist/**/*'],
  printWidth: 80,
  singleQuote: true,
  sortImports: true,
  sortPackageJson: true,
  tabWidth: 2,
  useTabs: false,
});
