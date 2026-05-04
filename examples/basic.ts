import { renderToHtml } from "../src/index.js";

async function main(): Promise<void> {
  const result = await renderToHtml(
    {
      theme: { preset: "discordDark" },
      layout: { width: 560, padding: 16 },
      messages: [
        {
          author: {
            name: "lopax",
            accentColor: "#57f287",
          },
          timestamp: "2026-04-29T18:30:00Z",
          content: "Ship it <@{team}> and check `renderToHtml`.",
          edited: true,
        },
      ],
    },
    { includeDocumentWrapper: true },
  );

  console.log(result.html);
}

void main();
