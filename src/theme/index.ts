import type { ThemeDefinition, ThemeDefinitionInput, ThemeReference } from "../schema/types.js";
import { discordDarkTheme, discordLightTheme } from "./presets.js";

export { discordDarkTheme, discordLightTheme };

export function defineTheme(input: ThemeDefinitionInput): ThemeDefinition {
  const baseTheme = resolveThemeReference(input.extends ?? { preset: "discordDark" });

  return {
    name: input.name ?? `${baseTheme.name}Custom`,
    tokens: {
      ...baseTheme.tokens,
      ...input.tokens,
    },
  };
}

export function resolveThemeReference(reference: ThemeReference): ThemeDefinition {
  if (reference.preset === "discordLight") {
    return discordLightTheme;
  }

  return discordDarkTheme;
}
