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

const COLOR_THEME_TOKENS = new Set<keyof ThemeTokens>([
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
]);
const STRING_THEME_TOKENS = new Set<keyof ThemeTokens>([
  "fontFamilyBase",
  "fontSizeMessage",
  "spacingMessageGap",
  "spacingContentGap",
  "spacingInlinePadding",
  "radiusInline",
  "radiusMention",
  "sizeAvatar",
]);
const NUMBER_THEME_TOKENS = new Set<keyof ThemeTokens>([
  "fontWeightRegular",
  "fontWeightMedium",
]);

export type ThemeTokenCategory = keyof typeof THEME_TOKEN_CATEGORIES;
export type ThemeCssVariableName =
  (typeof THEME_TOKEN_CSS_VARIABLES)[keyof typeof THEME_TOKEN_CSS_VARIABLES];
export type ThemeCssVariables = Record<ThemeCssVariableName, string>;

/**
 * Resolves a partial custom theme definition into a full theme object.
 *
 * Custom themes inherit from a built-in preset and can override any supported
 * theme token without exposing renderer internals.
 */
export function defineTheme(input: ThemeDefinitionInput): ThemeDefinition {
  assertThemeDefinitionInput(input);

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

/**
 * Resolves a built-in theme preset reference into its full theme definition.
 */
export function resolveThemeReference(
  reference: ThemeReference,
): ThemeDefinition {
  if (reference.preset === "discordLight") {
    return discordLightTheme;
  }

  return discordDarkTheme;
}

/**
 * Maps semantic theme tokens to the scoped CSS variables used by the renderer.
 */
export function resolveThemeCssVariables(
  theme: ThemeDefinition,
): ThemeCssVariables {
  return Object.fromEntries(
    Object.entries(THEME_TOKEN_CSS_VARIABLES).map(
      ([tokenName, cssVariableName]) => [
        cssVariableName,
        stringifyThemeToken(theme.tokens[tokenName as keyof ThemeTokens]),
      ],
    ),
  ) as ThemeCssVariables;
}

/**
 * Returns the published version number for a built-in preset.
 */
export function getThemePresetVersion(reference: ThemeReference): number {
  return BUILT_IN_THEME_PRESET_VERSIONS[reference.preset];
}

function stringifyThemeToken(value: ThemeTokens[keyof ThemeTokens]): string {
  return typeof value === "number" ? String(value) : value;
}

function assertThemeDefinitionInput(
  input: ThemeDefinitionInput,
): asserts input is ThemeDefinitionInput {
  if (!isPlainObject(input)) {
    throw new TypeError("defineTheme input must be an object.");
  }

  if (input.name !== undefined) {
    assertNonEmptyString(input.name, "defineTheme name");
  }

  if (input.extends !== undefined) {
    if (!isPlainObject(input.extends)) {
      throw new TypeError("defineTheme extends must be an object.");
    }

    if (
      input.extends.preset !== "discordDark" &&
      input.extends.preset !== "discordLight"
    ) {
      throw new TypeError(
        'defineTheme extends.preset must be "discordDark" or "discordLight".',
      );
    }
  }

  if (input.tokens !== undefined) {
    if (!isPlainObject(input.tokens)) {
      throw new TypeError("defineTheme tokens must be an object.");
    }

    for (const [tokenName, tokenValue] of Object.entries(input.tokens)) {
      if (!(tokenName in THEME_TOKEN_CSS_VARIABLES)) {
        throw new TypeError(
          `defineTheme tokens contains an unknown token: ${tokenName}.`,
        );
      }

      assertThemeTokenValue(tokenName as keyof ThemeTokens, tokenValue);
    }
  }
}

function assertThemeTokenValue(
  tokenName: keyof ThemeTokens,
  tokenValue: unknown,
): void {
  if (COLOR_THEME_TOKENS.has(tokenName)) {
    assertColorString(tokenValue, `defineTheme tokens.${tokenName}`);
    return;
  }

  if (STRING_THEME_TOKENS.has(tokenName)) {
    assertNonEmptyString(tokenValue, `defineTheme tokens.${tokenName}`);
    return;
  }

  if (NUMBER_THEME_TOKENS.has(tokenName)) {
    assertPositiveFiniteNumber(tokenValue, `defineTheme tokens.${tokenName}`);
    return;
  }

  if (tokenName === "lineHeightMessage") {
    if (typeof tokenValue === "string") {
      assertNonEmptyString(tokenValue, `defineTheme tokens.${tokenName}`);
      return;
    }

    assertPositiveFiniteNumber(tokenValue, `defineTheme tokens.${tokenName}`);
    return;
  }

  if (
    tokenName === "density" &&
    tokenValue !== "comfortable" &&
    tokenValue !== "compact"
  ) {
    throw new TypeError(
      'defineTheme tokens.density must be "comfortable" or "compact".',
    );
  }
}

function assertNonEmptyString(value: unknown, label: string): void {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new TypeError(`${label} must be a non-empty string.`);
  }
}

function assertColorString(value: unknown, label: string): void {
  if (typeof value !== "string" || !isColorString(value)) {
    throw new TypeError(`${label} must be a valid color string.`);
  }
}

function assertPositiveFiniteNumber(value: unknown, label: string): void {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    throw new TypeError(`${label} must be a finite number greater than 0.`);
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Object.prototype.toString.call(value) === "[object Object]";
}

function isColorString(value: string): boolean {
  const trimmed = value.trim();

  if (trimmed.length === 0) {
    return false;
  }

  return (
    /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/iu.test(trimmed) ||
    /^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(.+\)$/iu.test(
      trimmed,
    ) ||
    /^(?:transparent|currentColor|inherit|initial|unset|revert|revert-layer)$/u.test(
      trimmed,
    ) ||
    /^[a-z][a-z-]*$/iu.test(trimmed)
  );
}
