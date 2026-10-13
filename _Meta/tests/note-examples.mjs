import assert from "node:assert/strict";
import { parseNote } from "../../site/scripts/vault.mjs";

// Read the actual Markdown examples; never keep a second implementation in the tests.
export function snippet(note, marker, language = "js") {
  const { tree } = parseNote(`Programmazione/JavaScript/Pagine/${note}.md`);
  const matches = tree.children.filter(
    (node) =>
      node.type === "code" &&
      node.lang === language &&
      node.value.includes(marker),
  );
  assert.equal(
    matches.length,
    1,
    `${note}: expected one snippet containing ${marker}`,
  );
  return matches[0].value;
}
