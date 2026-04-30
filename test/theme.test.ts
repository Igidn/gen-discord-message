import { describe, expect, it } from "vitest";

import {
  BUILT_IN_THEME_PRESET_VERSIONS,
  THEME_TOKEN_CATEGORIES,
  defineTheme,
  discordDarkTheme,
  discordLightTheme,
  getThemePresetVersion,
  resolveThemeCssVariables,
} from "../src/theme/index.js";

describe("theme helpers", () => {
  it("tracks built-in preset versions and categorizes every token exactly once", () => {
    const tokenNames = Object.keys(discordDarkTheme.tokens).sort();
    const categorizedTokenNames = Object.values(THEME_TOKEN_CATEGORIES).flat().sort();

    expect(BUILT_IN_THEME_PRESET_VERSIONS).toEqual({
      discordDark: 1,
      discordLight: 1,
    });
    expect(getThemePresetVersion({ preset: "discordDark" })).toBe(1);
    expect(getThemePresetVersion({ preset: "discordLight" })).toBe(1);
    expect(categorizedTokenNames).toEqual(tokenNames);
  });

  it("defines a fully resolved custom theme from a preset base", () => {
    const theme = defineTheme({
      extends: { preset: "discordLight" },
      tokens: {
        colorLink: "#ff00aa",
        fontWeightMedium: 600,
      },
    });

    expect(theme).toEqual({
      name: "discordLightCustom",
      tokens: {
        ...discordLightTheme.tokens,
        colorLink: "#ff00aa",
        fontWeightMedium: 600,
      },
    });
  });

  it("maps resolved theme tokens into renderer-facing css variables", () => {
    const cssVariables = resolveThemeCssVariables(discordDarkTheme);

    expect(cssVariables).toMatchObject({
      "--gdm-color-background": "#313338",
      "--gdm-font-weight-medium": "500",
      "--gdm-line-height-message": "1.375",
      "--gdm-density": "comfortable",
    });
    expect(Object.keys(cssVariables)).toHaveLength(Object.keys(discordDarkTheme.tokens).length);
  });
});
