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
  - tooling
  - frontend
aliases: []
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Moduli|Moduli]]"
  - "[[Programmazione/JavaScript/Pagine/Node.js Basics|Node.js Basics]]"
related:
  - "[[Programmazione/JavaScript/Pagine/Bundling e tree shaking|Bundling e tree shaking]]"
  - "[[Programmazione/JavaScript/Pagine/ESLint|ESLint]]"
title: Vite
---

# Vite

## Sintesi

**Vite** e una toolchain frontend: server di sviluppo, trasformazione dei sorgenti e build di file distribuibili. Non e un framework UI, un backend applicativo o un hosting.

Riferimento dell'esempio: **Vite 8.3.4**, provato con Node.js 24.14.0. Il package dichiara Node `^20.19.0 || >=22.12.0`; per nuovi progetti scegli una linea Node ancora supportata, non soltanto il minimo accettato. I plugin possono avere requisiti ulteriori.

## Quando usarlo

- Applicazioni vanilla o framework con integrazione Vite.
- Prototipi e strumenti interni che richiedono moduli, CSS e build.
- Librerie frontend, con una configurazione dedicata.

Per una semplice pagina senza trasformazioni puo bastare un server statico. Se usi un framework full-stack, segui la sua toolchain: potrebbe gia integrare Vite. Aggiungere un secondo progetto Vite non e automaticamente necessario.

## Come funziona

### Sviluppo, build e anteprima

| Fase | Comando | Risultato |
| --- | --- | --- |
| Sviluppo | `vite` | Server con moduli trasformati su richiesta e aggiornamenti |
| Build | `vite build` | Output statico in `dist/` per il progetto client di questa nota |
| Anteprima | `vite preview` | Server locale che serve la build gia generata |

In sviluppo il browser usa ES modules; Vite trasforma i sorgenti e prepara le dipendenze quando necessario. Non significa che ogni file di ogni dipendenza venga sempre servito senza elaborazione.

**Vite 8 usa Rolldown per il bundling e Oxc per trasformazioni JavaScript/TypeScript.** Guide delle major precedenti che descrivono sempre Rollup/esbuild non vanno applicate meccanicamente alla configurazione corrente.

### HMR e limiti dei controlli

Hot Module Replacement aggiorna moduli supportati senza ricaricare l'intera pagina. Gli aggiornamenti CSS sono un caso comune; per componenti React/Vue servono le rispettive integrazioni. Un modulo senza un confine HMR valido puo provocare un reload completo: mantenere lo stato non e garantito.

Vite trasforma TypeScript, ma **non esegue automaticamente il type checking**. Prevedi `tsc --noEmit` in un progetto TypeScript configurato, ESLint e i test come controlli separati. Una build riuscita non prova la correttezza funzionale.

## API / Sintassi

### Root e configurazione

`index.html` e un sorgente nella root del progetto, non in `public/`. Gli script `type="module"` entrano nel grafo della build. La root predefinita e la directory di avvio; la configurazione viene cercata li.

Un file `vite.config.js` puo esportare `defineConfig({...})`. L'helper migliora la descrizione dei tipi; non e indispensabile per una configurazione semplice.

### Asset e percorso di pubblicazione

- CSS importato da JavaScript entra nella pipeline: in sviluppo viene aggiornato, nella build puo essere estratto.
- Un asset importato dal sorgente produce un URL gestito da Vite, con hashing o inlining secondo configurazione.
- `public/` contiene file copiati senza trasformazione, per esempio `robots.txt`: non metterci segreti.
- `base` rappresenta il prefisso pubblico, per esempio `/appunti/`. Per URL costruiti nel codice usa `import.meta.env.BASE_URL`; non scrivere arbitrariamente `/assets/...`.

Vite riscrive i riferimenti che riconosce, non tutte le stringhe o le URL delle API. Il percorso del backend e una decisione distinta dal percorso degli asset.

## Esempio pratico

Piccola applicazione vanilla senza dipendenze runtime. Tutti i file seguenti stanno in **un nuovo progetto di prova**, non nella root di un repository esistente.

### Struttura

```text
vite-demo/
  public/
    info.txt
  src/
    main.js
    style.css
  .env
  .env.production
  .gitignore
  index.html
  package.json
  package-lock.json
  vite.config.js
```

