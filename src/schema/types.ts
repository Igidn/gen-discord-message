export interface DiscordMessageDocument {
  version?: 1;
  theme?: ThemeReference | ThemeDefinitionInput;
  layout?: LayoutOptions;
  assets?: AssetOptions;
  messages: DiscordMessage[];
}

export interface DiscordMessage {
  id?: string;
  author: DiscordAuthor;
  timestamp?: string | Date;
  content: ContentNode[];
  edited?: boolean;
  reply?: unknown;
  attachments?: unknown[];
  embed?: unknown;
  reactions?: unknown[];
  badges?: unknown[];
}

export interface DiscordAuthor {
  id?: string;
  name: string;
  avatarUrl?: string;
  accentColor?: string;
  bot?: boolean;
  system?: boolean;
}

export interface ContentNodeBase {
  type: string;
}

export interface TextNode {
  type: "text";
  value: string;
}

export interface MentionNode {
  type: "mention";
  value: string;
  color?: string;
}

export interface LinkNode {
  type: "link";
  href: string;
  label?: string;
}

export interface InlineCodeNode {
  type: "inlineCode";
  value: string;
}

export interface StrongNode {
  type: "strong";
  children: ContentNode[];
}

export interface EmphasisNode {
  type: "emphasis";
  children: ContentNode[];
}

export interface LineBreakNode {
  type: "lineBreak";
}

export type ContentNode =
  | TextNode
  | MentionNode
  | LinkNode
  | InlineCodeNode
  | StrongNode
  | EmphasisNode
  | LineBreakNode;

export type ThemeReference = { preset: "discordDark" } | { preset: "discordLight" };

export interface ThemeDefinitionInput {
  name?: string;
  extends?: ThemeReference;
  tokens?: Partial<ThemeTokens>;
}

export interface ThemeDefinition {
  name: string;
  tokens: ThemeTokens;
}

export interface ThemeTokens {
  colorBackground: string;
  colorTextPrimary: string;
  colorTextMuted: string;
  colorLink: string;
  colorMentionBackground: string;
  colorMentionText: string;
  colorInlineCodeBackground: string;
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
  sizeAvatar: string;
  density: "comfortable" | "compact";
}

export interface LayoutOptions {
  width?: number;
  padding?: number;
  background?: string | null;
}

export interface AssetOptions {
  fetchRemoteAssets?: boolean;
  avatarFallbackUrl?: string;
  requestTimeoutMs?: number;
}
