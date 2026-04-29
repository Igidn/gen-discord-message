import { renderToHtml } from "../src/index.js";

async function main(): Promise<void> {
  await renderToHtml({
    messages: [
      {
        author: { name: "lopax" },
        content: [{ type: "text", value: "hello" }],
      },
    ],
  });
}

void main();
