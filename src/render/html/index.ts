import type { DiscordMessageDocument } from "../../schema/types.js";
import { normalizeDocument } from "../../normalize/index.js";

export interface RenderHtmlOptions {
  includeDocumentWrapper?: boolean;
  nonce?: string;
}

export interface RenderHtmlResult {
  html: string;
  css: string;
  width: number;
  height?: number;
}

export async function renderToHtml(
  document: DiscordMessageDocument,
  options: RenderHtmlOptions = {},
): Promise<RenderHtmlResult> {
  const normalizedDocument = await normalizeDocument(document);
  const content = options.includeDocumentWrapper
    ? "<!doctype html><html><body><div data-placeholder=\"true\"></div></body></html>"
    : '<div data-placeholder="true"></div>';

  return {
    html: content,
    css: ".discord-message-root { display: block; }",
    width: normalizedDocument.layout.width,
  };
}
