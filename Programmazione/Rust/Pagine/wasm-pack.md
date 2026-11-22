---
date: 2026-05-27
area: Programmazione
topic: Rust
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - programmazione
  - rust
  - webassembly
aliases:
  - wasm-pack
prerequisites:
  - "[[Programmazione/Rust/Pagine/Cargo|Cargo]]"
  - "[[Programmazione/Rust/Pagine/wasm-bindgen|wasm-bindgen]]"
  - "[[Programmazione/Rust/Pagine/Packaging e release|Packaging e release]]"
related:
  - "[[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]"
  - "[[Programmazione/Rust/Pagine/Interop con JavaScript|Interop con JavaScript]]"
  - "[[Programmazione/Rust/Pagine/Build profiles|Build profiles]]"
title: wasm-pack
---

# wasm-pack

## Sintesi

`wasm-pack` prepara una libreria Rust per chi la consumerà da JavaScript. **Cargo** compila il codice per `wasm32-unknown-unknown`; **wasm-bindgen** genera i binding; **wasm-pack** coordina questi passaggi e prepara una directory distribuibile con un `package.json`. Non è un bundler per l'applicazione, non avvia il sito e `build` non pubblica nulla.

## Scegliere il target

Il `--target` di **wasm-pack** sceglie il modo in cui JavaScript carica il pacchetto. Non cambia il target Rust in WASI e non indica il livello di ottimizzazione.

| Chi usa il pacchetto | Target | Chi carica il binario |
| --- | --- | --- |
| Una pagina HTML senza bundler | `web` | Il modulo ES esporta un inizializzatore predefinito: chiama `await init()` prima delle funzioni Rust. |
| Un'app che passa per un bundler compatibile | `bundler` (predefinito) | Il bundler risolve l'import del Wasm. Usa gli export per nome: non importare l'`init` del target web. |
| Uno script Node.js CommonJS | `nodejs` | Il wrapper carica il binario quando esegui `require()`. Non serve una chiamata a `init()`. |

Per una funzione Rust destinata a un runtime senza JavaScript, come [[Programmazione/Rust/Pagine/WASI|WASI]], questo tipo di pacchetto non è il punto di partenza.

## Una libreria, tre consumatori

Servono Rust con Cargo e rustup; per le prove usa un browser moderno, Python 3 come server HTTP e Node.js con npm. I comandi seguenti partono da una nuova libreria. Se hai già la CLI, controlla `wasm-pack --version`: la versione usata qui è 0.15.1. Il primo build può scaricare il target e gli strumenti di supporto.

```sh
cargo install wasm-pack --version 0.15.1 --locked
```

```sh
cargo new --lib testo-wasm
```

```sh
cd testo-wasm
```

In `Cargo.toml`:

```toml
[package]
name = "testo-wasm"
version = "0.1.0"
edition = "2024"

[lib]
crate-type = ["cdylib"]

[dependencies]
wasm-bindgen = "=0.2.130"
```

In `src/lib.rs`, `score_text` somma i **byte UTF-8 delle parole** separate da spazi bianchi: non conta parole, lettere o grafemi. Il valore atteso per `"a è"` è 3: un byte per `a`, due per `è`, nessuno per lo spazio. L'export `version` permette di leggere dalla libreria la versione del manifest usato in compilazione.

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn score_text(text: &str) -> usize {
    text.split_whitespace().map(str::len).sum()
}

#[wasm_bindgen]
pub fn version() -> String {
    env!("CARGO_PKG_VERSION").to_owned()
}
```

I tre build usano `--dev` per iterare in locale e **directory diverse**: ripetere il build nella stessa `pkg/` può sovrascrivere il wrapper appena provato. I file `.js`, `_bg.wasm`, `.d.ts` e `package.json` vanno considerati insieme. Il nome npm conserva il trattino (`testo-wasm`); i file generati qui usano `testo_wasm`.

### Browser senza bundler

```sh
wasm-pack build --dev --target web --out-dir pkg-web
```

Metti `index.html` nella radice della crate, accanto a `pkg-web/`:

```html
<!doctype html>
<meta charset="utf-8">
<title>Prova del pacchetto web</title>
<output id="score"></output>
<script type="module">
  import init, { score_text, version } from "./pkg-web/testo_wasm.js";
  await init();
  document.querySelector("#score").textContent = version() + ": " + score_text("a è");
</script>
```

Dalla stessa radice avvia il server, apri `http://127.0.0.1:8000/` e verifica che la pagina mostri **0.1.0: 3**. Interrompi il server con `Ctrl+C`. Usare HTTP evita le restrizioni degli URL `file:`; il browser deve poter recuperare il binario relativo al wrapper.

```sh
python -m http.server 8000 --bind 127.0.0.1
```

### Node.js senza server HTTP

```sh
wasm-pack build --dev --target nodejs --out-dir pkg-node
```

Crea `prova.cjs` nella radice. Qui si importa **la directory**: Node usa l'entry point indicato nel `package.json` generato. La funzione Rust è la stessa, ma il caricamento è diverso.

