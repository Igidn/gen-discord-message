import { normalizeDocument, type NormalizedContentNode, type NormalizedDocument } from "../../normalize/index.js";
import type { DiscordMessageDocument } from "../../schema/types.js";

const ROOT_CLASS = "gdm-root";
const AVATAR_PLACEHOLDER_CLASS = "gdm-avatar-placeholder";

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
  const css = buildScopedCss(normalizedDocument);
  const fragment = renderHtmlFragment(normalizedDocument);

  return {
    html: options.includeDocumentWrapper ? renderHtmlDocument(fragment, css, options.nonce) : fragment,
    css,
    width: normalizedDocument.layout.width,
  };
}

function renderHtmlDocument(fragment: string, css: string, nonce: string | undefined): string {
  const nonceAttribute = nonce === undefined ? "" : ` nonce="${escapeHtmlAttribute(nonce)}"`;

  return [
    "<!doctype html>",
    '<html lang="en">',
    "<head>",
    '  <meta charset="utf-8">',
    '  <meta name="viewport" content="width=device-width, initial-scale=1">',
    `  <style${nonceAttribute}>${css}</style>`,
    "</head>",
    `<body class="gdm-document-body">${fragment}</body>`,
    "</html>",
  ].join("");
}

function renderHtmlFragment(document: NormalizedDocument): string {
  const background = document.layout.background;
  const styleParts = [
    `--gdm-layout-width:${document.layout.width}px`,
    `--gdm-layout-padding:${document.layout.padding}px`,
  ];

  if (background !== null) {
    styleParts.push(`--gdm-layout-background:${background}`);
  }

  for (const [name, value] of Object.entries(document.themeVariables)) {
    styleParts.push(`${name}:${value}`);
  }

  const messages = document.messages.map((message) => renderMessage(message)).join("");

  return `<div class="${ROOT_CLASS}" data-theme="${escapeHtmlAttribute(document.theme.name)}" style="${escapeHtmlAttribute(styleParts.join(";"))}"><div class="gdm-transcript">${messages}</div></div>`;
}

function renderMessage(message: NormalizedDocument["messages"][number]): string {
  const authorStyle =
    message.author.accentColor === null
      ? ""
      : ` style="color:${escapeHtmlAttribute(message.author.accentColor)}"`;
  const timestamp =
    message.timestamp === null
      ? ""
      : message.timestamp.iso.length > 0
        ? `<time class="gdm-timestamp" datetime="${escapeHtmlAttribute(message.timestamp.iso)}">${escapeHtmlText(message.timestamp.displayText)}</time>`
        : `<time class="gdm-timestamp">${escapeHtmlText(message.timestamp.displayText)}</time>`;
  const editedMarker = message.edited ? '<span class="gdm-edited" aria-label="edited">(edited)</span>' : "";
  const avatar = renderAvatar(message);
  const botBadge = message.author.bot ? '<span class="gdm-badge">BOT</span>' : "";
  const systemBadge = message.author.system ? '<span class="gdm-badge">SYSTEM</span>' : "";

  return `<article class="gdm-message"><div class="gdm-avatar-slot">${avatar}</div><div class="gdm-message-body"><header class="gdm-message-meta"><span class="gdm-author"${authorStyle}>${escapeHtmlText(message.author.name)}</span>${botBadge}${systemBadge}${timestamp}</header><div class="gdm-content">${renderContentNodes(message.content)}${editedMarker}</div></div></article>`;
}

function renderAvatar(message: NormalizedDocument["messages"][number]): string {
  const { avatar, name } = message.author;

  if (avatar.resolvedUrl !== null) {
    return `<img class="gdm-avatar" src="${escapeHtmlAttribute(avatar.resolvedUrl)}" alt="${escapeHtmlAttribute(`${name} avatar`)}" decoding="sync">`;
  }

  return `<span class="gdm-avatar ${AVATAR_PLACEHOLDER_CLASS}" aria-hidden="true">${escapeHtmlText(getAvatarInitials(name))}</span>`;
}

function renderContentNodes(nodes: NormalizedContentNode[]): string {
  return nodes.map((node) => renderContentNode(node)).join("");
}

function renderContentNode(node: NormalizedContentNode): string {
  switch (node.type) {
    case "text":
      return escapeHtmlText(node.value);
    case "mention":
      return `<span class="gdm-mention" style="--gdm-mention-node-background:${escapeHtmlAttribute(node.color)}">${escapeHtmlText(node.value)}</span>`;
    case "link":
      return `<a class="gdm-link" href="${escapeHtmlAttribute(node.href)}" rel="noreferrer noopener" target="_blank">${escapeHtmlText(node.label)}</a>`;
    case "inlineCode":
      return `<code class="gdm-inline-code">${escapeHtmlText(node.value)}</code>`;
    case "strong":
      return `<strong class="gdm-strong">${renderContentNodes(node.children)}</strong>`;
    case "emphasis":
      return `<em class="gdm-emphasis">${renderContentNodes(node.children)}</em>`;
    case "lineBreak":
      return "<br>";
  }
}

