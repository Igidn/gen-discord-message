import { describe, expect, it } from "vitest";

import { renderToImage } from "../src/render/image/index.js";
import type { DiscordMessageDocument } from "../src/schema/types.js";

const SVG_AVATAR_DATA_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='20' fill='%235865f2'/%3E%3C/svg%3E";

describe("renderToImage", () => {
  it("renders deterministic png output from the canonical html path", async () => {
    const document: DiscordMessageDocument = {
      layout: { width: 560, padding: 16 },
      messages: [
        {
          author: {
            name: "username",
            avatarUrl: SVG_AVATAR_DATA_URL,
          },
          timestamp: "2026-04-20T23:20:00Z",
          edited: true,
          content: [
            { type: "text", value: "test " },
            { type: "mention", value: "@team" },
            { type: "text", value: " " },
            { type: "strong", children: [{ type: "text", value: "bold" }] },
            { type: "text", value: " " },
            { type: "emphasis", children: [{ type: "text", value: "italic" }] },
            { type: "text", value: " " },
            { type: "inlineCode", value: "const x = 1" },
            { type: "lineBreak" },
            { type: "link", href: "https://example.com", label: "docs" },
          ],
        },
      ],
    };

    const first = await renderToImage(document);
    const second = await renderToImage(document);

    expect(first).toEqual(second);
    expect(first.format).toBe("png");
    expect(first.width).toBe(560);
    expect(first.height).toBeGreaterThan(0);
    expect(first.data).toBeInstanceOf(Uint8Array);
    expect(first.data[0]).toBe(0x89);
    expect(first.data[1]).toBe(0x50);
    expect(first.data[2]).toBe(0x4e);
    expect(first.data[3]).toBe(0x47);
  });

  it("renders shorthand string content to images through the canonical html path", async () => {
    const result = await renderToImage({
      assets: { avatarFallbackUrl: null },
      messages: [
        {
          author: { name: "Eris" },
          content:
            "Hybrid **content** <@{username}> with https://example.com/docs",
        },
      ],
    });

    expect(result.format).toBe("png");
    expect(result.width).toBe(550);
    expect(result.height).toBeGreaterThan(0);
    expect(result.data[0]).toBe(0x89);
    expect(result.data[1]).toBe(0x50);
    expect(result.data[2]).toBe(0x4e);
    expect(result.data[3]).toBe(0x47);
  });

  it("supports jpeg output and viewport clipping", async () => {
    const result = await renderToImage(
      {
        layout: { width: 420, padding: 20 },
        assets: { avatarFallbackUrl: null },
        messages: [
          {
            author: { name: "lopax" },
            content: [{ type: "text", value: "viewport capture" }],
          },
        ],
      },
      {
        format: "jpeg",
        clip: "viewport",
      },
    );

    expect(result.format).toBe("jpeg");
    expect(result.width).toBe(420);
    expect(result.height).toBeGreaterThan(0);
    expect(result.data[0]).toBe(0xff);
    expect(result.data[1]).toBe(0xd8);
    expect(result.data[2]).toBe(0xff);
  });

  it("supports transparent png output for null backgrounds", async () => {
    const result = await renderToImage(
      {
        layout: { width: 400, padding: 12, background: null },
        assets: { avatarFallbackUrl: null },
        messages: [
          {
            author: { name: "transparent" },
            content: [{ type: "text", value: "alpha" }],
          },
        ],
      },
      {
        background: null,
      },
    );

    expect(result.format).toBe("png");
    expect(result.data[0]).toBe(0x89);
    expect(result.data[1]).toBe(0x50);
    expect(result.data[2]).toBe(0x4e);
    expect(result.data[3]).toBe(0x47);
  });

  it("rejects invalid scale values", async () => {
    await expect(
      renderToImage(
        {
          assets: { avatarFallbackUrl: null },
          messages: [
            {
              author: { name: "lopax" },
              content: [{ type: "text", value: "hello" }],
            },
          ],
        },
        { scale: 0 },
      ),
    ).rejects.toThrow("renderToImage scale must be greater than 0.");
  });

  it("rejects invalid image renderer options with readable errors", async () => {
    await expect(
      renderToImage(
        {
          assets: { avatarFallbackUrl: null },
          messages: [
            {
              author: { name: "lopax" },
              content: [{ type: "text", value: "hello" }],
            },
          ],
        },
        { format: "gif" as never },
      ),
    ).rejects.toThrow('renderToImage format must be "png", "jpeg", or "webp".');
  });
});
