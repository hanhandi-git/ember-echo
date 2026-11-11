import js from "@eslint/js";
import globals from "globals";

const unused = [
  "error",
  {
    argsIgnorePattern: "^_",
    caughtErrorsIgnorePattern: "^_",
    varsIgnorePattern: "^_",
  },
];

export default [
  {
    ignores: [
      "game.js",
      "battle-map-worker.js",
      "chunks/**",
      "node_modules/**",
      "coverage/**",
      "**/*.tmpdir/**",
      "src/game/systems/.loop.js.*.tmpdir/**",
    ],
  },
  js.configs.recommended,
  {
    files: ["src/**/*.js"],
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: "module",
      globals: {
        ...globals.browser,
        self: "readonly",
      },
    },
    rules: {
      "no-unused-vars": unused,
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
  {
    files: [
      "tests/**/*.js",
      "scripts/**/*.mjs",
      "*.mjs",
      "build.mjs",
      "server.mjs",
      "eslint.config.js",
    ],
    languageOptions: {
      ecmaVersion: 2025,
      sourceType: "module",
      globals: {
        ...globals.node,
        self: "readonly",
      },
    },
    rules: {
      "no-unused-vars": unused,
      "no-empty": ["error", { allowEmptyCatch: true }],
    },
  },
];
