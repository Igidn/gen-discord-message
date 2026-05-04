import type { ThemeTokens } from "./types.js";

export interface ValidationIssue {
  path: string;
  code: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}

const DOCUMENT_KEYS = ["version", "theme", "layout", "assets", "messages"] as const;
const MESSAGE_KEYS = [
  "id",
  "author",
  "timestamp",
  "content",
  "edited",
  "reply",
  "attachments",
  "embed",
  "reactions",
  "badges",
] as const;
const AUTHOR_KEYS = ["id", "name", "avatarUrl", "accentColor", "bot", "system"] as const;
const THEME_REFERENCE_KEYS = ["preset"] as const;
const THEME_INPUT_KEYS = ["name", "extends", "tokens"] as const;
const LAYOUT_KEYS = ["width", "padding", "background"] as const;
const ASSET_KEYS = ["fetchRemoteAssets", "avatarFallbackUrl", "requestTimeoutMs"] as const;
const TEXT_NODE_KEYS = ["type", "value"] as const;
const MENTION_NODE_KEYS = ["type", "value", "color"] as const;
const LINK_NODE_KEYS = ["type", "href", "label"] as const;
const INLINE_CODE_NODE_KEYS = ["type", "value"] as const;
const CONTAINER_NODE_KEYS = ["type", "children"] as const;
const LINE_BREAK_NODE_KEYS = ["type"] as const;
const DEFERRED_MESSAGE_FIELDS = ["reply", "attachments", "embed", "reactions", "badges"] as const;
const SUPPORTED_NODE_TYPES = new Set([
  "text",
  "mention",
  "link",
  "inlineCode",
  "strong",
  "emphasis",
  "lineBreak",
]);
const DEFERRED_NODE_TYPES = new Set(["emoji", "channelMention", "codeBlock", "spoiler", "timestampToken"]);
const COLOR_TOKEN_KEYS = new Set<keyof ThemeTokens>([
  "colorBackground",
  "colorTextPrimary",
  "colorTextMuted",
  "colorLink",
  "colorMentionBackground",
  "colorMentionText",
  "colorInlineCodeBackground",
  "colorInlineCodeText",
  "colorTimestamp",
  "colorEdited",
]);
const STRING_TOKEN_KEYS = new Set<keyof ThemeTokens>([
  "fontFamilyBase",
  "fontSizeMessage",
  "spacingMessageGap",
  "spacingContentGap",
  "spacingInlinePadding",
  "radiusInline",
  "sizeAvatar",
]);
const NUMBER_TOKEN_KEYS = new Set<keyof ThemeTokens>(["fontWeightRegular", "fontWeightMedium"]);
const THEME_TOKEN_KEYS = [
  "colorBackground",
  "colorTextPrimary",
  "colorTextMuted",
  "colorLink",
  "colorMentionBackground",
  "colorMentionText",
  "colorInlineCodeBackground",
  "colorInlineCodeText",
  "colorTimestamp",
  "colorEdited",
  "fontFamilyBase",
  "fontSizeMessage",
  "fontWeightRegular",
  "fontWeightMedium",
  "lineHeightMessage",
  "spacingMessageGap",
  "spacingContentGap",
  "spacingInlinePadding",
  "radiusInline",
  "sizeAvatar",
  "density",
] as const;

export function validateDocument(input: unknown): ValidationResult {
  const issues: ValidationIssue[] = [];
  const ancestors = new Set<object>();

  validateRootDocument(input, issues, ancestors);

  return {
    valid: issues.length === 0,
    issues,
  };
}

function validateRootDocument(
  input: unknown,
  issues: ValidationIssue[],
  ancestors: Set<object>,
): void {
  if (!isPlainObject(input)) {
    pushIssue(issues, "$", "invalid_type", "Document must be an object.");
    return;
  }

  withAncestor(input, "$", issues, ancestors, () => {
    validateUnknownKeys(input, DOCUMENT_KEYS, "$", issues);

    if (Object.hasOwn(input, "version") && input.version !== 1) {
      pushIssue(issues, "version", "invalid_literal", "version must be 1 when provided.");
    }

    if (Object.hasOwn(input, "theme")) {
      validateTheme(input.theme, "theme", issues, ancestors);
    }

    if (Object.hasOwn(input, "layout")) {
      validateLayout(input.layout, "layout", issues, ancestors);
    }

    if (Object.hasOwn(input, "assets")) {
      validateAssets(input.assets, "assets", issues, ancestors);
    }

    if (!Object.hasOwn(input, "messages")) {
      pushIssue(issues, "messages", "missing_required_field", "messages is required.");
      return;
    }

    validateMessages(input.messages, "messages", issues, ancestors);
  });
}