Il lockfile verra generato da npm. `node_modules/` e `dist/` non sono sorgenti da scrivere manualmente.

### Package e configurazione

`package.json`:

```json
{
  "name": "vite-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
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
  base: "/appunti/",
  server: {
    host: "127.0.0.1",
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    strictPort: true,
  },
});
```

Qui `base` simula un sito sotto una sottocartella; per pubblicazione alla root usa `"/"`. `strictPort` rende evidente una porta occupata invece di passare silenziosamente alla successiva. L'ascolto loopback evita di esporre il server alla rete locale.

`.gitignore`:

```text
node_modules/
dist/
*.local
```

### Ambiente pubblico

`.env` contiene soltanto dati pubblici:

```dotenv
VITE_APP_TITLE=Contatore locale
```

`.env.production`:

```dotenv
VITE_APP_TITLE=Contatore pubblicato
```

`public/info.txt`:

```text
Demo Vite: nessun dato persistente.
```

### HTML, JavaScript e CSS

`index.html`:

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Demo Vite</title>
  </head>
  <body>
    <main>
      <h1 id="title"></h1>
      <p id="mode"></p>
      <button id="increment" type="button">Incrementa</button>
      <output id="count" aria-live="polite">0</output>
      <p><a id="info">Informazioni</a></p>
    </main>
    <script type="module" src="/src/main.js"></script>
  </body>
</html>
```

`src/main.js`:

```js
import "./style.css";

const title = import.meta.env.VITE_APP_TITLE || "Contatore";
document.querySelector("#title").textContent = title;
document.title = title;
document.querySelector("#mode").textContent =
  "Modalita: " + import.meta.env.MODE;
document.querySelector("#info").href =
  import.meta.env.BASE_URL + "info.txt";

let count = 0;
document.querySelector("#increment").addEventListener("click", () => {
  count += 1;
  document.querySelector("#count").textContent = String(count);
});
```

Il contratto richiede l'HTML sopra, con gli elementi presenti. Il contatore e solo memoria della pagina: si azzera al reload e non e un modello di persistenza. `textContent` inserisce il titolo come testo, non come HTML.

`src/style.css`:

```css
body {
  margin: 0;
  color: #202124;
  background: #ffffff;
  font: 1rem/1.5 system-ui, sans-serif;
}
main {
  max-width: 42rem;
  margin: 2rem auto;
  padding: 0 1rem;
  overflow-wrap: anywhere;
}
button {
  padding: 0.5rem 1rem;
  font: inherit;
}
output {
  display: inline-block;
  min-width: 4ch;
  margin-left: 1rem;
}
a {
  color: #086b57;
}
```

### Installazione e verifica

Dalla directory `vite-demo/`, dopo aver creato i file:

```powershell
npm install
```

Conserva il lockfile. Su una nuova macchina o in CI, con il lockfile gia versionato, usa `npm ci` al posto di `npm install`.

Avvia lo sviluppo:

```powershell
npm run dev
```

Apri `http://127.0.0.1:5173/appunti/`: titolo locale, modalita development e pulsante funzionante. Termina il server con Ctrl+C quando non serve.

Genera la build:

```powershell
npm run build
```

**La build puo svuotare `dist/` quando e interna alla root.** Usala solo per output rigenerabili, mai come archivio di sorgenti o file personali.

Servi l'output appena creato:

```powershell
npm run preview
```

Apri `http://127.0.0.1:4173/appunti/`: titolo pubblicato, modalita production e link a `/appunti/info.txt`. L'anteprima non ricompila quando cambi i sorgenti: ripeti la build. Non aprire `dist/index.html` con `file://`.

## Varianti

### Variabili e modalita

`import.meta.env.VITE_*` espone **stringhe pubbliche**; `"false"` non e il booleano `false`. Le costanti integrate `DEV` e `PROD` sono invece booleane.

I file del mode prevalgono sui generici; variabili gia presenti nell'ambiente del processo prevalgono sui file. Riavvia il dev server dopo modifiche ai file env. `.env.local` e `.env.[mode].local` vanno esclusi esplicitamente da Git: il nome da solo non li rende privati.

```powershell
npm run build -- --mode staging
```