```javascript
const { score_text, version } = require("./pkg-node");
console.log(version() + ": " + score_text("a è"));
```

```sh
node prova.cjs
```

Output atteso: **0.1.0: 3**, anche a server spento.

### App con bundler

```sh
wasm-pack build --dev --target bundler --out-dir pkg-bundler
```

Nel file di ingresso dell'app (qui `app.mjs`, nella radice della crate) importa gli export per nome:

```javascript
import { score_text, version } from "./pkg-bundler/testo_wasm.js";
document.querySelector("#score").textContent = version() + ": " + score_text("a è");
```

Per esempio, con webpack 5 e la sua CLI installati nel progetto, usa questo `webpack.config.cjs`. L'opzione abilita i moduli Wasm asincroni. Altri bundler possono richiedere un plugin o un caricatore diverso.

```javascript
module.exports = {
  mode: "development",
  entry: "./app.mjs",
  experiments: { asyncWebAssembly: true },
  output: { filename: "app.js" },
};
```

```sh
npx webpack --config webpack.config.cjs
```

Per la prova crea `bundle.html` accanto a `index.html` con `<output id="score"></output><script defer src="./dist/app.js"></script>`. Servi la radice e apri `/bundle.html`: anche qui deve comparire **0.1.0: 3**. Distribuisci tutti gli asset prodotti in `dist/`, non solo `app.js`. Il fatto che il Wasm venga caricato in modo asincrono **non** implica che il wrapper esporti una funzione chiamata `init`.

## Test e distribuzione

- **Test Rust o test del pacchetto?** Un test nativo della funzione può controllare i byte; non verifica `require`, import ES, caricamento HTTP o inclusione del binario. Prova il pacchetto nell'ambiente a cui è destinato. Per test Rust scritti con `wasm-bindgen-test` e configurati per il browser si può usare il comando sotto; servono Firefox e un WebDriver compatibile. La crate minima sopra non contiene questi test.
- **Debug o distribuzione?** Senza flag di profilo, `wasm-pack build` usa `--release`. Per misurare usa lo stesso target e lo stesso profilo che distribuirai. Le ottimizzazioni, compreso l'eventuale passaggio con `wasm-opt`, non garantiscono a priori un download più piccolo o un'app più veloce.
- **Che cosa finisce in npm?** Esegui un'anteprima sulla **directory generata**, non sui sorgenti Rust. Cerca nell'elenco almeno il wrapper, il binario e le dichiarazioni previste. Il comando non crea un tarball e non pubblica. `wasm-pack pack` crea l'archivio locale; `wasm-pack publish` pubblica sul registro npm, operazione distinta da `cargo publish` su crates.io. Le tre directory sono varianti locali della stessa identità npm, non tre versioni che puoi pubblicare con lo stesso nome e numero.

```sh
wasm-pack test --headless --firefox
```

```sh
npm pack ./pkg-node --dry-run
```

## Diagnosi rapida

| Sintomo | Prima verifica |
| --- | --- |
| Il modulo non esporta `default` | Hai copiato l'import con `init` su un output `bundler`? Confronta comando di build, percorso importato e dichiarazioni `.d.ts`. |
| La pagina statica funziona in locale ma non dopo il deploy | Nel pannello Network verifica che l'URL del Wasm risponda con il binario, non una pagina HTML di fallback; usa il tipo `application/wasm` per lo streaming. Distribuisci JS e Wasm della stessa build. |
| Il bundler rifiuta il file Wasm | Il target non configura webpack o Vite al posto tuo. Controlla supporto Wasm e opzioni del bundler; per una pagina statica senza bundler scegli `web`. |
| La versione stampata non è quella attesa | Controlla `Cargo.toml`, ricostruisci nella directory del target giusto e verifica quale entry point sta caricando il consumatore. Non correggere manualmente i file generati. |

## Fonti ufficiali

- [wasm-pack: build, target, profili e directory di output](https://wasm-bindgen.github.io/wasm-pack/book/commands/build.html)
- [wasm-bindgen: caricamento con e senza bundler](https://wasm-bindgen.github.io/wasm-bindgen/reference/deployment.html)
- [webpack: opzioni sperimentali, incluso asyncWebAssembly](https://webpack.js.org/configuration/experiments/#experimentsasyncwebassembly)
- [npm pack: opzione dry-run](https://docs.npmjs.com/cli/v11/commands/npm-pack/)

## Collegamenti

- [[Programmazione/Rust/Indice Rust|Indice Rust]]
- [[Programmazione/Rust/Pagine/wasm-bindgen|wasm-bindgen]]
- [[Programmazione/Rust/Pagine/Interop con JavaScript|Interop con JavaScript]]
- [[Programmazione/Rust/Pagine/Packaging e release|Packaging e release]]
- [[Programmazione/Rust/Pagine/Cargo|Cargo]]
- [[Programmazione/Rust/Pagine/Cross-compilation|Cross-compilation]]
- [[Programmazione/Rust/Pagine/Build profiles|Build profiles]]