function validateTheme(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors: Set<object>,
): void {
  if (!isPlainObject(value)) {
    pushIssue(issues, path, "invalid_type", "theme must be an object.");
    return;
  }

  withAncestor(value, path, issues, ancestors, () => {
    if (Object.hasOwn(value, "preset")) {
      validateUnknownKeys(value, THEME_REFERENCE_KEYS, path, issues);

      if (value.preset !== "discordDark" && value.preset !== "discordLight") {
        pushIssue(
          issues,
          joinPath(path, "preset"),
          "invalid_literal",
          'theme.preset must be "discordDark" or "discordLight".',
        );
      }

      return;
    }

    validateUnknownKeys(value, THEME_INPUT_KEYS, path, issues);

    if (Object.hasOwn(value, "name")) {
      validateNonEmptyString(value.name, joinPath(path, "name"), "theme name", issues);
    }

    if (Object.hasOwn(value, "extends")) {
      validateThemeReference(value.extends, joinPath(path, "extends"), issues, ancestors);
    }

    if (Object.hasOwn(value, "tokens")) {
      validateThemeTokens(value.tokens, joinPath(path, "tokens"), issues, ancestors);
    }
  });
}

function validateThemeReference(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors: Set<object>,
): void {
  if (!isPlainObject(value)) {
    pushIssue(issues, path, "invalid_type", "theme reference must be an object.");
    return;
  }

  withAncestor(value, path, issues, ancestors, () => {
    validateUnknownKeys(value, THEME_REFERENCE_KEYS, path, issues);

    if (!Object.hasOwn(value, "preset")) {
      pushIssue(
        issues,
        joinPath(path, "preset"),
        "missing_required_field",
        "theme reference preset is required.",
      );
      return;
    }

    if (value.preset !== "discordDark" && value.preset !== "discordLight") {
      pushIssue(
        issues,
        joinPath(path, "preset"),
        "invalid_literal",
        'theme reference preset must be "discordDark" or "discordLight".',
      );
    }
  });
}

function validateThemeTokens(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors: Set<object>,
): void {
  if (!isPlainObject(value)) {
    pushIssue(issues, path, "invalid_type", "theme.tokens must be an object.");
    return;
  }

  withAncestor(value, path, issues, ancestors, () => {
    validateUnknownKeys(value, THEME_TOKEN_KEYS, path, issues);

    for (const tokenKey of THEME_TOKEN_KEYS) {
      if (!Object.hasOwn(value, tokenKey)) {
        continue;
      }

      const tokenValue = value[tokenKey];
      const tokenPath = joinPath(path, tokenKey);

      if (COLOR_TOKEN_KEYS.has(tokenKey)) {
        validateColorString(tokenValue, tokenPath, `${tokenKey}`, issues);
        continue;
      }

      if (STRING_TOKEN_KEYS.has(tokenKey)) {
        validateNonEmptyString(tokenValue, tokenPath, `${tokenKey}`, issues);
        continue;
      }

      if (NUMBER_TOKEN_KEYS.has(tokenKey)) {
        validateFiniteNumber(tokenValue, tokenPath, `${tokenKey}`, issues, { min: 0, exclusiveMin: true });
        continue;
      }

      if (tokenKey === "lineHeightMessage") {
        if (typeof tokenValue === "string") {
          validateNonEmptyString(tokenValue, tokenPath, tokenKey, issues);
          continue;
        }

        validateFiniteNumber(tokenValue, tokenPath, tokenKey, issues, { min: 0, exclusiveMin: true });
        continue;
      }

      if (tokenKey === "density" && tokenValue !== "comfortable" && tokenValue !== "compact") {
        pushIssue(
          issues,
          tokenPath,
          "invalid_literal",
          'density must be "comfortable" or "compact".',
        );
      }
    }
  });
}

