---
date: 2026-06-02
area: Programmazione
topic: JavaScript
tags:
  - javascript
  - es-modules
  - dynamic-import
  - async
  - performance
  - code-splitting
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
aliases:
  - Import dinamico
  - import()
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Promises]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Promise avanzate]]"
  - "[[Programmazione/JavaScript/Pagine/Circular Dependencies]]"
title: Dynamic Import
---

# Dynamic Import

## Sintesi


Il **Dynamic Import** permette di caricare un modulo JavaScript in modo asincrono, solo quando serve, usando la sintassi:

```javascript
const module = await import("./module.js");
```

A differenza degli import statici, `import()` puo essere eseguito dentro funzioni, condizioni, handler di eventi o percorsi caricati su richiesta.

> [!INFO]
> `import()` restituisce una `Promise` che si risolve con il namespace object del modulo importato.

## Quando usarlo

Usa dynamic import quando un modulo non serve subito e vuoi caricarlo solo al momento necessario.

Casi comuni:

- lazy loading di feature;
- code splitting per route;
- caricamento di librerie pesanti;
- moduli opzionali;
- rompere cicli solo quando il ritardo asincrono ha senso;
- eseguire codice diverso in base a configurazione o ambiente.

Per dipendenze sempre necessarie, preferisci import statico.

Gli esempi della spiegazione sono schemi: `button`, helper UI e moduli come `modal.js` devono esistere nell'applicazione. La sezione **Esempio pratico** include invece un caso completo in tre file.

## Come funziona

### Import Statico vs Import Dinamico
#### Import statico

```javascript
import { formatDate } from "./date-utils.js";
```

Caratteristiche:

- deve stare al top-level del modulo;
- viene analizzato prima dell'esecuzione;
- aiuta bundler e browser a costruire il grafo delle dipendenze;
- carica il modulo prima che il codice dipendente venga eseguito.

#### Import dinamico

```javascript
async function loadFormatter() {
  const module = await import("./date-utils.js");
  return module.formatDate(new Date());
}
```

Caratteristiche:

- puo stare dentro funzioni o condizioni;
- carica codice solo quando necessario;
- restituisce una `Promise`;
- abilita code splitting e lazy loading.
### Perche Usarlo
Dynamic import e utile quando una parte del codice:

- e pesante;
- non serve al caricamento iniziale;
- dipende da una scelta dell'utente;
- serve solo in una route specifica;
- e legata a un feature flag;
- usa librerie opzionali;
- viene caricata solo in ambiente browser o solo in ambiente Node.js.

Esempio:

```javascript
button.addEventListener("click", async () => {
  try {
    const { openModal } = await import("./modal.js");
    await openModal();
  } catch (error) {
    console.error("Apertura della modale non riuscita", error);
  }
});
```

La chiamata a `import()` avviene al click; cache, preload o altre parti dell'applicazione possono aver gia scaricato il modulo.
### Namespace Object
Il valore restituito da `import()` e un oggetto che contiene gli export del modulo.

```javascript
const math = await import("./math.js");

console.log(math.sum(2, 3));
console.log(math.pi);
```

Se il modulo ha un default export:

```javascript
const module = await import("./logger.js");

module.default("Messaggio di log");
```

Oppure con destructuring:

```javascript
const { default: log } = await import("./logger.js");

log("Messaggio di log");
```
### Con Named Export
```javascript
// validators.js
export function hasEmailShape(value) {
  return typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
```

```javascript
async function validate(value) {
  const { hasEmailShape } = await import("./validators.js");
  return hasEmailShape(value);
}
```

Il destructuring rende piu chiaro quali export vengono usati. Questo e soltanto un controllo di forma, con gli stessi limiti dell'esempio in [[Programmazione/JavaScript/Pagine/Moduli|Moduli]], non una validazione completa dell'email.

Le proprieta del namespace riflettono gli export correnti; il destructuring legge invece il valore in quell'istante. Con un contatore numerico esportato, `const { count } = await import(...)` conserva quel numero e non segue gli incrementi successivi.
### Con Default Export
```javascript
// Chart.js
export default class Chart {
  render() {
    console.log("Render chart");
  }
}
```

```javascript
async function loadChart() {
  const { default: Chart } = await import("./Chart.js");
  const chart = new Chart();
  chart.render();
}
```

La sintassi `default: Chart` rinomina l'export default in una variabile locale.
### Code Splitting
Nei progetti frontend, dynamic import e spesso usato per il **code splitting**.

Invece di generare un unico bundle grande:

```txt
app.js
```

il bundler puo generare chunk separati:

```txt
app.js
admin-panel.js
charting.js
editor.js
```

Quando il codice esegue:

```javascript
await import("./admin-panel.js");
```

il browser puo richiedere il chunk in quel momento. La separazione effettiva dipende dal bundler e dalla configurazione; preload, cache e dipendenze condivise possono anticipare o evitare parte dei download. Senza bundler, il browser carica il modulo e le sue dipendenze come risorse separate.

Se la suddivisione e adatta al carico reale, puo migliorare:

