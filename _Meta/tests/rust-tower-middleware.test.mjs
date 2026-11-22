import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { after, before, test } from "node:test";
import { parseNote } from "../../site/scripts/vault.mjs";

const blocks = parseNote(
  "Programmazione/Rust/Pagine/Tower e middleware.md",
).tree.children.filter((b) => b.type === "code");
const tmp = fs.realpathSync(os.tmpdir());
let root, dir, env;
function run(cmd, args, cwd = dir) {
  const res = spawnSync(cmd, args, {
    cwd,
    env,
    encoding: "utf8",
    windowsHide: true,
    timeout: 300000,
    maxBuffer: 8 * 1024 * 1024,
  });
  assert.ifError(res.error);
  assert.equal(
    res.status,
    0,
    [cmd, ...args, res.stdout, res.stderr].join("\n"),
  );
  return res.stdout;
}
const checks = `use super::*;
use std::{convert::Infallible, future::pending};
use axum::body::{Body, to_bytes};
use tower::ServiceExt;

async fn send(app: Router, uri: &str) -> Response {
    let request = Request::builder().uri(uri).body(Body::empty()).unwrap();
    app.oneshot(request).await.unwrap()
}
fn starts() -> Arc<AtomicUsize> { Arc::new(AtomicUsize::new(0)) }

#[tokio::test(start_paused = true)]
async fn status_header_e_corpi() {
    let svc = app(starts());
    let ok = send(svc.clone(), "/quick").await;
    assert_eq!(ok.status(), StatusCode::OK);
    assert_eq!(ok.headers()["x-observed"], "yes");
    assert_eq!(&to_bytes(ok.into_body(), 8).await.unwrap()[..], b"ok");
    let slow = send(svc, "/slow").await;
    assert_eq!(slow.status(), StatusCode::SERVICE_UNAVAILABLE);
    assert!(to_bytes(slow.into_body(), 8).await.unwrap().is_empty());
}

#[tokio::test(start_paused = true)]
async fn ambito() {
    let svc = app(starts()).route("/dopo", get(|| async { "later" }));
    for (path, status) in [("/assente", StatusCode::NOT_FOUND), ("/dopo", StatusCode::OK)] {
        let res = send(svc.clone(), path).await;
        assert_eq!(res.status(), status);
        assert!(!res.headers().contains_key("x-observed"));
    }
}

#[tokio::test(start_paused = true)]
async fn ordine() {
    let timeout = || TimeoutLayer::with_status_code(StatusCode::SERVICE_UNAVAILABLE, BUDGET);
    let marker = || middleware::from_fn(observed);
    let reverse_builder = routes(starts()).route_layer(ServiceBuilder::new().layer(timeout()).layer(marker()));
    let successive = routes(starts()).layer(marker()).layer(timeout());
    let successive_invertite = routes(starts()).layer(timeout()).layer(marker());
    for (svc, has_marker) in [(app(starts()), true), (reverse_builder, false), (successive, false), (successive_invertite, true)] {
        let ok = send(svc.clone(), "/quick").await;
        assert_eq!(ok.status(), StatusCode::OK);
        assert_eq!(ok.headers()["x-observed"], "yes");
        let timed_out = send(svc, "/slow").await;
        assert_eq!(timed_out.status(), StatusCode::SERVICE_UNAVAILABLE);
        assert_eq!(timed_out.headers().contains_key("x-observed"), has_marker);
    }
}

#[tokio::test(start_paused = true)]
async fn elapsed_diventa_risposta() {
    let never = tower::service_fn(|_: ()| pending::<Result<(), Infallible>>());
    let err = ServiceBuilder::new().timeout(BUDGET).service(never)
        .oneshot(()).await.unwrap_err();
    assert!(err.is::<tower::timeout::error::Elapsed>());
    let svc = app_tower(starts());
    assert_eq!(send(svc.clone(), "/quick").await.status(), StatusCode::OK);
    let res = send(svc, "/slow").await;
    assert_eq!(res.status(), StatusCode::SERVICE_UNAVAILABLE);
    assert_eq!(res.headers()["x-observed"], "yes");
}

#[tokio::test(start_paused = true)]
async fn streaming_dopo_la_risposta() {
    let svc = Router::new().route("/stream", get(|| async {
        Body::from_stream(futures_util::stream::once(async {
            tokio::time::sleep(Duration::from_secs(2)).await;
            Ok::<_, Infallible>("fine")
        }))
    })).route_layer(TimeoutLayer::with_status_code(StatusCode::SERVICE_UNAVAILABLE, BUDGET));
    let res = send(svc, "/stream").await;
    assert_eq!(res.status(), StatusCode::OK);
    let start = tokio::time::Instant::now();
    assert_eq!(&to_bytes(res.into_body(), 16).await.unwrap()[..], b"fine");
    assert!(start.elapsed() > BUDGET);
}
`;
before(() => {
  root = fs.mkdtempSync(path.join(tmp, "vault-tower-"));
  dir = path.join(root, "strati-http");
  env = {
    ...process.env,
    CARGO_HOME: process.env.CARGO_HOME || path.join(root, "c"),
    CARGO_TARGET_DIR: path.join(root, "t"),
    CARGO_TERM_COLOR: "never",
  };
  const cmd = blocks.find(
    (b) => b.lang === "sh" && b.value.startsWith("cargo new"),
  ).value;
  run("cargo", [...cmd.split(/\s+/).slice(1), "--vcs", "none"], root);
  const manifest = path.join(dir, "Cargo.toml");
  const toml = blocks.find((b) => b.lang === "toml").value;
  const initial = fs.readFileSync(manifest, "utf8");
  assert.match(initial, /\[dependencies\]\s*$/);
  fs.writeFileSync(
    manifest,
    initial.replace(/\[dependencies\]\s*$/, "") +
      toml +
      '\nfutures-util = "0.3"\n',
  );
  fs.writeFileSync(
    path.join(dir, "src/lib.rs"),
    blocks
      .filter((b) => b.lang === "rust")
      .map((b) => b.value)
      .join("\n\n") + "\n#[cfg(test)] mod verifiche;\n",
  );
  fs.writeFileSync(path.join(dir, "src/verifiche.rs"), checks);
  const host = run("rustc", ["-vV"])
    .match(/^host: (.+)$/m)[1]
    .trim();
  run("cargo", ["fetch", "--target", host]);
  run("cargo", ["test", "--lib", "--locked", "--offline", "--no-run"]);
  console.log(
    run("cargo", ["tree", "--locked", "--offline", "--depth", "1"]).trim(),
  );
});
after(() => {
  if (!root) return;
  const p = fs.realpathSync(root);
  assert.equal(path.dirname(p), tmp);
  assert.ok(path.basename(p).startsWith("vault-tower-"));
  fs.rmSync(p, { recursive: true, maxRetries: 4, retryDelay: 250 });
});
for (const [name, id] of [
  [
    "test del Markdown: il timeout non annulla l'incremento",
    "tests::timeout_visibile",
  ],
  [
    "successo e timeout: status, corpo e header",
    "verifiche::status_header_e_corpi",
  ],
  ["route_layer esclude fallback e route successive", "verifiche::ambito"],
  [
    "ordine del builder e delle chiamate successive sul router",
    "verifiche::ordine",
  ],
  [
    "Elapsed generico e mapping HTTP tramite HandleErrorLayer",
    "verifiche::elapsed_diventa_risposta",
  ],
  [
    "lo streaming successivo agli header non usa il budget della chiamata",
    "verifiche::streaming_dopo_la_risposta",
  ],
]) {
  test(name, () =>
    assert.match(
      run("cargo", [
        "test",
        "--lib",
        "--locked",
        "--offline",
        id,
        "--",
        "--exact",
      ]),
      /test result: ok\. 1 passed;/,
    ),
  );
}
