---
date: 2026-05-04
tags: [javascript, es-modules, dynamic-import, async, performance, code-splitting]
type: #permanent-note
status: budding
---

# Dynamic Import

Il **Dynamic Import** permette di caricare un modulo JavaScript in modo asincrono, solo quando serve, usando la sintassi:

```javascript
const module = await import("./module.js");
```

A differenza degli import statici, `import()` puo essere eseguito dentro funzioni, condizioni, handler di eventi o percorsi caricati su richiesta.

> [!INFO]
> `import()` restituisce una `Promise` che si risolve con il namespace object del modulo importato.

## 1. Import Statico vs Import Dinamico

### Import statico

```javascript
import { formatDate } from "./date-utils.js";
```

Caratteristiche:

- deve stare al top-level del modulo;
- viene analizzato prima dell'esecuzione;
- aiuta bundler e browser a costruire il grafo delle dipendenze;
- carica il modulo prima che il codice dipendente venga eseguito.

### Import dinamico

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

## 2. Perche Usarlo

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
  const { openModal } = await import("./modal.js");
  openModal();
});
```

Il codice della modale viene caricato solo quando l'utente clicca.

## 3. Namespace Object

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

## 4. Con Named Export

```javascript
// validators.js
export function isEmail(value) {
  return value.includes("@");
}
```

```javascript
async function validate(value) {
  const { isEmail } = await import("./validators.js");
  return isEmail(value);
}
```

Il destructuring rende piu chiaro quali export vengono usati.

## 5. Con Default Export

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

## 6. Gestione Errori

Poiche `import()` restituisce una `Promise`, gli errori vanno gestiti con `try/catch` o `.catch()`.

```javascript
async function loadFeature() {
  try {
    const feature = await import("./feature.js");
    feature.run();
  } catch (error) {
    console.error("Impossibile caricare il modulo", error);
  }
}
```

Errori possibili:

- file non trovato;
- errore di rete;
- errore di sintassi nel modulo;
- eccezione durante l'esecuzione top-level del modulo;
- path non supportato dal bundler.

Collegamento: [[Error Handling]]

## 7. Code Splitting

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

il browser scarica il chunk solo in quel momento.

Questo migliora:

- tempo di caricamento iniziale;
- dimensione del bundle principale;
- performance percepita;
- separazione tra feature critiche e feature opzionali.

## 8. Lazy Loading per Route o Feature

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
}
```

Ogni pagina viene caricata solo quando serve.

Questo pattern e alla base del lazy loading in molti framework.

## 9. Import Condizionale

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

## 10. Path Dinamici

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

## 11. Cache dei Moduli

Un modulo importato viene valutato una sola volta per realm.

Esempio:

```javascript
const a = await import("./config.js");
const b = await import("./config.js");

console.log(a === b); // true
```

Il modulo non viene rieseguito da zero a ogni `import()`.

Questo comportamento e coerente con gli ES Modules statici.

Collegamento: [[Moduli]]

## 12. Top-Level Await

In un modulo JavaScript moderno puoi usare `await` al top-level:

```javascript
const { config } = await import("./config.js");

console.log(config);
```

Questo funziona solo in contesti module, non negli script classici.

In molti casi, pero, e meglio isolare il caricamento dentro una funzione per mantenere chiara la sequenza di inizializzazione.

## 13. Browser e Node.js

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

## 14. Performance

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

## 15. UX e Loading State

Poiche il caricamento e asincrono, l'interfaccia dovrebbe gestire lo stato di attesa.

```javascript
async function openEditor() {
  showLoading();

  try {
    const { createEditor } = await import("./editor.js");
    createEditor();
  } finally {
    hideLoading();
  }
}
```

Senza loading state, l'utente puo percepire il click come non funzionante.

## 16. Sicurezza

Evita import dinamici basati direttamente su input utente.

Rischioso:

```javascript
const module = await import(userInput);
```

Preferibile:

```javascript
const modules = {
  chart: () => import("./features/chart.js"),
  editor: () => import("./features/editor.js"),
};

await modules[selectedFeature]?.();
```

Questo mantiene una whitelist esplicita dei moduli caricabili.

Collegamento: [[Sicurezza]]

## 17. Errori Comuni

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

## 18. Best Practices

1. Usa import statici per dipendenze sempre necessarie.
2. Usa dynamic import per codice pesante o opzionale.
3. Gestisci sempre loading ed errori.
4. Mantieni i path prevedibili per il bundler.
5. Evita input utente diretto nei path.
6. Raggruppa feature correlate quando ha senso.
7. Misura il risultato con strumenti di performance.
8. Documenta i punti di lazy loading importanti.

## 19. Mappa Mentale

```txt
Dynamic Import
  -> import() restituisce Promise
  -> carica moduli on-demand
  -> abilita code splitting
  -> utile per route, feature e librerie pesanti
  -> richiede await, loading state e gestione errori
  -> attenzione a path dinamici e sicurezza
```