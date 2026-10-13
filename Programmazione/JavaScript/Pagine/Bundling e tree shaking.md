---
date: 2026-06-02
area: Programmazione
topic: JavaScript
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - javascript
  - bundling
  - performance
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Moduli|Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Vite|Vite]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Dynamic Import|Dynamic Import]]"
  - "[[Programmazione/JavaScript/Pagine/Source maps e debugging|Source maps e debugging]]"
title: Bundling e tree shaking
---

# Bundling e tree shaking

## Sintesi

Il **bundling** risolve il grafo delle dipendenze e genera uno o piu file distribuibili. Il **tree shaking** elimina parti che l'analisi considera inutilizzate e rimovibili senza alterare il comportamento richiesto. Non coincide con la sola rimozione degli import inutilizzati.

Esempio riferito a **Vite 8.3.4**, con Rolldown, provato con Node.js 24.14.0. Per installazione e requisiti del runtime vedi [[Programmazione/JavaScript/Pagine/Vite|Vite]].

## Quando usarlo

- Frontend con dipendenze npm, moduli e asset da distribuire.
- Progetti che trasformano TypeScript, JSX o CSS attraverso plugin appropriati.
- Applicazioni con funzionalita caricabili separatamente.
- Librerie il cui codice inutilizzato deve poter essere escluso dai consumatori.

Una pagina semplice puo usare ES modules nativi senza bundler. Aggiungere una build ha costi di manutenzione: il vantaggio va valutato sul progetto, non sul numero di strumenti adottati.

## Come funziona

### Operazioni distinte

| Operazione | Cosa cambia | Cosa non garantisce |
| --- | --- | --- |
| Bundling | Risolve e organizza moduli in file di output | Un solo file o dimensione minima |
| Tree shaking | Rimuove codice non necessario secondo analisi e configurazione | Eliminazione di tutto cio che una sessione utente non usa |
| Minificazione | Compatta il codice, accorcia nomi e puo applicare altre ottimizzazioni | Correttezza logica o segretezza |
| Code splitting | Separa parti del grafo in chunk | Caricamento differito in ogni configurazione |
| Compressione HTTP | Riduce i byte trasferiti, per esempio con Brotli | Riduzione equivalente del lavoro di esecuzione |

Sono ottimizzazioni combinabili, non sinonimi. Nell'esempio `minify: false` mantiene un output leggibile, senza disattivare l'eliminazione del codice morto.

**Dettaglio della versione provata:** Vite 8.3.4 conserva un passaggio di eliminazione del codice morto nell'output (`dce-only`) anche con `build.minify: false`. Per questo togliere soltanto il tree shaking di Rolldown non basta a conservare una funzione inutilizzata. Nei test diagnostici del demo, servono sia `build.rolldownOptions.treeshake: false` sia `build.rolldownOptions.output.minify: false` per disattivare quei due passaggi. Non e una configurazione consigliata per la produzione ne la promessa che ogni trasformazione sia disabilitata: serve a distinguere i livelli di ottimizzazione.

### Cosa significa codice eliminabile

Una funzione esportata ma mai utilizzata puo scomparire anche se **nel suo corpo** ci sono log o scritture: se non viene chiamata, questi effetti non avvengono. Diverso e un effetto eseguito al caricamento del modulo, come registrare un listener o modificare un globale.

Il bundler deve considerare anche chiamate, getter e inizializzazioni: un risultato ignorato non implica che calcolarlo sia inutile. Quando non puo stabilire il comportamento, puo conservare codice prudenzialmente.

L'analisi e statica, non un profiler delle visite reali. Una funzionalita raggiungibile ma mai aperta dall'utente non diventa automaticamente codice morto.

### Import e forma dei moduli

ESM espone collegamenti analizzabili. Questo puo aiutare:

```js
import { sum } from "./math.js";
console.log(sum(2, 3));
```

Anche il namespace puo essere analizzato quando gli accessi sono noti:

```js
import * as math from "./math.js";
console.log(math.sum(2, 3));
```

Non serve vietare ogni `import * as`. Accessi come `math[name]`, con nome non noto in build, o passare l'intero namespace a codice non analizzabile possono richiedere piu export. CommonJS e forme dinamiche sono ottimizzabili in alcuni casi, ma non hanno sempre la stessa analizzabilita di ESM.

Un import nominato da una libreria non garantisce da solo un bundle piccolo: contano formato pubblicato, dipendenze, effetti e configurazione del produttore.

