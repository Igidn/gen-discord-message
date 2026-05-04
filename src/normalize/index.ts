import {
  resolveAssetReference,
  type AssetResolverFetch,
  type AssetResolverOptions,
  type AssetResolutionErrorCode,
  type AssetResolutionStatus,
  type ResolvedAssetReference,
} from "../assets/index.js";
import { parseContent } from "../content/parse.js";
import { validateDocument, type ValidationIssue } from "../schema/validate.js";
import type {
  AssetOptions,
  ContentNode,
  DiscordAuthor,
  DiscordMessage,
  DiscordMessageDocument,
  MessageContentInput,
  ThemeDefinition,
  ThemeReference,
} from "../schema/types.js";
import {
  defineTheme,
  resolveThemeCssVariables,
  resolveThemeReference,
  type ThemeCssVariables,
} from "../theme/index.js";

const DEFAULT_VERSION = 1;
const DEFAULT_LAYOUT_WIDTH = 550;
const DEFAULT_LAYOUT_PADDING = 16;
const DEFAULT_FETCH_REMOTE_ASSETS = true;
const DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
const DISCORD_LOGO_FALLBACK_URL =
  "https://discord.com/assets/18e336a74a159cfd.png";

export interface NormalizeDocumentOptions {
  fetch?: AssetResolverFetch;
}

export interface NormalizedAssetOptions {
  fetchRemoteAssets: boolean;
  avatarFallbackUrl: string | null;
  requestTimeoutMs: number;
}

export interface NormalizedLayout {
  width: number;
  padding: number;
  background: string | null;
}

export interface NormalizedTimestamp {
  iso: string;
  epochMs: number;
  dateText: string;
  timeText: string;
  displayText: string;
}

export interface NormalizedTextNode {
  type: "text";
  value: string;
}

export interface NormalizedMentionNode {
  type: "mention";
  value: string;
  color: string;
}

export interface NormalizedLinkNode {
  type: "link";
  href: string;
  label: string;
}

export interface NormalizedInlineCodeNode {
  type: "inlineCode";
  value: string;
}

export interface NormalizedStrongNode {
  type: "strong";
  children: NormalizedContentNode[];
}

export interface NormalizedEmphasisNode {
  type: "emphasis";
  children: NormalizedContentNode[];
}

export interface NormalizedLineBreakNode {
  type: "lineBreak";
}

export type NormalizedContentNode =
  | NormalizedTextNode
  | NormalizedMentionNode
  | NormalizedLinkNode
  | NormalizedInlineCodeNode
  | NormalizedStrongNode
  | NormalizedEmphasisNode
  | NormalizedLineBreakNode;

export interface NormalizedAuthor {
  id: string | null;
  name: string;
  avatar: ResolvedAssetReference;
  accentColor: string | null;
  bot: boolean;
  system: boolean;
}

export interface NormalizedMessage {
  id: string | null;
  author: NormalizedAuthor;
  timestamp: NormalizedTimestamp | null;
  content: NormalizedContentNode[];
  edited: boolean;
}

export interface NormalizedDocument {
  version: 1;
  theme: ThemeDefinition;
  themeVariables: ThemeCssVariables;
  layout: NormalizedLayout;
  assets: NormalizedAssetOptions;
  messages: NormalizedMessage[];
}

export class NormalizationError extends Error {
  readonly issues: ValidationIssue[];

  constructor(issues: ValidationIssue[]) {
    super(
      `Document normalization failed with ${issues.length} validation issue(s).`,
    );
    this.name = "NormalizationError";
    this.issues = issues;
  }
}

export async function normalizeDocument(
  input: DiscordMessageDocument,
  options: NormalizeDocumentOptions = {},
): Promise<NormalizedDocument> {
  const validation = validateDocument(input);

  if (!validation.valid) {
    throw new NormalizationError(validation.issues);
  }

  const theme = normalizeTheme(input.theme);
  const assets = normalizeAssetOptions(input.assets);
  const layout = normalizeLayout(input.layout, theme);
  const fetchImplementation = options.fetch ?? globalThis.fetch;
  const messages = await Promise.all(
    input.messages.map((message) =>
      normalizeMessage(message, theme, assets, fetchImplementation),
    ),
  );

  return {
    version: DEFAULT_VERSION,
    theme,
    themeVariables: resolveThemeCssVariables(theme),
    layout,
    assets,
    messages,
  };
}

function normalizeTheme(
  input: DiscordMessageDocument["theme"] | undefined,
): ThemeDefinition {
  if (input === undefined) {
    return resolveThemeReference({ preset: "discordDark" });
  }

  if (isThemeReference(input)) {
    return resolveThemeReference(input);
  }

  return defineTheme(input);
}

function normalizeAssetOptions(
  input: AssetOptions | undefined,
): NormalizedAssetOptions {
  return {
    fetchRemoteAssets: input?.fetchRemoteAssets ?? DEFAULT_FETCH_REMOTE_ASSETS,
    avatarFallbackUrl:
      input?.avatarFallbackUrl === undefined
        ? DISCORD_LOGO_FALLBACK_URL
        : input.avatarFallbackUrl,
    requestTimeoutMs: input?.requestTimeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS,
  };
}

