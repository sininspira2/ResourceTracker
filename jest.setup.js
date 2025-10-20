import "@testing-library/jest-dom";

// Mock `next-auth/react`
jest.mock("next-auth/react", () => require("./lib/__mocks__/next-auth-react"));

// Mock `next/navigation`
jest.mock("next/navigation", () => require("./lib/__mocks__/next-navigation"));

// Mock global fetch and related classes
const fetch = require("node-fetch");
global.fetch = fetch;
global.Request = fetch.Request;
global.Response = fetch.Response;
global.Headers = fetch.Headers;

// Mock NextResponse
jest.mock("next/server", () => {
  const { Readable } = require("stream");
  return {
    NextResponse: {
      json: (body, init) => {
        const headers = init?.headers
          ? new Map(Object.entries(init.headers))
          : new Map();
        return {
          status: init?.status || 200,
          headers: headers,
          body: Readable.from(JSON.stringify(body)),
          json: () => Promise.resolve(body),
        };
      },
    },
  };
});
