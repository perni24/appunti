import { snippet } from "./note-examples.mjs";

export const cspSource = snippet(
  "Content Security Policy",
  "export function createCspResponse",
);
export const { createCspResponse, inlineCode } = await import(
  `data:text/javascript;base64,${Buffer.from(cspSource).toString("base64")}`
);
export const textSource = snippet(
  "Sanitizzazione input",
  "export function renderCommentText",
);
export const { searchUrl } = await import(
  `data:text/javascript;base64,${Buffer.from(textSource).toString("base64")}`
);
export const richSource = snippet(
  "Sanitizzazione input",
  "export function renderRichComment",
);
