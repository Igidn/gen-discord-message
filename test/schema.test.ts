import { describe, expect, it } from "vitest";

import { validateDocument } from "../src/schema/validate.js";

describe("validateDocument", () => {
  it("accepts a valid phase 1 document", () => {
    const result = validateDocument({
      version: 1,
      theme: {
        name: "Custom Theme",
        extends: { preset: "discordDark" },
        tokens: {
          colorBackground: "#313338",
          colorLink: "rgb(0 168 252)",
          colorInlineCodeBorder: "#1e1f22",
          radiusMention: "6px",
          density: "comfortable",
        },
      },
      layout: {
        width: 560,
        padding: 16,
        background: null,
      },
      assets: {
        fetchRemoteAssets: true,
        avatarFallbackUrl: "https://example.com/fallback.png",
        requestTimeoutMs: 10_000,
      },
      messages: [
        {
          id: "message-1",
          author: {
            id: "user-1",
            name: "lopax",
            avatarUrl: "https://example.com/avatar.png",
            accentColor: "#57f287",
            bot: false,
            system: false,
          },
          timestamp: "2026-04-29T18:30:00Z",
          content: [
            { type: "text", value: "Ship it " },
            {
              type: "mention",
              value: "@team",
              color: "rgba(88, 101, 242, 0.3)",
            },
            { type: "text", value: " and check " },
            {
              type: "link",
              href: "https://example.com/docs",
              label: "the docs",
            },
            { type: "text", value: " with " },
            { type: "inlineCode", value: "renderToHtml" },
            {
              type: "strong",
              children: [
                { type: "text", value: " before " },
                {
                  type: "emphasis",
                  children: [{ type: "text", value: "release" }],
                },
              ],
            },
            { type: "lineBreak" },
            { type: "text", value: "done" },
          ],
          edited: true,
        },
      ],
    });

    expect(result).toEqual({ valid: true, issues: [] });
  });

  it("accepts shorthand string content", () => {
    const result = validateDocument({
      messages: [
        {
          author: { name: "Eris" },
          timestamp: "Today at 8:12 PM",
          content:
            "I\nuse **Markdown** and *mentions* with <@{username}> plus https://example.com/docs.",
        },
      ],
    });

    expect(result).toEqual({ valid: true, issues: [] });
  });

  it("rejects an empty message list", () => {
    const result = validateDocument({ messages: [] });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      {
        path: "messages",
        code: "empty_collection",
        message: "messages must contain at least one item.",
      },
    ]);
  });

  it("rejects invalid fields with stable issue paths", () => {
    const result = validateDocument({
      version: 2,
      theme: {
        preset: "discordBlue",
      },
      layout: {
        width: 0,
        background: "definitely-not-a-color$",
      },
      assets: {
        avatarFallbackUrl: "not-a-url",
      },
      messages: [
        {
          author: {
            name: "   ",
            accentColor: "#zzzzzz",
          },
          timestamp: "not-a-date",
          content: [
            { type: "link", href: "not-a-url" },
            { type: "emoji", value: ":wave:" },
          ],
          reactions: [{ emoji: ":wave:" }],
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      {
        path: "version",
        code: "invalid_literal",
        message: "version must be 1 when provided.",
      },
      {
        path: "theme.preset",
        code: "invalid_literal",
        message: 'theme.preset must be "discordDark" or "discordLight".',
      },
      {
        path: "layout.width",
        code: "invalid_literal",
        message: "layout width must be greater than 0.",
      },
      {
        path: "layout.background",
        code: "invalid_color",
        message: "layout background must be a valid color string.",
      },
      {
        path: "assets.avatarFallbackUrl",
        code: "invalid_url",
        message: "avatarFallbackUrl must be a valid URL.",
      },
      {
        path: "messages[0].author.name",
        code: "invalid_literal",
        message: "author name must not be empty.",
      },
      {
        path: "messages[0].author.accentColor",
        code: "invalid_color",
        message: "accentColor must be a valid color string.",
      },
      {
        path: "messages[0].content[0].href",
        code: "invalid_url",
        message: "link href must be a valid URL.",
      },
      {
        path: "messages[0].content[1].type",
        code: "unsupported_feature",
        message: "emoji nodes are not supported in v1.",
      },
      {
        path: "messages[0].reactions",
        code: "unsupported_feature",
        message: "reactions is not supported in v1.",
      },
    ]);
  });

  it("rejects unknown fields and missing required fields", () => {
    const result = validateDocument({
      extraTopLevel: true,
      messages: [
        {
          author: {},
          content: [{ type: "text", value: "hello", extra: true }],
          extraMessageField: true,
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      {
        path: "extraTopLevel",
        code: "unknown_field",
        message: "Unknown field: extraTopLevel.",
      },
      {
        path: "messages[0].extraMessageField",
        code: "unknown_field",
        message: "Unknown field: extraMessageField.",
      },
      {
        path: "messages[0].author.name",
        code: "missing_required_field",
        message: "author name is required.",
      },
      {
        path: "messages[0].content[0].extra",
        code: "unknown_field",
        message: "Unknown field: extra.",
      },
    ]);
  });

  it("rejects malformed shorthand string content with stable issue paths", () => {
    const result = validateDocument({
      messages: [
        {
          author: { name: "Eris" },
          content: "",
        },
        {
          author: { name: "Nyx" },
          content: "Say hi to <@{}>",
        },
      ],
    });

    expect(result.valid).toBe(false);
    expect(result.issues).toEqual([
      {
        path: "messages[0].content",
        code: "invalid_content_syntax",
        message: "content string must not be empty.",
      },
      {
        path: "messages[1].content",
        code: "invalid_content_syntax",
        message: "Mention token must contain a non-empty name at character 11.",
      },
    ]);
  });
});
