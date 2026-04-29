import { describe, expect, it, vi } from "vitest";

import { normalizeDocument, NormalizationError } from "../src/normalize/index.js";
import type { DiscordMessageDocument } from "../src/schema/types.js";
import { discordDarkTheme } from "../src/theme/index.js";

describe("normalizeDocument", () => {
  it("applies defaults and produces deterministic normalized output", async () => {
    const document: DiscordMessageDocument = {
      messages: [
        {
          author: {
            name: "lopax",
          },
          timestamp: "2026-04-29T18:30:00Z",
          content: [
            { type: "mention", value: "@team" },
            { type: "text", value: " check " },
            { type: "link", href: "https://example.com/docs" },
            {
              type: "strong",
              children: [
                {
                  type: "emphasis",
                  children: [{ type: "inlineCode", value: "renderToHtml" }],
                },
              ],
            },
            { type: "lineBreak" },
            { type: "text", value: "done" },
          ],
        },
      ],
    };

    const first = await normalizeDocument(document);
    const second = await normalizeDocument(document);

    expect(first).toEqual(second);
    expect(first).toEqual({
      version: 1,
      theme: discordDarkTheme,
      layout: {
        width: 550,
        padding: 16,
        background: discordDarkTheme.tokens.colorBackground,
      },
      assets: {
        fetchRemoteAssets: true,
        avatarFallbackUrl: null,
        requestTimeoutMs: 10_000,
      },
      messages: [
        {
          id: null,
          author: {
            id: null,
            name: "lopax",
            avatar: {
              kind: "avatar",
              sourceUrl: null,
              fallbackUrl: null,
              resolvedUrl: null,
              mediaType: null,
              status: "missing",
              errorCode: null,
            },
            accentColor: null,
            bot: false,
            system: false,
          },
          timestamp: {
            iso: "2026-04-29T18:30:00.000Z",
            epochMs: Date.parse("2026-04-29T18:30:00Z"),
            dateText: "2026-04-29",
            timeText: "18:30",
            displayText: "2026-04-29 18:30 UTC",
          },
          content: [
            {
              type: "mention",
              value: "@team",
              color: discordDarkTheme.tokens.colorMentionBackground,
            },
            { type: "text", value: " check " },
            {
              type: "link",
              href: "https://example.com/docs",
              label: "https://example.com/docs",
            },
            {
              type: "strong",
              children: [
                {
                  type: "emphasis",
                  children: [{ type: "inlineCode", value: "renderToHtml" }],
                },
              ],
            },
            { type: "lineBreak" },
            { type: "text", value: "done" },
          ],
          edited: false,
        },
      ],
    });
  });

  it("resolves theme overrides and falls back to the avatar fallback asset", async () => {
    const fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = input instanceof URL ? input.toString() : input.toString();

      if (url.endsWith("/avatar.png")) {
        return new Response("missing", { status: 404 });
      }

      return new Response("fallback-image", {
        status: 200,
        headers: {
          "content-type": "image/png",
        },
      });
    });

    const normalized = await normalizeDocument(
      {
        theme: {
          name: "Custom Light",
          extends: { preset: "discordLight" },
          tokens: {
            colorMentionBackground: "#123456",
          },
        },
        layout: {
          width: 560,
          padding: 24,
          background: null,
        },
        assets: {
          fetchRemoteAssets: true,
          avatarFallbackUrl: "https://example.com/fallback.png",
          requestTimeoutMs: 1234,
        },
        messages: [
          {
            author: {
              name: "bot",
              avatarUrl: "https://example.com/avatar.png",
              bot: true,
            },
            content: [{ type: "mention", value: "@here" }],
          },
        ],
      },
      { fetch },
    );

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(normalized.theme.name).toBe("Custom Light");
    expect(normalized.layout).toEqual({
      width: 560,
      padding: 24,
      background: null,
    });
    expect(normalized.assets).toEqual({
      fetchRemoteAssets: true,
      avatarFallbackUrl: "https://example.com/fallback.png",
      requestTimeoutMs: 1234,
    });
    expect(normalized.messages[0]?.author).toMatchObject({
      name: "bot",
      bot: true,
      avatar: {
        kind: "avatar",
        sourceUrl: "https://example.com/avatar.png",
        fallbackUrl: "https://example.com/fallback.png",
        status: "ready",
        mediaType: "image/png",
        errorCode: null,
      },
    });
    expect(normalized.messages[0]?.author.avatar.resolvedUrl).toMatch(/^data:image\/png;base64,/u);
    expect(normalized.messages[0]?.content[0]).toEqual({
      type: "mention",
      value: "@here",
      color: "#123456",
    });
  });

  it("skips remote asset fetching when disabled", async () => {
    const fetch = vi.fn();

    const normalized = await normalizeDocument(
      {
        assets: {
          fetchRemoteAssets: false,
        },
        messages: [
          {
            author: {
              name: "lopax",
              avatarUrl: "https://example.com/avatar.png",
            },
            content: [{ type: "text", value: "hello" }],
          },
        ],
      },
      { fetch },
    );

    expect(fetch).not.toHaveBeenCalled();
    expect(normalized.messages[0]?.author.avatar).toEqual({
      kind: "avatar",
      sourceUrl: "https://example.com/avatar.png",
      fallbackUrl: null,
      resolvedUrl: "https://example.com/avatar.png",
      mediaType: null,
      status: "skipped",
      errorCode: null,
    });
  });

  it("throws structured validation issues for invalid documents", async () => {
    await expect(normalizeDocument({ messages: [] })).rejects.toBeInstanceOf(NormalizationError);
    await expect(normalizeDocument({ messages: [] })).rejects.toMatchObject({
      issues: [
        {
          path: "messages",
          code: "empty_collection",
          message: "messages must contain at least one item.",
        },
      ],
    });
  });
});
