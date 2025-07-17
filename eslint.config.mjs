export default [
  {
    files: ["**/*.ts", "**/*.tsx"],
    ignores: [
      "dist/**",
      "node_modules/**",
      "**/*.d.ts",
      "jest.config.ts"
    ],
    plugins: {
      "@typescript-eslint": (await import("@typescript-eslint/eslint-plugin")).default
    },
    languageOptions: {
      parser: (await import("@typescript-eslint/parser")).default,
      parserOptions: {
        sourceType: "module"
      },
    },
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/explicit-module-boundary-types": "off",
    },
    settings: {
    },
  },
];