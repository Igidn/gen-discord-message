import { validateDocument } from "../src/index.js";

const validation = validateDocument({
  messages: [
    {
      author: { name: "Eris" },
      content: "Hello <@{team}> — check https://example.com/docs",
    },
  ],
});

if (!validation.valid) {
  console.error("Document is invalid:", validation.issues);
  process.exitCode = 1;
} else {
  console.log("Document is valid.");
}
