import type { ThemeDefinition, ThemeTokens } from "../schema/types.js";

export const BUILT_IN_THEME_PRESET_VERSIONS = {
  discordDark: 1,
  discordLight: 1,
} as const;

const discordDarkTokens = Object.freeze({
  colorBackground: "#313338",
  colorTextPrimary: "#dbdee1",
  colorTextMuted: "#949ba4",
  colorLink: "#00a8fc",
  colorMentionBackground: "rgba(88, 101, 242, 0.3)",
  colorMentionText: "#c9cdfb",
  colorInlineCodeBackground: "rgba(30, 31, 34, 0.85)",
  colorInlineCodeText: "#f2f3f5",
  colorTimestamp: "#949ba4",
  colorEdited: "#949ba4",
  fontFamilyBase:
    'Inter, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontSizeMessage: "16px",
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  lineHeightMessage: 1.375,
  spacingMessageGap: "16px",
  spacingContentGap: "4px",
  spacingInlinePadding: "0 4px",
  radiusInline: "4px",
  sizeAvatar: "40px",
  density: "comfortable",
} satisfies ThemeTokens);

const discordLightTokens = Object.freeze({
  colorBackground: "#ffffff",
  colorTextPrimary: "#2e3338",
  colorTextMuted: "#747f8d",
  colorLink: "#0068e0",
  colorMentionBackground: "rgba(88, 101, 242, 0.15)",
  colorMentionText: "#4752c4",
  colorInlineCodeBackground: "rgba(232, 235, 237, 0.9)",
  colorInlineCodeText: "#2e3338",
  colorTimestamp: "#747f8d",
  colorEdited: "#747f8d",
  fontFamilyBase:
    'Inter, "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif',
  fontSizeMessage: "16px",
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  lineHeightMessage: 1.375,
  spacingMessageGap: "16px",
  spacingContentGap: "4px",
  spacingInlinePadding: "0 4px",
  radiusInline: "4px",
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
