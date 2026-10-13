import { snippet } from "./note-examples.mjs";

const apiSource = snippet("CORS", "export function createDemoServer");
export const { createDemoServer } = await import(
  `data:text/javascript;base64,${Buffer.from(apiSource).toString("base64")}`
);

export async function listen(t, server) {
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  t.after(async () => {
    const closed = new Promise((resolve) => server.close(resolve));
    server.closeAllConnections();
    await closed;
  });
  return `http://127.0.0.1:${server.address().port}`;
}

export function clientSource(apiOrigin) {
  return snippet("CORS", "export async function readDemo").replaceAll(
    "http://127.0.0.1:9000",
    apiOrigin,
  );
}
