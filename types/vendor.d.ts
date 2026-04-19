declare module "@fontsource-variable/inter";

// TypeScript 6 requires declarations for side-effect-only CSS imports.
// next/types/global.d.ts already declares "*.module.css" with typed exports,
// and TypeScript selects the longest-matching wildcard pattern, so that
// declaration takes precedence for any CSS Module file — this catch-all only
// applies to plain side-effect CSS imports like globals.css.
declare module "*.css";
