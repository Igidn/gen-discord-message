# gen-discord-message

Schema-first fake Discord message renderer for HTML and images.

- Node.js `>=20`
- ESM package
- HTML is the canonical render path
- image output is derived from the same HTML

## Install

```bash
npm install Igidn/gen-discord-message
```

## Quick start

```ts
import { writeFile } from "node:fs/promises";

import { renderToImage } from "gen-discord-message";

const result = await renderToImage({
  theme: { preset: "discordDark" },
  layout: { width: 560, padding: 16 },
  messages: [
    {
      author: {
        name: "lmw",
        avatarUrl: "https://example.com/avatar.png",
        accentColor: "#57f287",
      },
      timestamp: "2026-04-29T18:30:00Z",
      content: "Ship it <@67> and check `renderToImage`.",
      edited: true,
    },
  ],
});

await writeFile("./message.png", result.data);
```

## Public API

### `validateDocument(input)`

Validates unknown input without throwing for normal user mistakes.

```ts
import { validateDocument } from "gen-discord-message";

const validation = validateDocument({
  messages: [{ author: { name: "Eris" }, content: "gay" }],
});

if (!validation.valid) {
  console.error(validation.issues);
}
```

Returns:

```ts
interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
}
```

### `renderToHtml(document, options?)`

Renders the canonical transcript HTML and scoped CSS.

```ts
import { renderToHtml } from "gen-discord-message";

const result = await renderToHtml({
  messages: [
    {
      author: { name: "Eris" },
      content: "Hello **world** <@67> https://example.com/docs",
    },
  ],
});

console.log(result.html);
console.log(result.css);
```

`RenderHtmlOptions`:

```ts
interface RenderHtmlOptions {
  includeDocumentWrapper?: boolean;
  nonce?: string;
}
```

### `renderToImage(document, options?)`

Renders an image by loading the canonical HTML in Playwright and capturing it.

```ts
import { renderToImage } from "gen-discord-message";
import { writeFile } from "node:fs/promises";

const image = await renderToImage(
  {
    messages: [
      {
        author: { name: "Eris" },
        content: "im gay <@everyone>",
      },
    ],
  },
  {
    format: "png",
    scale: 2,
    clip: "content",
  },
);

await writeFile("./message.png", image.data);
```

`RenderImageOptions`:

```ts
interface RenderImageOptions {
  format?: "png" | "jpeg" | "webp";
  scale?: number;
  background?: string | null;
  clip?: "content" | "viewport";
}
```

### `defineTheme(input)`

Creates a fully resolved custom theme from a built-in preset.

```ts
import { defineTheme } from "gen-discord-message";

const sunsetTheme = defineTheme({
  name: "Sunset",
  extends: { preset: "discordDark" },
  tokens: {
    colorBackground: "#1b1220",
    colorLink: "#ff9f43",
    colorInlineCodeBorder: "#3a263f",
    radiusMention: "6px",
  },
});
```

Built-in resolved themes are also exported:

- `discordDarkTheme`
- `discordLightTheme`

## Document model

```ts
interface DiscordMessageDocument {
  version?: 1;
  theme?: ThemeReference | ThemeDefinitionInput;
  layout?: LayoutOptions;
  assets?: AssetOptions;
  messages: DiscordMessage[];
}
```

Each message supports:

- `author`
- `timestamp`
- `content`
- `edited`

## Content authoring

`message.content` accepts either:

- a shorthand string
- `ContentNode[]`

### Supported shorthand syntax

- `**strong**`
- `*emphasis*`
- `` `inline code` ``
- `<@username>`
- absolute `http://` and `https://` URLs
- newlines

Example:

```ts
const document = {
  messages: [
    {
      author: { name: "Eris" },
      content:
        "I'm thinking about **Markdown** syntax! <@username>\nCheck `renderToHtml` at https://example.com/docs.",
    },
  ],
};
```

Advanced callers can pass explicit AST nodes for full control:

```ts
const document = {
  messages: [
    {
      author: { name: "Eris" },
      content: [
        { type: "text", value: "use" },
        { type: "text", value: " this " },
        { type: "inlineCode", value: "67" },
        { type: "mention", value: "@everyone" },
      ],
    },
  ],
};
```

## Theme tokens

Custom themes can override any supported token:

- `colorBackground`
- `colorTextPrimary`
- `colorTextMuted`
- `colorLink`
- `colorMentionBackground`
- `colorMentionText`
- `colorInlineCodeBackground`
- `colorInlineCodeBorder`
- `colorInlineCodeText`
- `colorTimestamp`
- `colorEdited`
- `fontFamilyBase`
- `fontSizeMessage`
- `fontWeightRegular`
- `fontWeightMedium`
- `lineHeightMessage`
- `spacingMessageGap`
- `spacingContentGap`
- `spacingInlinePadding`
- `radiusInline`
- `radiusMention`
- `sizeAvatar`
- `density`

## Error handling

- `validateDocument()` returns structured issues
- `renderToHtml()` and `renderToImage()` throw only for operational or invariant failures
- invalid render options throw readable `TypeError`/`RangeError` messages
- remote asset failures degrade predictably instead of crashing by default

## Examples

See [`examples/`](./examples):

- [`examples/basic.ts`](./examples/basic.ts)
- [`examples/render-image.ts`](./examples/render-image.ts)
- [`examples/validate-document.ts`](./examples/validate-document.ts)

## Development

```bash
npm install
npm run check
npm run build
```
