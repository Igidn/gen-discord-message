import { writeFile } from "node:fs/promises";

import { renderToImage } from "../src/index.js";

const CUSTOM_AVATAR = "https://cdn.discordapp.com/embed/avatars/0.png";

async function main(): Promise<void> {
  const document = {
    theme: { preset: "discordDark" },
    layout: { width: 560, padding: 16 },
    messages: [
      {
        author: {
          name: "Eris",
          avatarUrl: CUSTOM_AVATAR,
        },
        timestamp: "2026-04-29T20:21:00Z",
        content: "Ship it <@{team}> with **one** canonical HTML pipeline.",
      },
    ],
  };

  const image = await renderToImage(document, {
    format: "png",
    clip: "content",
  });

  const outputPath = new URL("./render-image.output.png", import.meta.url);
  await writeFile(outputPath, image.data);

  console.log(
    `Wrote ${image.format} sample to ${outputPath.pathname} (${image.width}x${image.height})`,
  );
}

void main();
