import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Use the native Node.js Request (available in Node 18+). The jsdom environment
// does not expose it as a global, so we pull it from globalThis explicitly.
// Defined with `let` so the jest.mock factory below can close over it.
let MockNextRequest;
const NativeRequest = globalThis.Request;
if (NativeRequest) {
  MockNextRequest = class extends NativeRequest {
    constructor(input, init) {
      super(input, init);
      const url = new URL(this.url);
      this.nextUrl = {
        origin: url.origin,
        searchParams: url.searchParams,
      };
    }
  };
  global.Request = MockNextRequest;
}

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
