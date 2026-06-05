import js from "@eslint/js";
import tsParser from "@typescript-eslint/parser";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  js.configs.recommended,
  {
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        window: "readonly",
        document: "readonly",
        sessionStorage: "readonly",
        console: "readonly",
        Buffer: "readonly",
        process: "readonly",
        setTimeout: "readonly",
        URLSearchParams: "readonly",
        atob: "readonly",
        alert: "readonly",
        fetch: "readonly",
        performance: "readonly",
        Promise: "readonly",
        HTMLDivElement: "readonly",
        HTMLInputElement: "readonly",
        React: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      "react": reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactHooksPlugin.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
      "no-undef": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-unused-vars": ["warn", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
  {
    ignores: ["dist/", "node_modules/", "api/", "src/components/ui/"],
  }
];
