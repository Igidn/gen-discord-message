import type { DiscordMessageDocument } from "../../schema/types.js";
import { normalizeDocument } from "../../normalize/index.js";

export interface RenderImageOptions {
  format?: "png" | "jpeg" | "webp";
  scale?: number;
  background?: string | null;
  clip?: "content" | "viewport";
}

export interface RenderImageResult {
  data: Uint8Array;
  format: "png" | "jpeg" | "webp";
  width: number;
  height: number;
}

export async function renderToImage(
  document: DiscordMessageDocument,
  options: RenderImageOptions = {},
): Promise<RenderImageResult> {
  const normalizedDocument = await normalizeDocument(document);

  return {
    data: new Uint8Array(),
    format: options.format ?? "png",
    width: normalizedDocument.layout.width,
    height: 0,
  };
}