## API / Sintassi

### Side effects nel package

`sideEffects` e metadato usato dai bundler che lo supportano, non una regola del runtime JavaScript. Dichiarare `false` autorizza l'esclusione di moduli inutilizzati assumendoli privi di effetti necessari all'import: una dichiarazione falsa puo rimuovere registrazioni, polyfill o CSS.

Se un package e progettato per questa ottimizzazione, una dichiarazione mirata puo essere:

```json
{
  "sideEffects": ["./src/register.js", "**/*.css"]
}
```

Questo e **un campo da integrare** nel package della libreria dopo averne verificato i moduli, non un package completo da sostituire a quello del demo. I percorsi devono descrivere i file effettivamente pubblicati: se distribuisci `dist/`, non riferirti per errore solo a `src/`.

Un import come `import "./register.js"` dichiara che vuoi eseguire il modulo, ma metadati o opzioni errati possono comunque indurre il bundler a scartarlo. Verifica l'output di produzione, non solo il dev server.

### Annotazioni di purezza

`/* @__PURE__ */` prima di una chiamata o di `new` e una promessa al bundler sugli effetti di quell'espressione, non la verifica che la funzione sia pura. Se il risultato non serve, la chiamata puo essere tolta; gli effetti degli argomenti richiedono comunque analisi.

Non annotare come pura una funzione che installa plugin, registra listener o modifica il DOM solo per ridurre il bundle.

## Esempio pratico

Nuova directory di prova `bundle-demo/`; non modificare la configurazione di un progetto reale per seguire il demo.

### File di progetto

```text
bundle-demo/
  src/
    main.js
    math.js
    register.js
    report.js
  .gitignore
  index.html
  package.json
  vite.config.js
```

`package.json`:

```json
{
  "name": "bundle-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "preview": "vite preview --host 127.0.0.1 --port 4173 --strictPort"
  },
  "devDependencies": {
    "vite": "8.3.4"
  }
}
```

`vite.config.js`:

```js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    minify: false,
    manifest: true,
  },
});
```

`.gitignore`:

```text
node_modules/
dist/
```

`index.html`:

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Demo bundling</title>
  </head>
  <body>
    <main>
      <h1>Demo bundling</h1>
      <p>Somma: <output id="sum"></output></p>
      <button id="load-report" type="button">Apri report</button>
      <p id="report" role="status"></p>
    </main>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

### Moduli

`src/math.js`:

```js
export function sum(a, b) {
  return a + b;
}

export function expensiveDebug(value) {
  console.log("DEBUG_UNUSED_MARKER", value);
}
```

Qui `sum` viene usata con numeri nel demo: non e un validatore universale. Il nome `expensiveDebug` e dimostrativo, non una misura di costo.

`src/register.js`:

```js
globalThis.demoReady = true;
```

`src/report.js`:

```js
export function reportMessage() {
  return "Report caricato";
}
```

`src/main.js`:

```js
import { sum } from "./math.js";
import "./register.js";

document.querySelector("#sum").textContent = String(sum(2, 3));

const button = document.querySelector("#load-report");
const output = document.querySelector("#report");

button.addEventListener("click", async () => {
  button.disabled = true;
  output.textContent = "Caricamento...";
  try {
    const { reportMessage } = await import("./report.js");
    output.textContent = reportMessage();
  } catch {
    output.textContent = "Caricamento non riuscito";
  } finally {
    button.disabled = false;
  }
});
```

L'HTML e parte del contratto: gli elementi devono esistere. Il piccolo report dimostra il confine di caricamento, non un guadagno prestazionale significativo. L'errore di import viene gestito; riabilitare il pulsante non garantisce che ogni fallimento sia recuperabile con un nuovo tentativo.

### Costruzione e osservazione

Dalla root del demo:

```powershell
npm install
```

Conserva `package-lock.json`; nelle installazioni successive riproducibili usa `npm ci`.

```powershell
npm run build
```

**La build rigenera e puo svuotare `dist/`**: non conservarvi file personali. L'output ha un entry chunk e, in questo esempio, un chunk separato per il report; i nomi con hash non sono stabili da una build all'altra.

Cerca il marcatore nei soli JavaScript emessi, non nelle eventuali source map:

```powershell
Get-ChildItem -LiteralPath 'dist/assets' -Filter '*.js' | Select-String -Pattern 'DEBUG_UNUSED_MARKER'
```

