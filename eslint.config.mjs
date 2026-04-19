import tseslint from "typescript-eslint";
import nextConfig from "eslint-config-next/core-web-vitals";

// eslint-config-next@16 bundles a compiled Babel parser for all JS/TS files.
// Its ScopeManager lacks addGlobals, which ESLint 10 requires. Replace it
// with the TypeScript parser (already used for .ts/.tsx by a later entry)
// and drop the Babel-specific parserOptions.
let babelParserReplaced = false;
const config = [
  ...nextConfig.map((entry) => {
    const name = entry.languageOptions?.parser?.meta?.name;
    if (name && /(?:eslint-config-next|next)\/parser/.test(name)) {
      babelParserReplaced = true;
      const {
        parser: _babelParser,
        parserOptions: _babelOpts,
        ...restLangOpts
      } = entry.languageOptions;
      return {
        ...entry,
        languageOptions: { ...restLangOpts, parser: tseslint.parser },
      };
    }
    return entry;
  }),
  {
    settings: {
      // eslint-plugin-react@7.x calls context.getFilename() which was removed
      // in ESLint 10. Pinning the version bypasses the auto-detection path.
      react: { version: "19.2" },
    },
    rules: {
      "@next/next/no-img-element": "off",
      // New rule in react-hooks@7 — existing patterns (data fetching, animation
      // state, mounted guards) are intentional and not actual bugs.
      "react-hooks/set-state-in-effect": "off",
    },
  },
];

if (!babelParserReplaced) {
  throw new Error(
    "eslint.config.mjs: expected to rewrite the bundled Babel/Next parser entry " +
      "from eslint-config-next, but none matched /(?:eslint-config-next|next)\\/parser/. " +
      "An eslint-config-next update may have changed the parser meta name — review the workaround.",
  );
}

export default config;
