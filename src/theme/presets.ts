import type { ThemeDefinition, ThemeTokens } from "../schema/types.js";

export const BUILT_IN_THEME_PRESET_VERSIONS = {
  discordDark: 1,
  discordLight: 1,
} as const;

const discordDarkTokens = Object.freeze({
  colorBackground: "#1a1a1e",
  colorTextPrimary: "#f2f3f5",
  colorTextMuted: "#949ba4",
  colorLink: "#00a8fc",
  colorMentionBackground: "#3b3f66",
  colorMentionText: "#c9cdfb",
  colorInlineCodeBackground: "#111214",
  colorInlineCodeBorder: "#2b2d31",
  colorInlineCodeText: "#f2f3f5",
  colorTimestamp: "#949ba4",
  colorEdited: "#949ba4",
  fontFamilyBase:
    '"gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontSizeMessage: "16px",
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  lineHeightMessage: 1.375,
  spacingMessageGap: "16px",
  spacingContentGap: "2px",
  spacingInlinePadding: "0 4px",
  radiusInline: "4px",
  radiusMention: "4px",
  sizeAvatar: "40px",
  density: "comfortable",
} satisfies ThemeTokens);

const discordLightTokens = Object.freeze({
  colorBackground: "#ffffff",
  colorTextPrimary: "#2e3338",
  colorTextMuted: "#747f8d",
  colorLink: "#0068e0",
  colorMentionBackground: "#e8f2ff",
  colorMentionText: "#4752c4",
  colorInlineCodeBackground: "#f2f3f5",
  colorInlineCodeBorder: "#d7dbe0",
  colorInlineCodeText: "#2e3338",
  colorTimestamp: "#747f8d",
  colorEdited: "#747f8d",
  fontFamilyBase:
    '"gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontSizeMessage: "16px",
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  lineHeightMessage: 1.375,
  spacingMessageGap: "16px",
  spacingContentGap: "2px",
  spacingInlinePadding: "0 4px",
  radiusInline: "4px",
  radiusMention: "4px",
  sizeAvatar: "40px",
  density: "comfortable",
} satisfies ThemeTokens);

export const discordDarkTheme: ThemeDefinition = Object.freeze({
  name: "discordDark",
  tokens: discordDarkTokens,
});

export const discordLightTheme: ThemeDefinition = Object.freeze({
  name: "discordLight",
  tokens: discordLightTokens,
});