Con questa configurazione non sono attese corrispondenze: `expensiveDebug` non e raggiungibile. Il suo `console.log` interno non ne impedisce l'eliminazione. Cerca invece l'inizializzazione necessaria:

```powershell
Get-ChildItem -LiteralPath 'dist/assets' -Filter '*.js' | Select-String -Pattern 'demoReady'
```

Consulta i collegamenti fra entry e chunk:

```powershell
Get-Content -LiteralPath 'dist/.vite/manifest.json'
```

Avvia l'anteprima; se la porta e occupata, scegline un'altra esplicitamente:

```powershell
npm run preview
```

Apri `http://127.0.0.1:4173/`. La somma e 5; nella Console `globalThis.demoReady` e `true`. In Network, con pagina appena caricata, il chunk del report viene richiesto al primo click, non al caricamento iniziale. Dopo il successo, altri import dello stesso URL riutilizzano il modulo gia valutato.

Questa osservazione vale per il demo: prefetch, preload, altri import statici e plugin possono cambiare quando un chunk viene scaricato. Se la stessa feature e importata anche staticamente, l'import dinamico non la rende magicamente lazy.

## Varianti

- **Singolo bundle**: meno confini di caricamento, ma piu codice iniziale e invalidazioni di cache piu ampie.
- **Split per route o feature**: differisce lavoro non immediato; troppi chunk possono aggiungere richieste e catene di dipendenze.
- **Chunk condivisi**: evitano duplicazioni fra entry; controlla quali vengono comunque scaricati all'avvio.
- **Pre-bundling in sviluppo**: prepara le dipendenze per il dev server; non e il rapporto delle dimensioni di produzione.
- **Library mode**: API pubblica, dipendenze esterne e CSS richiedono un contratto diverso da una app.
- **Strumenti**: Rollup, Rolldown, esbuild, webpack e Parcel hanno scelte e plugin propri; Vite e la toolchain che li integra secondo la sua versione, non un alias universale di Rollup.

## Errori comuni

- Dichiarare `sideEffects: false` senza verificare registrazioni e CSS.
- Attribuire ogni differenza di dimensione al tree shaking: minificazione, compressione e splitting sono fattori distinti.
- Cercare nomi nel minificato o nei `.map` e trarre conclusioni assolute: i nomi possono cambiare, le mappe possono conservare sorgenti eliminati.
- Forzare tutti i pacchetti in un enorme chunk vendor senza misurare il caricamento iniziale.
- Valutare soltanto i byte su disco: misura trasferimento compresso, parsing, esecuzione e interazioni su dispositivi rappresentativi.
- Usare Coverage del browser come prova di eliminabilita: mostra quanto e stato eseguito nello scenario osservato, non tutte le esecuzioni possibili.
- Distribuire chunk e HTML di build diverse: mantieni coerenti gli artefatti e considera cache/client ancora aperti.

## Checklist

- Versione, target e configurazione della build annotati.
- Distinti byte iniziali e totali, non solo numero dei file.
- Metadati sideEffects verificati sul package pubblicato.
- Errori e stato di caricamento previsti per le feature lazy.
- Output e Network controllati nella build di produzione.
- Test funzionali rieseguiti dopo cambi di ottimizzazione.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Dynamic Import|Dynamic Import]]
- [[Programmazione/JavaScript/Pagine/Vite|Vite]]
- [[Programmazione/JavaScript/Pagine/Optimization|Optimization]]
- [[Programmazione/JavaScript/Pagine/Source maps e debugging|Source maps e debugging]]

## Fonti

Documentazione ufficiale consultata il 2026-10-13; demo provato con Vite 8.3.4.

- [Rolldown: eliminazione del codice ed effetti](https://rolldown.rs/in-depth/dead-code-elimination).
- [Rollup: introduzione al tree shaking](https://rollupjs.org/introduction/#tree-shaking).
- [webpack: sideEffects e rischi con CSS](https://webpack.js.org/guides/tree-shaking/).
- [Rolldown: code splitting automatico](https://rolldown.rs/in-depth/automatic-code-splitting).
- [Vite: configurazione della build e manifest](https://vite.dev/config/build-options).
- [Rolldown: minificazione e modalita dce-only](https://rolldown.rs/reference/OutputOptions.minify).
- [Vite: import dinamici e ottimizzazioni di caricamento](https://vite.dev/guide/features#dynamic-import).
- [Chrome DevTools: Coverage e codice usato nello scenario registrato](https://developer.chrome.com/docs/devtools/coverage).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
