import { chromium, type BrowserContext, type Page } from "playwright";

import { renderToHtml } from "../html/index.js";
import type { DiscordMessageDocument } from "../../schema/types.js";

const DEFAULT_IMAGE_FORMAT = "png";
const DEFAULT_IMAGE_SCALE = 1;
const DEFAULT_IMAGE_CLIP = "content";
const DEFAULT_ASSET_SETTLE_TIMEOUT_MS = 10_000;
const INITIAL_VIEWPORT_HEIGHT = 32;

interface ResolvedRenderImageOptions {
  format: "png" | "jpeg" | "webp";
  scale: number;
  background: string | null | undefined;
  clip: "content" | "viewport";
}

interface ClipBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
  const resolvedOptions = resolveRenderImageOptions(options);
  const renderedHtml = await renderToHtml(document);
  const browser = await chromium.launch({ headless: true });

  try {
    const context = await browser.newContext({
      deviceScaleFactor: resolvedOptions.scale,
      viewport: {
        width: ensurePixelSize(renderedHtml.width),
        height: INITIAL_VIEWPORT_HEIGHT,
      },
    });

    try {
      const page = await context.newPage();

      await page.setContent(buildImageDocument(renderedHtml.html, renderedHtml.css), {
        waitUntil: "load",
      });
      await applyBackgroundOverride(page, resolvedOptions.background);
      await waitForAssetsAndLayout(page, document.assets?.requestTimeoutMs ?? DEFAULT_ASSET_SETTLE_TIMEOUT_MS);

      const bounds = await measureContentBounds(page);

      await page.setViewportSize({
        width: ensurePixelSize(bounds.width),
        height: ensurePixelSize(bounds.height),
      });
      await waitForAnimationFrame(page);

      const data = await captureScreenshot(context, page, resolvedOptions, bounds);
      const size =
        resolvedOptions.clip === "content"
          ? { width: ensurePixelSize(bounds.width), height: ensurePixelSize(bounds.height) }
          : {
              width: ensurePixelSize(renderedHtml.width),
              height: ensurePixelSize(bounds.height),
            };

      return {
        data,
        format: resolvedOptions.format,
        width: size.width,
        height: size.height,
      };
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
}

function resolveRenderImageOptions(options: RenderImageOptions): ResolvedRenderImageOptions {
  const format = options.format ?? DEFAULT_IMAGE_FORMAT;

  if (format !== "png" && format !== "jpeg" && format !== "webp") {
    throw new TypeError(`Unsupported image format: ${String(format)}`);
  }

  const scale = options.scale ?? DEFAULT_IMAGE_SCALE;

  if (!Number.isFinite(scale) || scale <= 0) {
    throw new RangeError("renderToImage scale must be greater than 0.");
  }

  const clip = options.clip ?? DEFAULT_IMAGE_CLIP;

  if (clip !== "content" && clip !== "viewport") {
    throw new TypeError(`Unsupported clip mode: ${String(clip)}`);
  }

  return {
    format,
    scale,
    background: options.background,
    clip,
  };
}

function buildImageDocument(fragment: string, css: string): string {
  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <style>${css}</style>`,
    '  <style>html,body{margin:0;padding:0;}body{display:block;}#gdm-image-mount{display:inline-block;}</style>',
    "</head>",
    `<body><div id="gdm-image-mount">${fragment}</div></body>`,
    "</html>",
  ].join("");
}

async function applyBackgroundOverride(page: Page, background: string | null | undefined): Promise<void> {
  if (background === undefined) {
    return;
  }

  await page.evaluate(({ backgroundValue }) => {
    const root = document.querySelector("#gdm-image-mount > *");

    if (root instanceof HTMLElement) {
      root.style.setProperty("--gdm-layout-background", backgroundValue ?? "transparent");
    }

    document.body.style.background = backgroundValue ?? "transparent";
  }, { backgroundValue: background });
}

async function waitForAssetsAndLayout(page: Page, timeoutMs: number): Promise<void> {
  await page.evaluate(async ({ timeout }) => {
    const imagePromises = Array.from(document.images, (image) => {
      if (image.complete) {
        return Promise.resolve();
      }

      return new Promise<void>((resolve) => {
        const finish = (): void => {
          window.clearTimeout(timer);
          resolve();
        };

        const timer = window.setTimeout(finish, timeout);

        image.addEventListener("load", finish, { once: true });
        image.addEventListener("error", finish, { once: true });
      });
    });

    if ("fonts" in document) {
      await document.fonts.ready;
    }

    await Promise.all(imagePromises);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  }, { timeout: timeoutMs });
}

async function waitForAnimationFrame(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      }),
  );
}

async function measureContentBounds(page: Page): Promise<ClipBounds> {
  return page.evaluate(() => {
    const root = document.querySelector("#gdm-image-mount > *");

    if (!(root instanceof HTMLElement)) {
      throw new Error("Image render root was not found.");
    }

    const rect = root.getBoundingClientRect();

    return {
      x: Math.max(0, Math.floor(rect.left)),
      y: Math.max(0, Math.floor(rect.top)),
      width: Math.max(1, Math.ceil(rect.width)),
      height: Math.max(1, Math.ceil(rect.height)),
    };
  });
}

async function captureScreenshot(
  context: BrowserContext,
  page: Page,
  options: ResolvedRenderImageOptions,
  bounds: ClipBounds,
): Promise<Uint8Array> {
  if (options.format === "webp") {
    return captureWebpScreenshot(context, page, options, bounds);
  }

  const screenshotOptions: {
    type: "png" | "jpeg";
    clip?: ClipBounds;
    omitBackground: boolean;
  } = {
    type: options.format,
    omitBackground: options.background === null && options.format === "png",
  };

  if (options.clip === "content") {
    screenshotOptions.clip = bounds;
  }

  const buffer = await page.screenshot(screenshotOptions);

  return new Uint8Array(buffer);
}

async function captureWebpScreenshot(
  context: BrowserContext,
  page: Page,
  options: ResolvedRenderImageOptions,
  bounds: ClipBounds,
): Promise<Uint8Array> {
  const session = await context.newCDPSession(page);

  if (options.background === null) {
    await session.send("Emulation.setDefaultBackgroundColorOverride", {
      color: { r: 0, g: 0, b: 0, a: 0 },
    });
  }

  try {
    const screenshotOptions: {
      format: "webp";
      clip?: { x: number; y: number; width: number; height: number; scale: number };
      fromSurface: true;
      captureBeyondViewport: boolean;
    } = {
      format: "webp",
      fromSurface: true,
      captureBeyondViewport: options.clip === "content",
    };

    if (options.clip === "content") {
      screenshotOptions.clip = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
        scale: 1,
      };
    }

    const screenshot = await session.send("Page.captureScreenshot", screenshotOptions);

    return new Uint8Array(Buffer.from(screenshot.data, "base64"));
  } finally {
    if (options.background === null) {
      await session.send("Emulation.setDefaultBackgroundColorOverride");
    }
  }
}

function ensurePixelSize(value: number): number {
  return Math.max(1, Math.ceil(value));
}
