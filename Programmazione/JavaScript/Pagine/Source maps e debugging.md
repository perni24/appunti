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
  - debugging
  - tooling
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Vite|Vite]]"
  - "[[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Bundling e tree shaking|Bundling e tree shaking]]"
  - "[[Programmazione/JavaScript/Pagine/Testing|Testing]]"
title: Source maps e debugging
---

# Source maps e debugging

## Sintesi

Una **source map** associa posizioni del codice generato alle posizioni dei sorgenti. Il browser continua a eseguire il bundle: il debugger usa la mappa per mostrare file, righe e breakpoint piu comprensibili.

La mappa non corregge il programma e non ricrea necessariamente ogni variabile eliminata dall'ottimizzazione. Il debugging consiste nel ricostruire dati e flusso di esecuzione, non soltanto nel rendere leggibile lo stack.

Demo: **Vite 8.3.4**, Node.js 24.14.0 e Chrome. Le etichette dei pannelli possono cambiare con versione e lingua del browser.

## Quando usarlo

- Errori in JavaScript minificato o in TypeScript/JSX trasformato.
- Breakpoint sui sorgenti di un'app costruita con un bundler.
- Diagnosi di una specifica release tramite error tracking.
- Confronto fra comportamento del dev server e build realmente pubblicata.

Per codice non trasformato puoi gia fare debug del file servito. Il pulsante di pretty-print migliora l'impaginazione di un bundle, ma **non sostituisce la mappa** e non ricostruisce file, nomi e commenti originali.

## Come funziona

### Dalla posizione generata al sorgente

Una mappa esterna e normalmente collegata da un commento nel JavaScript:

```js
//# sourceMappingURL=app.js.map
```

L'URL si risolve rispetto al file generato; il nome sopra e illustrativo, non un file da aggiungere al demo. Esistono anche collegamenti tramite header HTTP e mappe incorporate come data URL.

Il formato comune e JSON con versione 3; fra i campi:

| Campo | Significato |
| --- | --- |
| `version` | Versione del formato, non versione dell'app |
| `sources` | Identificatori o percorsi dei sorgenti |
| `sourcesContent` | Testo originale incorporato, facoltativo |
| `names` | Nomi referenziati da alcuni segmenti |
| `mappings` | Corrispondenze codificate fra posizioni |
| `sourceRoot` | Eventuale base per risolvere i sorgenti |

Non modificare manualmente `mappings`. Una catena TypeScript/plugin/minifier deve comporre correttamente le mappe fra trasformazioni; un plugin che le perde puo peggiorare la precisione finale.

### Identita e limiti

**Bundle e mappa devono appartenere alla stessa build.** Una mappa di ieri puo indicare una riga plausibile ma sbagliata per il JavaScript di oggi. Conserva artefatti, identificativo della release e associazioni richieste dal sistema di monitoraggio; non rigenerare la mappa successivamente con dipendenze diverse.

Le ottimizzazioni possono unire istruzioni, rinominare o eliminare variabili. Breakpoint spostati su una posizione eseguibile e scope incompleti non sono sempre errori del debugger.

Le posizioni di uno stack mostrato all'utente e quelle di un'API possono usare basi diverse. Per esempio, `SourceMap.findEntry` di Node riceve offset **da zero**; uno stack tipico mostra riga e colonna **da uno**. Non sottrarre o aggiungere 1 senza conoscere il formato del produttore.

## API / Sintassi

### Source map di build in Vite

| `build.sourcemap` | Output | Riferimento nel bundle |
| --- | --- | --- |
| `false` | Nessuna mappa della build | Assente |
| `true` | File `.map` esterno | Presente |
| `"inline"` | Mappa inclusa nel JavaScript | Data URL |
| `"hidden"` | File `.map` esterno | Commento omesso |

Questa opzione riguarda la **build**, non tutti i comportamenti del dev server. `"eval-source-map"` e una scelta della famiglia di opzioni webpack, non un valore da copiare in `build.sourcemap` di Vite.

**Hidden non significa privato.** Se distribuisci anche quel `.map`, un client puo richiederlo direttamente, pur non trovando il commento nel JavaScript. Anche una mappa inline e pubblica insieme al bundle.

### Strumenti di debugging

