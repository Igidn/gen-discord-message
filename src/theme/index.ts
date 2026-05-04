import type {
  ThemeDefinition,
  ThemeDefinitionInput,
  ThemeReference,
  ThemeTokens,
} from "../schema/types.js";
import {
  BUILT_IN_THEME_PRESET_VERSIONS,
  discordDarkTheme,
  discordLightTheme,
} from "./presets.js";

export { BUILT_IN_THEME_PRESET_VERSIONS, discordDarkTheme, discordLightTheme };

export const THEME_TOKEN_CATEGORIES = {
  colors: [
    "colorBackground",
    "colorTextPrimary",
    "colorTextMuted",
    "colorLink",
    "colorMentionBackground",
    "colorMentionText",
    "colorInlineCodeBackground",
    "colorInlineCodeBorder",
    "colorInlineCodeText",
    "colorTimestamp",
    "colorEdited",
  ],
  typography: [
    "fontFamilyBase",
    "fontSizeMessage",
    "fontWeightRegular",
    "fontWeightMedium",
    "lineHeightMessage",
  ],
  spacing: ["spacingMessageGap", "spacingContentGap", "spacingInlinePadding"],
  radii: ["radiusInline", "radiusMention"],
  sizing: ["sizeAvatar"],
  density: ["density"],
} as const satisfies Record<string, readonly (keyof ThemeTokens)[]>;

const THEME_TOKEN_CSS_VARIABLES = {
  colorBackground: "--gdm-color-background",
  colorTextPrimary: "--gdm-color-text-primary",
  colorTextMuted: "--gdm-color-text-muted",
  colorLink: "--gdm-color-link",
  colorMentionBackground: "--gdm-color-mention-background",
  colorMentionText: "--gdm-color-mention-text",
  colorInlineCodeBackground: "--gdm-color-inline-code-background",
  colorInlineCodeBorder: "--gdm-color-inline-code-border",
  colorInlineCodeText: "--gdm-color-inline-code-text",
  colorTimestamp: "--gdm-color-timestamp",
  colorEdited: "--gdm-color-edited",
  fontFamilyBase: "--gdm-font-family-base",
  fontSizeMessage: "--gdm-font-size-message",
  fontWeightRegular: "--gdm-font-weight-regular",
  fontWeightMedium: "--gdm-font-weight-medium",
  lineHeightMessage: "--gdm-line-height-message",
  spacingMessageGap: "--gdm-spacing-message-gap",
  spacingContentGap: "--gdm-spacing-content-gap",
  spacingInlinePadding: "--gdm-spacing-inline-padding",
  radiusInline: "--gdm-radius-inline",
  radiusMention: "--gdm-radius-mention",
  sizeAvatar: "--gdm-size-avatar",
  density: "--gdm-density",
} as const satisfies Record<keyof ThemeTokens, `--gdm-${string}`>;

export type ThemeTokenCategory = keyof typeof THEME_TOKEN_CATEGORIES;
export type ThemeCssVariableName =
  (typeof THEME_TOKEN_CSS_VARIABLES)[keyof typeof THEME_TOKEN_CSS_VARIABLES];
export type ThemeCssVariables = Record<ThemeCssVariableName, string>;

export function defineTheme(input: ThemeDefinitionInput): ThemeDefinition {
  const baseReference = input.extends ?? { preset: "discordDark" };
  const baseTheme = resolveThemeReference(baseReference);

  return Object.freeze({
    name: input.name ?? `${baseReference.preset}Custom`,
    tokens: {
      ...baseTheme.tokens,
      ...input.tokens,
    },
  });
}

export function resolveThemeReference(reference: ThemeReference): ThemeDefinition {
  if (reference.preset === "discordLight") {
    return discordLightTheme;
  }

  return discordDarkTheme;
}

export function resolveThemeCssVariables(theme: ThemeDefinition): ThemeCssVariables {
  return Object.fromEntries(
    Object.entries(THEME_TOKEN_CSS_VARIABLES).map(([tokenName, cssVariableName]) => [
      cssVariableName,
      stringifyThemeToken(theme.tokens[tokenName as keyof ThemeTokens]),
    ]),
  ) as ThemeCssVariables;
}

export function getThemePresetVersion(reference: ThemeReference): number {
  return BUILT_IN_THEME_PRESET_VERSIONS[reference.preset];
}

function stringifyThemeToken(value: ThemeTokens[keyof ThemeTokens]): string {
  return typeof value === "number" ? String(value) : value;
}