function normalizeLayout(
  input: DiscordMessageDocument["layout"] | undefined,
  theme: ThemeDefinition,
): NormalizedLayout {
  return {
    width: input?.width ?? DEFAULT_LAYOUT_WIDTH,
    padding: input?.padding ?? DEFAULT_LAYOUT_PADDING,
    background:
      input?.background === undefined
        ? theme.tokens.colorBackground
        : input.background,
  };
}

async function normalizeMessage(
  input: DiscordMessage,
  theme: ThemeDefinition,
  assets: NormalizedAssetOptions,
  fetchImplementation: AssetResolverFetch | undefined,
): Promise<NormalizedMessage> {
  return {
    id: input.id ?? null,
    author: await normalizeAuthor(input.author, assets, fetchImplementation),
    timestamp: normalizeTimestamp(input.timestamp),
    content: normalizeMessageContent(input.content, theme),
    edited: input.edited ?? false,
  };
}

async function normalizeAuthor(
  input: DiscordAuthor,
  assets: NormalizedAssetOptions,
  fetchImplementation: AssetResolverFetch | undefined,
): Promise<NormalizedAuthor> {
  const avatarOptions: AssetResolverOptions = {
    kind: "avatar",
    sourceUrl: input.avatarUrl ?? null,
    fallbackUrl: assets.avatarFallbackUrl,
    fetchRemoteAssets: assets.fetchRemoteAssets,
    requestTimeoutMs: assets.requestTimeoutMs,
  };

  if (fetchImplementation !== undefined) {
    avatarOptions.fetch = fetchImplementation;
  }

  return {
    id: input.id ?? null,
    name: input.name,
    avatar: await resolveAssetReference(avatarOptions),
    accentColor: input.accentColor ?? null,
    bot: input.bot ?? false,
    system: input.system ?? false,
  };
}

function normalizeTimestamp(
  input: DiscordMessage["timestamp"],
): NormalizedTimestamp | null {
  if (input === undefined) {
    return null;
  }

  if (input instanceof Date) {
    return formatNormalizedTimestamp(input);
  }

  const parsedDate = new Date(input);

  if (Number.isNaN(parsedDate.getTime())) {
    return {
      iso: "",
      epochMs: 0,
      dateText: "",
      timeText: "",
      displayText: input,
    };
  }

  return formatNormalizedTimestamp(parsedDate);
}

function formatNormalizedTimestamp(date: Date): NormalizedTimestamp {
  const iso = date.toISOString();
  const dateText = iso.slice(0, 10);
  const timeText = iso.slice(11, 16);

  return {
    iso,
    epochMs: date.getTime(),
    dateText,
    timeText,
    displayText: formatAbsoluteTimestamp(date),
  };
}

function formatAbsoluteTimestamp(date: Date): string {
  let hours = date.getUTCHours();
  const minutes = date.getUTCMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const timeStr = `${hours}:${minutesStr} ${ampm}`;

  const month = date.getUTCMonth() + 1;
  const day = date.getUTCDate();
  const year = date.getUTCFullYear();

  return `${month}/${day}/${year} ${timeStr}`;
}

function normalizeMessageContent(
  input: MessageContentInput,
  theme: ThemeDefinition,
): NormalizedContentNode[] {
  return normalizeContentNodes(coerceContentInputToNodes(input), theme);
}

function coerceContentInputToNodes(input: MessageContentInput): ContentNode[] {
  if (typeof input !== "string") {
    return input;
  }

  const parsedContent = parseContent(input);

  if (!parsedContent.ok) {
    throw new TypeError(
      `Content parsing failed during normalization: ${parsedContent.issues.map((issue) => issue.message).join(" ")}`,
    );
  }

  return parsedContent.nodes;
}

function normalizeContentNodes(
  input: ContentNode[],
  theme: ThemeDefinition,
): NormalizedContentNode[] {
  return input.map((node) => normalizeContentNode(node, theme));
}

function normalizeContentNode(
  input: ContentNode,
  theme: ThemeDefinition,
): NormalizedContentNode {
  switch (input.type) {
    case "text":
      return {
        type: "text",
        value: input.value,
      };
    case "mention":
      return {
        type: "mention",
        value: input.value,
        color: input.color ?? theme.tokens.colorMentionBackground,
      };
    case "link":
      return {
        type: "link",
        href: input.href,
        label: input.label ?? input.href,
      };
    case "inlineCode":
      return {
        type: "inlineCode",
        value: input.value,
      };
    case "strong":
      return {
        type: "strong",
        children: normalizeContentNodes(input.children, theme),
      };
    case "emphasis":
      return {
        type: "emphasis",
        children: normalizeContentNodes(input.children, theme),
      };
    case "lineBreak":
      return {
        type: "lineBreak",
      };
  }
}

function isThemeReference(
  value: DiscordMessageDocument["theme"],
): value is ThemeReference {
  return value !== undefined && "preset" in value;
}

export type { AssetResolutionErrorCode, AssetResolutionStatus };