- **Breakpoint di riga**: fermati prima di una operazione e ispeziona gli input.
- **Breakpoint condizionale**: limita la pausa al caso rilevante; la condizione e codice eseguito dal debugger.
- **Pause on exceptions**: utile quando non sai dove nasce l'errore; distingui eccezioni intercettate e non intercettate.
- **Step over / into / out**: esegui la chiamata, entraci o torna al chiamante.
- **Scope e Call Stack**: osserva binding correnti e catena delle chiamate; per asincronia non presumere uno stack sincrono continuo.
- **Logpoint**: diagnostica senza inserire permanentemente `console.log` nel sorgente.
- **Network e breakpoint eventi/DOM**: individua risposte inattese e chi modifica la UI.

Valuta espressioni senza effetti quando ispezioni lo stato: chiamare funzioni nella Console o in Watch puo modificare il programma. Un debugger in pausa cambia anche il timing, quindi non e una prova neutra per tutte le condizioni concorrenti.

## Esempio pratico

**Demo intenzionalmente difettoso**, da eseguire in una nuova directory `sourcemap-demo/`. Non invia dati a servizi esterni e non usa credenziali. Lo scopo e trovare e correggere il nome errato di un campo.

### File

```text
sourcemap-demo/
  src/
    main.js
    profile.js
  .gitignore
  index.html
  package.json
  vite.config.js
```

`package.json`:

```json
{
  "name": "sourcemap-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "vite build",
    "preview": "vite preview --host 127.0.0.1 --port 4174 --strictPort"
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
    sourcemap: true,
  },
});
```

Il minifier client predefinito di Vite 8 resta attivo. `.gitignore`:

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
    <title>Demo source map</title>
  </head>
  <body>
    <main>
      <h1>Demo source map</h1>
      <button id="show-profile" type="button">Mostra profilo</button>
      <p id="result" role="status"></p>
    </main>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

`src/profile.js`:

```js
export function displayName(user) {
  return user.name.toUpperCase();
}
```

Questa funzione richiede un oggetto con `name` stringa. Non valida risposte HTTP arbitrarie: qui stiamo verificando un contratto piccolo e dichiarato.

`src/main.js`, con errore volontario:

```js
import { displayName } from "./profile.js";

const response = { user: { name: "Ada" } };

document.querySelector("#show-profile").addEventListener("click", () => {
  const user = response.profile; // Errore intenzionale: il campo e user.
  document.querySelector("#result").textContent = displayName(user);
});
```

### Riproduzione

Dalla root del demo:

```powershell
npm install
```

Versiona il lockfile e usa `npm ci` per riprodurre la stessa installazione.

```powershell
npm run build
```

**La build puo svuotare `dist/`**, che deve contenere solo output rigenerabile.

```powershell
npm run preview
```

Apri `http://127.0.0.1:4174/` e attiva le JavaScript source maps nelle impostazioni di DevTools. Se la porta e occupata scegli un'altra porta; l'anteprima e solo locale, non un server di produzione.

### Diagnosi e correzione

1. Apri Sources e abilita la pausa sulle eccezioni non intercettate.
2. Premi **Mostra profilo**. E atteso un TypeError su `user.name`; il testo esatto dell'errore puo variare.
3. Apri il frame collegato a `src/profile.js`: `user` e `undefined`. Il difetto visibile si manifesta qui, ma la causa e nel chiamante.
4. Risali al callback in `src/main.js`. Verifica che il record contiene `user`, non `profile`.
5. Correggi la riga di assegnazione:

```js
const user = response.user;
```

6. Ripeti la build e ricarica l'anteprima. Il risultato atteso e **ADA**, senza eccezione.
7. Aggiungi un test per la forma del record e per il passaggio alla funzione.

Sostituire tutto con optional chaining e stringa vuota nasconderebbe questo errore di contratto, non lo correggerebbe. Su dati esterni servono anche validazione e gestione esplicita di assenza/errore.

Disattivando la risoluzione delle mappe in DevTools vedrai il file generato: nomi con hash, righe e colonne dipendono dalla build. Non copiare coordinate numeriche fisse da un esempio.

## Varianti

### Mappe private per error tracking

Procedura di distribuzione, da adattare al servizio scelto:

1. Genera bundle e mappe insieme, eventualmente con `sourcemap: "hidden"`.
2. Carica le mappe nel servizio autorizzato associandole alla release e agli asset corretti.
3. Pubblica il JavaScript esatto di quella build; escludi i `.map` dal pacchetto pubblico o negane l'accesso sull'hosting.
4. Verifica dall'esterno che una richiesta diretta alla URL di una mappa **non restituisca il contenuto della mappa**.
5. Genera un errore controllato e verifica la risoluzione nel servizio prima di considerare il setup completato.