function validateLayout(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors: Set<object>,
): void {
  if (!isPlainObject(value)) {
    pushIssue(issues, path, "invalid_type", "layout must be an object.");
    return;
  }

  withAncestor(value, path, issues, ancestors, () => {
    validateUnknownKeys(value, LAYOUT_KEYS, path, issues);

    if (Object.hasOwn(value, "width")) {
      validateFiniteNumber(value.width, joinPath(path, "width"), "layout width", issues, {
        min: 0,
        exclusiveMin: true,
      });
    }

    if (Object.hasOwn(value, "padding")) {
      validateFiniteNumber(value.padding, joinPath(path, "padding"), "layout padding", issues, {
        min: 0,
      });
    }

    if (Object.hasOwn(value, "background") && value.background !== null) {
      validateColorString(value.background, joinPath(path, "background"), "layout background", issues);
    }
  });
}

function validateAssets(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors: Set<object>,
): void {
  if (!isPlainObject(value)) {
    pushIssue(issues, path, "invalid_type", "assets must be an object.");
    return;
  }

  withAncestor(value, path, issues, ancestors, () => {
    validateUnknownKeys(value, ASSET_KEYS, path, issues);

    if (Object.hasOwn(value, "fetchRemoteAssets") && typeof value.fetchRemoteAssets !== "boolean") {
      pushIssue(
        issues,
        joinPath(path, "fetchRemoteAssets"),
        "invalid_type",
        "fetchRemoteAssets must be a boolean.",
      );
    }

    if (Object.hasOwn(value, "avatarFallbackUrl") && value.avatarFallbackUrl !== null) {
      validateUrlString(value.avatarFallbackUrl, joinPath(path, "avatarFallbackUrl"), "avatarFallbackUrl", issues);
    }

    if (Object.hasOwn(value, "requestTimeoutMs")) {
      validateFiniteNumber(value.requestTimeoutMs, joinPath(path, "requestTimeoutMs"), "requestTimeoutMs", issues, {
        min: 0,
        exclusiveMin: true,
      });
    }
  });
}

function validateMessages(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors: Set<object>,
): void {
  if (!Array.isArray(value)) {
    pushIssue(issues, path, "invalid_type", "messages must be an array.");
    return;
  }

  if (value.length === 0) {
    pushIssue(issues, path, "empty_collection", "messages must contain at least one item.");
    return;
  }

  withAncestor(value, path, issues, ancestors, () => {
    value.forEach((message, index) => {
      validateMessage(message, `${path}[${index}]`, issues, ancestors);
    });
  });
}

function validateMessage(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors: Set<object>,
): void {
  if (!isPlainObject(value)) {
    pushIssue(issues, path, "invalid_type", "message must be an object.");
    return;
  }

  withAncestor(value, path, issues, ancestors, () => {
    validateUnknownKeys(value, MESSAGE_KEYS, path, issues);

    if (Object.hasOwn(value, "id") && typeof value.id !== "string") {
      pushIssue(issues, joinPath(path, "id"), "invalid_type", "message id must be a string.");
    }

    if (!Object.hasOwn(value, "author")) {
      pushIssue(issues, joinPath(path, "author"), "missing_required_field", "author is required.");
    } else {
      validateAuthor(value.author, joinPath(path, "author"), issues, ancestors);
    }

    if (Object.hasOwn(value, "timestamp")) {
      validateTimestamp(value.timestamp, joinPath(path, "timestamp"), issues);
    }

    if (!Object.hasOwn(value, "content")) {
      pushIssue(issues, joinPath(path, "content"), "missing_required_field", "content is required.");
    } else {
      validateContent(value.content, joinPath(path, "content"), issues, ancestors);
    }

    if (Object.hasOwn(value, "edited") && typeof value.edited !== "boolean") {
      pushIssue(issues, joinPath(path, "edited"), "invalid_type", "edited must be a boolean.");
    }

    for (const field of DEFERRED_MESSAGE_FIELDS) {
      if (Object.hasOwn(value, field)) {
        pushIssue(
          issues,
          joinPath(path, field),
          "unsupported_feature",
          `${field} is not supported in v1.`,
        );
      }
    }
  });
}