- tempo di caricamento iniziale;
- dimensione del bundle principale;
- performance percepita;
- separazione tra feature critiche e feature opzionali.
### Lazy Loading per Route o Feature
Esempio concettuale:

```javascript
async function renderPage(route) {
  if (route === "/dashboard") {
    const { renderDashboard } = await import("./pages/dashboard.js");
    return renderDashboard();
  }

  if (route === "/settings") {
    const { renderSettings } = await import("./pages/settings.js");
    return renderSettings();
  }

  throw new RangeError("Route non supportata");
}
```

Ogni pagina viene caricata solo quando serve.

Questo pattern e alla base del lazy loading in molti framework.
### Import Condizionale
Dynamic import permette di caricare moduli in base a una condizione.

```javascript
async function loadAnalytics(enabled) {
  if (!enabled) {
    return;
  }

  const analytics = await import("./analytics.js");
  analytics.init();
}
```

Uso tipico:

- feature flag;
- ambiente dev/prod;
- permessi utente;
- preferenze privacy;
- supporto progressivo di funzionalita.

Nascondere o non importare una feature non autorizza l'accesso ai suoi dati: i permessi vanno verificati sul server.
### Path Dinamici
`import()` accetta un'espressione, ma i path troppo dinamici possono creare problemi ai bundler.

Esempio gestibile:

```javascript
const locale = "it";
const messages = await import(`./locales/${locale}.js`);
```

Esempio problematico:

```javascript
const path = getPathFromUserInput();
const module = await import(path);
```

Problemi:

- il bundler non sa quali file includere;
- aumenta il rischio di bundle troppo grandi;
- puo creare problemi di sicurezza;
- rende meno prevedibile il grafo delle dipendenze.
### Cache dei Moduli
Un modulo valutato correttamente viene riusato per la stessa identita risolta nello stesso realm.

Esempio:

```javascript
const a = await import("./config.js");
const b = await import("./config.js");

console.log(a === b); // true
```

Il modulo non viene rieseguito da zero a ogni `import()`.

Questo comportamento e coerente con gli ES Modules statici.

Identita diverse, per esempio URL con query diverse, possono creare istanze distinte. Non aggiungere timestamp per forzare un reload a ogni chiamata: non esiste un'API standard per svuotare la cache ESM e si puo accumulare memoria. Anche un import gia in cache resta asincrono.