Una risposta 200 puo essere un fallback HTML della SPA: controlla anche il corpo, non soltanto lo status. `robots.txt`, assenza di link e nomi difficili da indovinare non sono controlli di accesso.

In Vite 8 puoi escludere i testi incorporati con questa configurazione alternativa:

```js
import { defineConfig } from "vite";

export default defineConfig({
  build: {
    sourcemap: "hidden",
    rolldownOptions: {
      output: {
        sourcemapExcludeSources: true,
      },
    },
  },
});
```

Rimangono percorsi e mapping; il consumer deve poter reperire i sorgenti separatamente. Non e una cifratura e non autorizza a includere segreti nel codice client. Valuta quali sorgenti e dati invii anche al provider di monitoraggio.

### Node.js e stack registrati

Per un **bundle destinato a Node**, gia generato con una mappa corrispondente e disponibile:

```powershell
node --enable-source-maps dist/server.js
```

`server.js` e un percorso esemplificativo, **non il bundle browser del demo**. L'opzione aiuta Node a riscrivere gli stack; non e necessaria per il modulo JavaScript nativo non trasformato e non risolve mappe mancanti o sbagliate.

Nel browser, mostrare uno stack risolto in DevTools non implica che ogni stringa `error.stack` inviata al backend sia gia risolta. Il sistema di error tracking puo dover rimappare le coordinate generate separatamente. Non sovrascrivere gli artefatti di una release precedente mentre ci sono ancora client che li usano.

## Errori comuni

- Mappa mancante: controlla commento/header, URL, status e corpo della risposta.
- Righe sbagliate: verifica corrispondenza esatta fra release, bundle e mappa, inclusa la cache/CDN.
- File originale non mostrato: controlla `sourcesContent`, risoluzione dei percorsi e Developer Resources in DevTools.
- Breakpoint mai raggiunto: verifica pagina/processo/frame, ramo eseguito, Ignore List e ottimizzazioni.
- Errore non riprodotto: annota input, azione, ambiente, versione e rete; non affidarti solo allo stack.
- Pubblicare `.map` hidden ritenendoli protetti, oppure cercare di proteggere segreti con minificazione.
- Modificare il bundle generato per correggere il bug: modifica il sorgente e ricostruisci gli artefatti.

## Checklist

- Riproduzione minima con input e risultato atteso.
- Build e mappa della stessa release conservate insieme.
- Impostazioni source map e caricamento risorse controllati.
- Osservati input e chiamante, non solo riga finale dell'eccezione.
- Strategia pubblica/privata verificata anche con URL diretta.
- Fix nel sorgente, nuova build e test di regressione.
- Limiti delle ottimizzazioni e degli stack asincroni considerati.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Error Handling|Error Handling]]
- [[Programmazione/JavaScript/Pagine/Bundling e tree shaking|Bundling e tree shaking]]
- [[Programmazione/JavaScript/Pagine/Vite|Vite]]
- [[Programmazione/JavaScript/Pagine/Testing|Testing]]
- [[Programmazione/JavaScript/Pagine/Sicurezza|Sicurezza]]

## Fonti

Fonti ufficiali consultate il 2026-10-13. Configurazioni riferite a Vite 8.3.4.

- [ECMA-426: formato delle source map](https://tc39.es/ecma426/).
- [MDN: source map](https://developer.mozilla.org/en-US/docs/Glossary/Source_map).
- [Chrome DevTools: sorgenti originali e mappe](https://developer.chrome.com/docs/devtools/javascript/source-maps).
- [Chrome DevTools: breakpoint ed eccezioni](https://developer.chrome.com/docs/devtools/javascript/breakpoints).
- [Chrome DevTools: diagnosi e caricamento delle mappe](https://developer.chrome.com/docs/devtools/developer-resources).
- [Vite: build.sourcemap](https://vite.dev/config/build-options#build-sourcemap).
- [Rolldown: esclusione di sourcesContent](https://rolldown.rs/reference/OutputOptions.sourcemapExcludeSources).
- [Node.js: supporto source map negli stack](https://nodejs.org/api/cli.html#--enable-source-maps).
- [Node.js: SourceMap e coordinate](https://nodejs.org/api/module.html#class-modulesourcemap).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