function validateAuthor(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors: Set<object>,
): void {
  if (!isPlainObject(value)) {
    pushIssue(issues, path, "invalid_type", "author must be an object.");
    return;
  }

  withAncestor(value, path, issues, ancestors, () => {
    validateUnknownKeys(value, AUTHOR_KEYS, path, issues);

    if (Object.hasOwn(value, "id") && typeof value.id !== "string") {
      pushIssue(issues, joinPath(path, "id"), "invalid_type", "author id must be a string.");
    }

    if (!Object.hasOwn(value, "name")) {
      pushIssue(issues, joinPath(path, "name"), "missing_required_field", "author name is required.");
    } else {
      validateNonEmptyString(value.name, joinPath(path, "name"), "author name", issues);
    }

    if (Object.hasOwn(value, "avatarUrl")) {
      validateUrlString(value.avatarUrl, joinPath(path, "avatarUrl"), "avatarUrl", issues);
    }

    if (Object.hasOwn(value, "accentColor")) {
      validateColorString(value.accentColor, joinPath(path, "accentColor"), "accentColor", issues);
    }

    if (Object.hasOwn(value, "bot") && typeof value.bot !== "boolean") {
      pushIssue(issues, joinPath(path, "bot"), "invalid_type", "bot must be a boolean.");
    }

    if (Object.hasOwn(value, "system") && typeof value.system !== "boolean") {
      pushIssue(issues, joinPath(path, "system"), "invalid_type", "system must be a boolean.");
    }
  });
}

function validateTimestamp(value: unknown, path: string, issues: ValidationIssue[]): void {
  if (typeof value === "string") {
    return;
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      pushIssue(issues, path, "invalid_literal", "timestamp must be a valid Date.");
    }

    return;
  }

  pushIssue(issues, path, "invalid_type", "timestamp must be a string or Date.");
}

function validateContent(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors: Set<object>,
): void {
  if (!Array.isArray(value)) {
    pushIssue(issues, path, "invalid_type", "content must be an array.");
    return;
  }

  if (value.length === 0) {
    pushIssue(issues, path, "empty_collection", "content must contain at least one node in v1.");
    return;
  }

  withAncestor(value, path, issues, ancestors, () => {
    value.forEach((node, index) => {
      validateContentNode(node, `${path}[${index}]`, issues, ancestors);
    });
  });
}

function validateContentNode(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors: Set<object>,
): void {
  if (!isPlainObject(value)) {
    pushIssue(issues, path, "invalid_type", "content node must be an object.");
    return;
  }

  withAncestor(value, path, issues, ancestors, () => {
    if (!Object.hasOwn(value, "type")) {
      pushIssue(issues, joinPath(path, "type"), "missing_required_field", "content node type is required.");
      return;
    }

    if (typeof value.type !== "string") {
      pushIssue(issues, joinPath(path, "type"), "invalid_type", "content node type must be a string.");
      return;
    }

    if (DEFERRED_NODE_TYPES.has(value.type)) {
      pushIssue(
        issues,
        joinPath(path, "type"),
        "unsupported_feature",
        `${value.type} nodes are not supported in v1.`,
      );
      return;
    }

    if (!SUPPORTED_NODE_TYPES.has(value.type)) {
      pushIssue(
        issues,
        joinPath(path, "type"),
        "invalid_literal",
        `Unsupported content node type: ${value.type}.`,
      );
      return;
    }

    switch (value.type) {
      case "text":
        validateUnknownKeys(value, TEXT_NODE_KEYS, path, issues);
        validateString(value.value, joinPath(path, "value"), "text value", issues);
        break;
      case "mention":
        validateUnknownKeys(value, MENTION_NODE_KEYS, path, issues);
        validateString(value.value, joinPath(path, "value"), "mention value", issues);

        if (Object.hasOwn(value, "color")) {
          validateColorString(value.color, joinPath(path, "color"), "mention color", issues);
        }

        break;
      case "link":
        validateUnknownKeys(value, LINK_NODE_KEYS, path, issues);
        validateUrlString(value.href, joinPath(path, "href"), "link href", issues);

        if (Object.hasOwn(value, "label")) {
          validateString(value.label, joinPath(path, "label"), "link label", issues);
        }

        break;
      case "inlineCode":
        validateUnknownKeys(value, INLINE_CODE_NODE_KEYS, path, issues);
        validateString(value.value, joinPath(path, "value"), "inlineCode value", issues);
        break;
      case "strong":
      case "emphasis":
        validateUnknownKeys(value, CONTAINER_NODE_KEYS, path, issues);

        if (!Object.hasOwn(value, "children")) {
          pushIssue(
            issues,
            joinPath(path, "children"),
            "missing_required_field",
            `${value.type} children is required.`,
          );
        } else {
          validateChildContent(value.children, joinPath(path, "children"), issues, ancestors);
        }

        break;
      case "lineBreak":
        validateUnknownKeys(value, LINE_BREAK_NODE_KEYS, path, issues);
        break;
      default:
        break;
    }
  });
}

