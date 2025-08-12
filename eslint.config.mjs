// eslint.config.mjs
import { defineConfig } from "eslint/config";
import js from "@eslint/js";
import globals from "globals";
import jsdoc from "eslint-plugin-jsdoc"; // JSDoc plugin

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],

    plugins: {
      js,
      jsdoc,
    },

    languageOptions: {
      globals: globals.node,
    },

    // Merge ESLint's recommended rules + jsdoc plugin recommended rules
    rules: {
      ...js.configs.recommended.rules,
      ...jsdoc.configs.recommended.rules,

      // ==== Your custom rules ====
      "no-console": ["error", { allow: ["error"] }], // allow console.error only
      "no-unused-vars": "error",
      semi: ["error", "always"],
      indent: ["error", 2],
      "max-len": "off",
      "no-trailing-spaces": "error",
      "object-curly-spacing": ["error", "always"],
      eqeqeq: ["error", "always"],
      "no-const-assign": "error",
      "comma-spacing": ["error", { before: false, after: true }],
      "no-multiple-empty-lines": ["error", { max: 1 }],

      // ==== Remove JSDoc rules ====
      "jsdoc/require-jsdoc": "off",
      "jsdoc/require-description": "off",
      "jsdoc/require-param": "off",
      "jsdoc/require-returns": "off",
      "jsdoc/check-tag-names": "off",
    },
  },
]);
