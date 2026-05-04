export {
  defineTheme,
  discordDarkTheme,
  discordLightTheme,
} from "./theme/index.js";
export {
  validateDocument,
  type ValidationIssue,
  type ValidationResult,
} from "./schema/validate.js";
export {
  renderToHtml,
  type RenderHtmlOptions,
  type RenderHtmlResult,
} from "./render/html/index.js";
export {
  renderToImage,
  type RenderImageOptions,
  type RenderImageResult,
} from "./render/image/index.js";
export type {
  AssetOptions,
  ContentNode,
  ContentNodeBase,
  DiscordAuthor,
  DiscordMessage,
  DiscordMessageDocument,
  EmphasisNode,
  InlineCodeNode,
  LayoutOptions,
  LineBreakNode,
  LinkNode,
  MentionNode,
  MessageContentInput,
  StrongNode,
  TextNode,
  ThemeDefinition,
  ThemeDefinitionInput,
  ThemeReference,
  ThemeTokens,
} from "./schema/types.js";
