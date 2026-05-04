/**
 * Top-level input document accepted by the public rendering APIs.
 *
 * The document is intentionally semantic rather than DOM-shaped so the same
 * input can flow through validation, normalization, HTML rendering, and image
 * rendering.
 */
export interface DiscordMessageDocument {
  version?: 1;
  theme?: ThemeReference | ThemeDefinitionInput;
  layout?: LayoutOptions;
  assets?: AssetOptions;
  messages: DiscordMessage[];
}

/**
 * User-facing message content input.
 *
 * Callers can provide either a shorthand string or the explicit semantic AST.
 */
export type MessageContentInput = string | ContentNode[];

/**
 * A single transcript message.
 */
export interface DiscordMessage {
  id?: string;
  author: DiscordAuthor;
  timestamp?: string | Date;
  content: MessageContentInput;
  edited?: boolean;
  reply?: unknown;
  attachments?: unknown[];
  embed?: unknown;
  reactions?: unknown[];
  badges?: unknown[];
}

/**
 * Semantic message author metadata.
 */
export interface DiscordAuthor {
  id?: string;
  name: string;
  avatarUrl?: string;
  accentColor?: string;
  bot?: boolean;
  system?: boolean;
}

/**
 * Shared shape for content nodes.
 *
 * This exists primarily to describe the internal node family; most consumers
 * should work with the concrete `ContentNode` union instead.
 */
export interface ContentNodeBase {
  type: string;
}

/**
 * Plain text content.
 */
export interface TextNode {
  type: "text";
  value: string;
}

/**
 * Discord-style mention content.
 */
export interface MentionNode {
  type: "mention";
  value: string;
  color?: string;
}

/**
 * Absolute hyperlink content.
 */
export interface LinkNode {
  type: "link";
  href: string;
  label?: string;
}

/**
 * Inline code span content.
 */
export interface InlineCodeNode {
  type: "inlineCode";
  value: string;
}

/**
 * Strong emphasis container.
 */
export interface StrongNode {
  type: "strong";
  children: ContentNode[];
}

/**
 * Italic emphasis container.
 */
export interface EmphasisNode {
  type: "emphasis";
  children: ContentNode[];
}

/**
 * Explicit line break inside a single message.
 */
export interface LineBreakNode {
  type: "lineBreak";
}

/**
 * Supported v1 semantic message content nodes.
 */
export type ContentNode =
  | TextNode
  | MentionNode
  | LinkNode
  | InlineCodeNode
  | StrongNode
  | EmphasisNode
  | LineBreakNode;

/**
 * Reference to one of the built-in theme presets.
 */
export type ThemeReference =
  | { preset: "discordDark" }
  | { preset: "discordLight" };

/**
 * User input for creating a fully resolved custom theme.
 */
export interface ThemeDefinitionInput {
  name?: string;
  extends?: ThemeReference;
  tokens?: Partial<ThemeTokens>;
}

/**
 * Fully resolved theme definition consumed by the renderer.
 */
export interface ThemeDefinition {
  name: string;
  tokens: ThemeTokens;
}

/**
 * Semantic design tokens that control transcript appearance.
 */
export interface ThemeTokens {
  colorBackground: string;
  colorTextPrimary: string;
  colorTextMuted: string;
  colorLink: string;
  colorMentionBackground: string;
  colorMentionText: string;
  colorInlineCodeBackground: string;
  colorInlineCodeBorder: string;
  colorInlineCodeText: string;
  colorTimestamp: string;
  colorEdited: string;
  fontFamilyBase: string;
  fontSizeMessage: string;
  fontWeightRegular: number;
  fontWeightMedium: number;
  lineHeightMessage: string | number;
  spacingMessageGap: string;
  spacingContentGap: string;
  spacingInlinePadding: string;
  radiusInline: string;
  radiusMention: string;
  sizeAvatar: string;
  density: "comfortable" | "compact";
}

/**
 * Transcript layout controls shared by HTML and image rendering.
 */
export interface LayoutOptions {
  width?: number;
  padding?: number;
  background?: string | null;
}

/**
 * Remote asset fetching behavior for avatars and future asset types.
 */
export interface AssetOptions {
  fetchRemoteAssets?: boolean;
  avatarFallbackUrl?: string | null;
  requestTimeoutMs?: number;
}