Collegamento: [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
### Top-Level Await
In un modulo JavaScript moderno puoi usare `await` al top-level:

```javascript
const { config } = await import("./config.js");

console.log(config);
```

Il top-level `await` funziona nei moduli, non negli script classici. `import()` invece puo essere usato anche in uno script classico o in CommonJS, per esempio dentro una funzione `async` o con `.then()`.

In molti casi, pero, e meglio isolare il caricamento dentro una funzione per mantenere chiara la sequenza di inizializzazione.
### Browser e Node.js
Dynamic import funziona sia nel browser moderno sia in Node.js con moduli ES.

Nel browser:

```html
<script type="module" src="app.js"></script>
```

```javascript
await import("./feature.js");
```

In Node.js:

```javascript
const { readFile } = await import("node:fs/promises");
```

In progetti Node, `import()` e utile anche da codice CommonJS quando devi caricare un modulo ESM.
### Performance
Dynamic import migliora il caricamento iniziale solo se usato con criterio.

Vantaggi:

- riduce il bundle iniziale;
- carica feature on-demand;
- separa codice raro da codice critico;
- migliora startup su reti lente.

Costi:

- introduce una richiesta aggiuntiva;
- puo causare ritardo al primo uso della feature;
- richiede gestione dello stato di loading;
- puo peggiorare UX se usato su codice necessario subito.

Regola pratica:

```txt
carica dinamicamente codice grande, raro o separabile
non caricare dinamicamente codice piccolo e sempre necessario
```
### UX e Loading State
Poiche il caricamento e asincrono, l'interfaccia dovrebbe gestire lo stato di attesa.

```javascript
async function openEditor() {
  showLoading();

  try {
    const { createEditor } = await import("./editor.js");
    await createEditor();
  } finally {
    hideLoading();
  }
}
```

Senza loading state, l'utente puo percepire il click come non funzionante.

Qui `finally` ripristina l'interfaccia ma non cattura l'errore: il chiamante deve gestire il rifiuto di `openEditor()`. Gli helper `showLoading()` e `hideLoading()` sono dipendenze applicative.
### Sicurezza
Evita import dinamici basati direttamente su input utente.

Rischioso:

```javascript
const module = await import(userInput);
```

Preferibile:

```javascript
const featureLoaders = new Map([
  ["chart", () => import("./features/chart.js")],
  ["editor", () => import("./features/editor.js")],
]);

async function loadFeatureByName(name) {
  const loader = featureLoaders.get(name);
  if (!loader) throw new RangeError("Feature non supportata");
  return loader();
}
```

Questa mappa limita la scelta ai moduli elencati: nomi come `toString`, `constructor` o `__proto__` non trovano proprieta ereditate. I due file devono esistere; il chiamante gestisce sia nomi non ammessi sia errori di import. Non e un meccanismo di autorizzazione server.

Collegamento: [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]

## API / Sintassi

Sintassi:

```js
const module = await import("./feature.js");
```

Con named export:

```js
const { runFeature } = await import("./feature.js");
runFeature();
```

Con default export:

```js
const { default: Component } = await import("./Component.js");
```

Dynamic import restituisce una Promise e puo essere usato dentro funzioni, condizioni o event handler.

## Esempio pratico

Caricare una libreria solo quando serve:

```js
async function exportChart(data) {
  const { toPng } = await import("./chart-export.js");
  return toPng(data);
}
```

Il codice di export non finisce necessariamente nel bundle iniziale, se il bundler supporta code splitting.

`chart-export.js` e una dipendenza applicativa, non una libreria fornita da JavaScript.

### Esempio completo nel browser

Tre file nella stessa cartella, serviti via HTTP con MIME JavaScript corretto. Questo piccolo report mostra il flusso; nella pratica il caricamento lazy ha senso per elaborazioni o dipendenze piu consistenti.

```html
<!-- index.html -->
<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <title>Report su richiesta</title>
</head>
<body>
  <button type="button" id="load-report">Calcola report</button>
  <p id="report-status" role="status"></p>
  <script type="module" src="./report-loader.js"></script>
</body>
</html>
```

```js
// report.js
export function formatReport(numbers) {
  if (!Array.isArray(numbers) || ![...numbers].every(Number.isFinite)) {
    throw new TypeError("Servono numeri finiti");
  }
  const total = numbers.reduce((sum, value) => sum + value, 0);
  if (!Number.isFinite(total)) throw new RangeError("Totale fuori intervallo");
  return `${numbers.length} valori, totale ${total}`;
}
```

```js
// report-loader.js
const button = document.querySelector("#load-report");
const status = document.querySelector("#report-status");
let loading = false;

button.addEventListener("click", async () => {
  if (loading) return;
  loading = true;
  button.disabled = true;
  status.textContent = "Caricamento...";

  try {
    const { formatReport } = await import("./report.js");
    status.textContent = formatReport([4, 8, 2]);
  } catch (error) {
    status.textContent = "Report non disponibile.";
    console.error("Report non riuscito", error);
  } finally {
    loading = false;
    button.disabled = false;
  }
});
```

Il risultato atteso e `3 valori, totale 14`. Un errore di caricamento o di elaborazione mostra un messaggio e ripristina il pulsante. Ripetere il click non garantisce una nuova richiesta: il caricatore ESM mantiene la propria cache, inclusi alcuni fallimenti di valutazione.

## Varianti

### Mappa Mentale
```txt
Dynamic Import
  -> import() restituisce Promise
  -> carica moduli on-demand
  -> abilita code splitting
  -> utile per route, feature e librerie pesanti
  -> richiede await, loading state e gestione errori
  -> attenzione a path dinamici e sicurezza
```

## Errori comuni

### Gestione Errori
Poiche `import()` restituisce una `Promise`, gli errori vanno gestiti con `try/catch` o `.catch()`.

```javascript
async function loadFeature() {
  try {
    const feature = await import("./feature.js");
    await feature.run();
  } catch (error) {
    console.error("Caricamento o esecuzione della feature non riusciti", error);
  }
}
```

Errori possibili:

- file non trovato;
- errore di rete;
- errore di sintassi nel modulo;
- eccezione durante l'esecuzione top-level del modulo;
- path non supportato dal bundler.

`await feature.run()` consente al `catch` di intercettare anche un rifiuto asincrono della funzione esportata. Senza quell'`await`, il `try/catch` intercetterebbe soltanto l'import e gli errori sincroni della chiamata.

Collegamento: [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]

### Usarlo dove basta un import statico

Se il modulo serve sempre, l'import statico e piu semplice e piu analizzabile.

### Dimenticare await

```javascript
const module = import("./feature.js");
module.run(); // errore: module e una Promise
```

Corretto:

```javascript
const module = await import("./feature.js");
module.run();
```

### Path troppo dinamici

I bundler devono poter capire quali file includere.

### Non gestire il fallimento

Il caricamento puo fallire, soprattutto nel browser.

### Creare troppi chunk piccoli

Troppi import dinamici possono aumentare overhead di rete e complessita.

## Checklist

### Best Practices
1. Usa import statici per dipendenze sempre necessarie.
2. Usa dynamic import per codice pesante o opzionale.
3. Gestisci sempre loading ed errori.
4. Mantieni i path prevedibili per il bundler.
5. Evita input utente diretto nei path.
6. Raggruppa feature correlate quando ha senso.
7. Misura il risultato con strumenti di performance.
8. Documenta i punti di lazy loading importanti.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Promises|Promises]]
- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]

## Fonti

- [MDN - import()](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/import)
- [MDN - Map, chiavi e proprieta accidentali](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
- [Node.js - ESM e identita degli URL](https://nodejs.org/api/esm.html)
- [Vite - Dynamic import e ottimizzazioni di caricamento](https://vite.dev/guide/features.html#dynamic-import)

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
