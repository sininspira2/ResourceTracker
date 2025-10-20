import "@testing-library/jest-dom";

// Mock global fetch and related classes
const fetch = require("node-fetch");
global.fetch = fetch;
global.Request = fetch.Request;
global.Response = fetch.Response;
global.Headers = fetch.Headers;

// Mock NextResponse
jest.mock("next/server", () => {
  const { Readable } = require("stream");

  const mockNextResponse = function (body, init) {
    const headers = init?.headers
      ? new Map(Object.entries(init.headers))
      : new Map();
    return {
      status: init?.status || 200,
      headers: headers,
      body: Readable.from(JSON.stringify(body)),
      json: () => Promise.resolve(body),
    };
  };

  mockNextResponse.json = (body, init) => {
    const headers = init?.headers
      ? new Map(Object.entries(init.headers))
      : new Map();
    return {
      status: init?.status || 200,
      headers: headers,
      body: Readable.from(JSON.stringify(body)),
      json: () => Promise.resolve(body),
    };
  };

  return {
    NextResponse: mockNextResponse,
  };
});
