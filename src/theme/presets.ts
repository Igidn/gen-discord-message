import type { ThemeDefinition } from "../schema/types.js";

export const discordDarkTheme: ThemeDefinition = {
  name: "discordDark",
  tokens: {
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
  },
};

export const discordLightTheme: ThemeDefinition = {
  name: "discordLight",
  tokens: {
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
  },
};
