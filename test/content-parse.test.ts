import { describe, expect, it } from "vitest";

import { parseContent } from "../src/content/parse.js";

describe("parseContent", () => {
  it("parses mention tokens without braces", () => {
    expect(parseContent("Hello <@username>")).toEqual({
      ok: true,
      nodes: [
        { type: "text", value: "Hello " },
        { type: "mention", value: "@username" },
      ],
      issues: [],
    });
  });

  it("keeps accepting legacy braced mention tokens", () => {
    expect(parseContent("Hello <@{username}>")).toEqual({
      ok: true,
      nodes: [
        { type: "text", value: "Hello " },
        { type: "mention", value: "@username" },
      ],
      issues: [],
    });
  });
});
