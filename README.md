# gen-discord-message

Schema-first fake Discord message renderer for HTML and images.

## Hybrid content authoring

`message.content` accepts either a semantic AST or a shorthand string that is parsed internally.

```ts
const document = {
  theme: { preset: "discordDark" },
  layout: { width: 560, padding: 16 },
  messages: [
    {
      author: { name: "Eris" },
      timestamp: "Today at 8:12 PM",
      content:
        "I'm thinking about switching to **Markdown** syntax! <@{username}>",
    },
  ],
};
```

Advanced callers can still pass `ContentNode[]` directly for precise control.
