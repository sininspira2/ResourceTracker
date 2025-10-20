/** @type {import('jest').Config} */
const config = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/components/(.*)$": "<rootDir>/app/components/$1",
    "^@/lib/(.*)$": "<rootDir>/lib/$1",
  },
  transform: {
    "^.+\\.(t|j)sx?$": ["@swc/jest", {
      jsc: {
        transform: {
          react: {
            runtime: "automatic",
          },
        },
      },
    }],
  },
  transformIgnorePatterns: [
    "/node_modules/(?!nanoid/.*|node-fetch/.*|data-uri-to-buffer/.*|fetch-blob/.*|formdata-polyfill/.*)",
  ],
};

module.exports = config;