import { describe, expect, it } from "vitest";

import * as publicApi from "../src/index.js";

describe("public api", () => {
  it("exposes only the documented runtime entry points from the root export", () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      "defineTheme",
      "discordDarkTheme",
      "discordLightTheme",
      "renderToHtml",
      "renderToImage",
      "validateDocument",
    ]);
  });
});
