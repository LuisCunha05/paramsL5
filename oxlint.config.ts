import { defineConfig } from "oxlint";

export default defineConfig({
  plugins: ["unicorn", "typescript", "oxc"],
  options: {
    typeAware: true,
    typeCheck: true,
  },
  categories: {
    perf: "warn",
    suspicious: "warn",
    correctness: "error",
    style: "warn",
    pedantic: "warn",
  },
  rules: {
    "eslint/no-unused-vars": "error",
    "typescript/strict-boolean-expressions": "off",
    "unicorn/explicit-length-check": "off",
    "eslint/curly": "allow",
    "typescript/restrict-template-expressions": "warn",
  },
  ignorePatterns: ["dist/**/*", "__test/**/*"],
});
