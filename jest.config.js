module.exports = {
  transform: {
    "^.+\\.(t|j)sx?$": "@swc/jest",
  },
  moduleNameMapper: {
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
  },
  transformIgnorePatterns: [
    "/node_modules/(?!nanoid/.*)",
  ],
};
