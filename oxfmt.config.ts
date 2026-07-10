import { defineConfig } from "oxfmt";

export default defineConfig({
  printWidth: 80,
  arrowParens: "always",
  bracketSpacing: true,
  endOfLine: "crlf",
  sortImports: true,
  useTabs: false,
  tabWidth: 2,
  sortPackageJson: true,
  ignorePatterns: ["dist/**/*"],
});
