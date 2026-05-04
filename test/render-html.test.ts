import { describe, expect, it } from "vitest";

import { renderToHtml } from "../src/render/html/index.js";
import type { DiscordMessageDocument } from "../src/schema/types.js";

describe("renderToHtml", () => {
  it("renders deterministic scoped html for the phase 4 message layout", async () => {
    const document: DiscordMessageDocument = {
      theme: { preset: "discordDark" },
      layout: { width: 560, padding: 16 },
      messages: [
        {
          author: {
            name: "username",
            avatarUrl:
              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='20' fill='%23f38ba8'/%3E%3Ctext x='20' y='24' font-size='14' text-anchor='middle' fill='white'%3Eu%3C/text%3E%3C/svg%3E",
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
            { type: "text", value: " " },
            { type: "link", href: "https://example.com", label: "docs" },
            { type: "lineBreak" },
            { type: "text", value: "next line" },
          ],
        },
      ],
    };

    const first = await renderToHtml(document);
    const second = await renderToHtml(document);

    expect(first).toEqual(second);
    expect(first.width).toBe(560);
    expect(first.height).toBeUndefined();
    expect(first.html).toContain('<div class="gdm-root"');
    expect(first.html).toContain('<article class="gdm-message">');
    expect(first.html).toContain('datetime="2026-04-20T23:20:00.000Z"');
    expect(first.html).toContain(">4/20/2026 11:20 PM<");
    expect(first.html).toContain('<span class="gdm-author">username</span>');
    expect(first.html).toContain('<img class="gdm-avatar"');
    expect(first.html).toContain('<span class="gdm-mention"');
    expect(first.html).toContain('<strong class="gdm-strong">bold</strong>');
    expect(first.html).toContain('<em class="gdm-emphasis">italic</em>');
    expect(first.html).toContain(
      '<code class="gdm-inline-code">const x = 1</code>',
    );
    expect(first.html).toContain(
      '<a class="gdm-link" href="https://example.com"',
    );
    expect(first.html).toContain("<br>");
    expect(first.html).toContain(
      '<span class="gdm-edited" aria-label="edited">(edited)</span>',
    );
    expect(first.css).toContain(".gdm-root");
    expect(first.css).toContain(".gdm-message");
  });

  it("renders shorthand string content through the same semantic html path", async () => {
    const result = await renderToHtml({
      assets: { fetchRemoteAssets: false },
      messages: [
        {
          author: { name: "Eris" },
          content:
            "I'm thinking about **Markdown** syntax! <@{username}>\nCheck `renderToHtml` at https://example.com/docs.",
        },
      ],
    });

    expect(result.html).toContain(
      '<strong class="gdm-strong">Markdown</strong>',
    );
    expect(result.html).toContain('<span class="gdm-mention"');
    expect(result.html).toContain(">@username<");
    expect(result.html).toContain("<br>");
    expect(result.html).toContain(
      '<code class="gdm-inline-code">renderToHtml</code>',
    );
    expect(result.html).toContain(
      '<a class="gdm-link" href="https://example.com/docs" rel="noreferrer noopener" target="_blank">https://example.com/docs</a>.',
    );
  });

  it("returns a full html document with inline scoped css when requested", async () => {
    const result = await renderToHtml(
      {
        assets: { fetchRemoteAssets: false },
        messages: [
          {
            author: { name: "lopax" },
            content: [{ type: "text", value: "hello" }],
          },
        ],
      },
      {
        includeDocumentWrapper: true,
        nonce: "nonce-123",
      },
    );

    expect(result.html).toContain("<!doctype html>");
    expect(result.html).toContain('<html lang="en">');
    expect(result.html).toContain('<body class="gdm-document-body">');
    expect(result.html).toContain('<style nonce="nonce-123">');
    expect(result.html).toContain(result.css);
  });

  it("renders a deterministic avatar fallback placeholder and escapes user content", async () => {
    const result = await renderToHtml({
      assets: { avatarFallbackUrl: null },
      messages: [
        {
          author: {
            name: "Open Code",
          },
          content: [
            { type: "text", value: "<unsafe> & text" },
            { type: "text", value: " " },
            { type: "link", href: "https://example.com", label: 'docs " now' },
          ],
        },
      ],
    });

    expect(result.html).toContain('class="gdm-avatar gdm-avatar-placeholder"');
    expect(result.html).toContain(">OC<");
    expect(result.html).toContain("&lt;unsafe&gt; &amp; text");
    expect(result.html).toContain('>docs " now<');
  });

  it("supports null layout background without forcing a solid fill", async () => {
    const result = await renderToHtml({
      layout: { background: null },
      assets: { fetchRemoteAssets: false },
      messages: [
        {
          author: { name: "transparent" },
          content: [{ type: "text", value: "hello" }],
        },
      ],
    });

    expect(result.html).not.toContain("--gdm-layout-background:");
    expect(result.css).toContain("background:transparent");
  });

  it("rejects invalid html renderer options with readable errors", async () => {
    await expect(
      renderToHtml(
        {
          assets: { fetchRemoteAssets: false },
          messages: [
            {
              author: { name: "lopax" },
              content: [{ type: "text", value: "hello" }],
            },
          ],
        },
        {
          includeDocumentWrapper: "yes" as never,
        },
      ),
    ).rejects.toThrow(
      "renderToHtml includeDocumentWrapper must be a boolean when provided.",
    );
  });
});