function buildScopedCss(document: NormalizedDocument): string {
  const transparentBackground = document.layout.background === null;

  return [
    `${ROOT_CLASS_SELECTOR()}{box-sizing:border-box;display:block;width:var(--gdm-layout-width);padding:var(--gdm-layout-padding);background:${transparentBackground ? "transparent" : "var(--gdm-layout-background)"};color:var(--gdm-color-text-primary);font-family:var(--gdm-font-family-base);font-size:var(--gdm-font-size-message);font-weight:var(--gdm-font-weight-regular);line-height:var(--gdm-line-height-message);text-rendering:optimizeLegibility;-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;}`,
    `${ROOT_CLASS_SELECTOR()} *,${ROOT_CLASS_SELECTOR()} *::before,${ROOT_CLASS_SELECTOR()} *::after{box-sizing:border-box;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-transcript{display:flex;flex-direction:column;gap:var(--gdm-spacing-message-gap);}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-message{display:grid;grid-template-columns:var(--gdm-size-avatar) minmax(0,1fr);column-gap:16px;align-items:start;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-avatar-slot{display:flex;align-items:flex-start;justify-content:center;padding-top:2px;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-avatar{display:block;width:var(--gdm-size-avatar);height:var(--gdm-size-avatar);border-radius:50%;object-fit:cover;background:rgba(255,255,255,0.08);}`,
    `${ROOT_CLASS_SELECTOR()} .${AVATAR_PLACEHOLDER_CLASS}{display:flex;align-items:center;justify-content:center;width:var(--gdm-size-avatar);height:var(--gdm-size-avatar);border-radius:50%;background:#eb459e;color:#ffffff;font-size:14px;font-weight:var(--gdm-font-weight-medium);letter-spacing:0.02em;text-transform:uppercase;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-message-body{min-width:0;padding-top:1px;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-message-meta{display:flex;align-items:baseline;gap:8px;min-width:0;margin:0 0 var(--gdm-spacing-content-gap);line-height:var(--gdm-line-height-message);}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-author{min-width:0;font-size:1rem;font-weight:var(--gdm-font-weight-medium);color:var(--gdm-color-text-primary);letter-spacing:0;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-badge{display:inline-flex;align-items:center;height:16px;padding:0 4px;border-radius:3px;background:#5865f2;color:#ffffff;font-size:0.625rem;font-weight:700;letter-spacing:0.02em;line-height:1;text-transform:uppercase;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-timestamp{color:var(--gdm-color-timestamp);font-size:0.75rem;font-weight:500;line-height:var(--gdm-line-height-message);white-space:nowrap;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-content{min-width:0;color:var(--gdm-color-text-primary);line-height:var(--gdm-line-height-message);word-break:break-word;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-content br{content:"";}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-mention{display:inline-block;padding:var(--gdm-spacing-inline-padding);border-radius:var(--gdm-radius-mention);background:var(--gdm-mention-node-background,var(--gdm-color-mention-background));color:var(--gdm-color-mention-text);font-weight:var(--gdm-font-weight-medium);text-decoration:none;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-link{color:var(--gdm-color-link);text-decoration:none;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-link:hover{text-decoration:underline;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-inline-code{padding:var(--gdm-spacing-inline-padding);border:1px solid var(--gdm-color-inline-code-border);border-radius:var(--gdm-radius-inline);background:var(--gdm-color-inline-code-background);color:var(--gdm-color-inline-code-text);font-family:Consolas,Monaco,"Andale Mono","Ubuntu Mono",monospace;font-size:0.875em;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-strong{font-weight:700;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-emphasis{font-style:italic;}`,
    `${ROOT_CLASS_SELECTOR()} .gdm-edited{margin-left:4px;color:var(--gdm-color-edited);font-size:0.75rem;white-space:nowrap;}`,
    `body.gdm-document-body{margin:0;background:${transparentBackground ? "transparent" : "var(--gdm-layout-background)"};color-scheme:${document.theme.name === "discordLight" ? "light" : "dark"};}`,
  ].join("");
}

function ROOT_CLASS_SELECTOR(): string {
  return `.${ROOT_CLASS}`;
}

function getAvatarInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/u)
    .filter((part) => part.length > 0);

  if (parts.length === 0) {
    return "?";
  }

  return parts
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
}

function escapeHtmlText(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function escapeHtmlAttribute(value: string): string {
  return escapeHtmlText(value).replaceAll('"', "&quot;");
}
