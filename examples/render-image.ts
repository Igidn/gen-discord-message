import { writeFile } from "node:fs/promises";

import { renderToImage } from "../dist/index.js";

const CUSTOM_AVATAR =
  "https://cdn.discordapp.com/avatars/841196373948497941/f87468636c74b952fa04c798777961a9.webp?size=1024";

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
        timestamp: "20:21 PM",
        content: [{ type: "text", value: "im gay" }],
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