Questo usa il mode `staging` e l'eventuale `.env.staging`, ma resta normalmente una build production: mode e `NODE_ENV` non sono sinonimi. I valori vengono incorporati nella build client, non letti dal server di hosting a ogni richiesta. Cambiarli dopo il deploy richiede una nuova build o un meccanismo runtime progettato separatamente.

Non mettere credenziali in `VITE_*`; anche un `define` improprio puo esporle. Il backend deve custodire i segreti. Nella configurazione Node, quando servono i file env, usa `loadEnv(mode, directory, prefix)`: non presumere che siano gia tutti caricati durante la valutazione della config.

### Framework, proxy e distribuzione

I template di create-vite aiutano a iniziare con React, Vue, Svelte o vanilla; versione del generatore e versione di Vite non sono necessariamente uguali. Il percorso manuale sopra evita dipendenze implicite: il template di un framework richiede anche plugin e pacchetti propri.

`server.proxy` inoltra richieste di sviluppo a un backend; non crea quel backend e non configura il reverse proxy dell'hosting. Con una base non relativa, considera anche il prefisso nei percorsi del proxy. Non disabilitare indiscriminatamente `allowedHosts` o CORS per risolvere un errore locale.

Per una SPA statica distribuisci il contenuto di `dist/` su un hosting configurato per il percorso corretto. **`vite preview` non e il server di produzione.** Un router client con URL pulite richiede regole di fallback sul server: `base` non risolve da sola il refresh di `/appunti/utenti/42`.

Library mode, SSR e plugin sono estensioni distinte: SSR richiede entry point e runtime server appropriati, non e attivato dal solo comando build del demo.

## Errori comuni

- Build verde ma errori di tipo: manca il controllo TypeScript separato.
- API `fs`, `process` o Buffer nel browser: Vite non fornisce automaticamente un runtime Node.
- Pagina vuota dopo deploy: controlla base, richieste asset, MIME e percorso pubblicato.
- Funziona in dev ma non in produzione: prova la build con il mode effettivo.
- Cambi un env sull'hosting statico e non cambia il titolo: il valore e gia nel bundle.
- Assumere compatibilita con ogni browser: il target di build trasforma sintassi supportata, non aggiunge automaticamente tutte le Web API mancanti o i polyfill necessari.
- Copiare `index.html` senza gli asset oppure pubblicare i sorgenti al posto di `dist/`.

## Checklist

- Runtime Node compatibile e supportato, dipendenze e lockfile versionati.
- Entry HTML, script module e percorsi coerenti.
- Nessun segreto nei file pubblici o nei valori incorporati.
- Lint, tipi e test separati dalla build.
- Verificati sviluppo, build e anteprima con base reale.
- Output rigenerabile, niente dati manuali in `dist/`.
- Controllati refresh delle route, asset e compatibilita browser sull'hosting finale.

## Collegamenti

- [[Programmazione/JavaScript/Pagine/Moduli|Moduli]]
- [[Programmazione/JavaScript/Pagine/Bundling e tree shaking|Bundling e tree shaking]]
- [[Programmazione/JavaScript/Pagine/Source maps e debugging|Source maps e debugging]]
- [[Programmazione/JavaScript/Pagine/SPA e routing lato client|SPA e routing lato client]]
- [[Programmazione/JavaScript/Pagine/ESLint|ESLint]]
- [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain React]]

## Fonti

Documentazione ufficiale consultata il 2026-10-13; esempio riferito a Vite 8.3.4.

- [Avvio e root del progetto](https://vite.dev/guide/).
- [Configurazione e loadEnv](https://vite.dev/config/).
- [Trasformazioni, TypeScript e CSS](https://vite.dev/guide/features).
- [HMR API](https://vite.dev/guide/api-hmr).
- [Asset statici e public](https://vite.dev/guide/assets).
- [Variabili ambiente e mode](https://vite.dev/guide/env-and-mode).
- [Build, base e compatibilita](https://vite.dev/guide/build).
- [Opzioni di build e pulizia outDir](https://vite.dev/config/build-options).
- [Server, host e proxy](https://vite.dev/config/server-options).
- [Distribuzione e limiti di preview](https://vite.dev/guide/static-deploy).

## Navigazione

- [[Programmazione/JavaScript/Indice JavaScript|Indice JavaScript]]
