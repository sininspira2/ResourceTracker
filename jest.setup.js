import "@testing-library/jest-dom";

// Mock global fetch and related classes
const fetch = require("node-fetch");
global.fetch = fetch;
global.Response = fetch.Response;
global.Headers = fetch.Headers;

// A more complete NextRequest mock
const { Request } = fetch;
class MockNextRequest extends Request {
  constructor(input, init) {
    super(input, init);
    const url = new URL(this.url);
    this.nextUrl = {
      origin: url.origin,
      searchParams: url.searchParams,
    };
  }
}
global.Request = MockNextRequest;

// Mock NextResponse
jest.mock("next/server", () => {
  const { Readable } = require("stream");

  const mockNextResponse = function (body, init) {
    return {
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
      body: Readable.from(JSON.stringify(body)),
      json: () => Promise.resolve(JSON.parse(body)),
    };
  };

  mockNextResponse.json = (body, init) => {
    return {
      status: init?.status || 200,
      headers: new Map(Object.entries(init?.headers || {})),
      body: Readable.from(JSON.stringify(body)),
      json: () => Promise.resolve(body),
    };
  };

  return {
    NextResponse: mockNextResponse,
    NextRequest: MockNextRequest,
  };
});