function validateChildContent(
  value: unknown,
  path: string,
  issues: ValidationIssue[],
  ancestors: Set<object>,
): void {
  if (!Array.isArray(value)) {
    pushIssue(issues, path, "invalid_type", "children must be an array.");
    return;
  }

  withAncestor(value, path, issues, ancestors, () => {
    value.forEach((node, index) => {
      validateContentNode(node, `${path}[${index}]`, issues, ancestors);
    });
  });
}

function validateUnknownKeys(
  value: Record<string, unknown>,
  allowedKeys: readonly string[],
  path: string,
  issues: ValidationIssue[],
): void {
  const allowed = new Set(allowedKeys);

  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      pushIssue(issues, joinPath(path, key), "unknown_field", `Unknown field: ${key}.`);
    }
  }
}

function validateString(
  value: unknown,
  path: string,
  label: string,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "string") {
    pushIssue(issues, path, "invalid_type", `${label} must be a string.`);
  }
}

function validateNonEmptyString(
  value: unknown,
  path: string,
  label: string,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "string") {
    pushIssue(issues, path, "invalid_type", `${label} must be a string.`);
    return;
  }

  if (value.trim().length === 0) {
    pushIssue(issues, path, "invalid_literal", `${label} must not be empty.`);
  }
}

function validateFiniteNumber(
  value: unknown,
  path: string,
  label: string,
  issues: ValidationIssue[],
  constraints: { min?: number; exclusiveMin?: boolean } = {},
): void {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    pushIssue(issues, path, "invalid_type", `${label} must be a finite number.`);
    return;
  }

  if (constraints.min === undefined) {
    return;
  }

  if (constraints.exclusiveMin ? value <= constraints.min : value < constraints.min) {
    pushIssue(
      issues,
      path,
      "invalid_literal",
      constraints.exclusiveMin
        ? `${label} must be greater than ${constraints.min}.`
        : `${label} must be at least ${constraints.min}.`,
    );
  }
}

function validateUrlString(
  value: unknown,
  path: string,
  label: string,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "string") {
    pushIssue(issues, path, "invalid_type", `${label} must be a string.`);
    return;
  }

  try {
    const url = new URL(value);

    if (url.protocol.length === 0) {
      pushIssue(issues, path, "invalid_url", `${label} must be a valid URL.`);
    }
  } catch {
    pushIssue(issues, path, "invalid_url", `${label} must be a valid URL.`);
  }
}

function validateColorString(
  value: unknown,
  path: string,
  label: string,
  issues: ValidationIssue[],
): void {
  if (typeof value !== "string") {
    pushIssue(issues, path, "invalid_type", `${label} must be a string.`);
    return;
  }

  if (!isColorString(value)) {
    pushIssue(issues, path, "invalid_color", `${label} must be a valid color string.`);
  }
}

function withAncestor(
  value: object,
  path: string,
  issues: ValidationIssue[],
  ancestors: Set<object>,
  callback: () => void,
): void {
  if (ancestors.has(value)) {
    pushIssue(issues, path, "invalid_structure", "Recursive structures are not supported.");
    return;
  }

  ancestors.add(value);

  try {
    callback();
  } finally {
    ancestors.delete(value);
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
    /^(?:rgb|rgba|hsl|hsla|hwb|lab|lch|oklab|oklch|color)\(.+\)$/iu.test(trimmed) ||
    /^(?:transparent|currentColor|inherit|initial|unset|revert|revert-layer)$/u.test(trimmed) ||
    /^[a-z][a-z-]*$/iu.test(trimmed)
  );
}

function joinPath(basePath: string, property: string): string {
  return basePath === "$" ? property : `${basePath}.${property}`;
}

function pushIssue(
  issues: ValidationIssue[],
  path: string,
  code: string,
  message: string,
): void {
  issues.push({ path, code, message });
}
