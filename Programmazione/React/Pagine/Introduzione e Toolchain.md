---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - react
  - frontend
  - javascript
  - toolchain
aliases:
  - Introduzione React
  - Toolchain React
  - Vite React
prerequisites:
  - "[[Programmazione/JavaScript/Pagine/Moduli|Moduli JavaScript]]"
  - "[[Programmazione/JavaScript/Pagine/Vite|Vite]]"
related:
  - "[[Programmazione/React/Indice React|Indice React]]"
title: Introduzione e Toolchain
---

# Introduzione e Toolchain

## Sintesi

React descrive interfacce come funzioni dei dati: props, stato e contesto. React DOM collega questa descrizione al DOM del browser; una toolchain trasforma JSX e moduli in file distribuibili.

**React non include da solo routing, backend, cache delle richieste o autenticazione.** Cambiare una normale variabile non notifica React: occorre un aggiornamento riconosciuto, per esempio tramite un setter di stato.

## Quando usarlo

Utile per interfacce con interazioni, viste riusabili e dati condivisi. Per una pagina prevalentemente statica, HTML e JavaScript possono bastare. La documentazione React propone un framework per nuove applicazioni complete; partire con Vite resta utile per imparare o quando vuoi scegliere separatamente routing e gestione dati.

Questa nota costruisce una piccola app **client-side**, non un'app SSR o un backend. JavaScript, moduli, npm e DOM sono prerequisiti.

## Come funziona

| Parte | Responsabilita |
| --- | --- |
| React | Componenti, stato e descrizione della UI |
| React DOM | Root e aggiornamento del DOM |
| JSX | Sintassi trasformata prima dell'esecuzione |
| Vite e plugin React | Dev server, trasformazione JSX, Fast Refresh e build |
| ESLint, test, controllo tipi | Verifiche distinte, da configurare |

Un aggiornamento puo provocare un nuovo render dei componenti; il commit applica al DOM le modifiche necessarie. Render non significa ricreare tutta la pagina. Non eseguire richieste o mutazioni esterne durante il render.

### Avvio da template

Da una cartella di lavoro, **non dentro un progetto esistente con lo stesso nome**:

```bash
npm create vite@latest my-app -- --template react
```

```bash
cd my-app
```

```bash
npm install
```

```bash
npm run dev
```

Il generatore scarica ed esegue codice npm; usa il pacchetto ufficiale. `@latest` cambia nel tempo: controlla il package.json generato, i requisiti Node e conserva il lockfile. Il template TypeScript si seleziona con `--template react-ts`.

### Prerequisiti del progetto seguente

Alternativa al template, non una seconda procedura da sovrapporgli. Esempio verificato con **Node 24.14.0, React/React DOM 19.3.0, Vite 8.3.4 e plugin React 6.1.2**. Vite 8 richiede una versione Node compatibile (20.19+, 22.12+ nelle rispettive linee); scegli una linea ancora supportata, non soltanto il minimo tecnico.

## API / Sintassi

Root client:

```jsx
import { createRoot } from "react-dom/client";

const container = document.getElementById("root");
if (!container) throw new Error("Contenitore #root assente");

const root = createRoot(container);
root.render(<h1>Appunti React</h1>);
```

E uno schema indipendente, non da aggiungere al main seguente. Crea la root una volta per contenitore; non a ogni click. Per HTML gia generato con React sul server si usa `hydrateRoot`, non questo avvio.

## Esempio pratico

Crea una cartella vuota con questi cinque file. Non serve un backend o un asset remoto.

```text
my-app/
  package.json
  vite.config.js
  index.html
  src/
    main.jsx
    App.jsx
```

`package.json`:

```json
{
  "name": "react-notes-demo",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "19.3.0",
    "react-dom": "19.3.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "6.1.2",
    "vite": "8.3.4"
  }
}
```

`vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
});
```

`index.html`:

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Appunti React</title>
    <link rel="icon" href="data:," />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

`src/main.jsx`:

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

const container = document.getElementById("root");
if (!container) throw new Error("Contenitore #root assente");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

`src/App.jsx`:

```jsx
import { useState } from "react";

export default function App() {
  const [count, setCount] = useState(0);
  return (
    <main>
      <h1>Appunti React</h1>
      <button type="button" onClick={() => setCount((current) => current + 1)}>
        Click: {count}
      </button>
    </main>
  );
}
```

Dalla cartella del progetto, installa le dipendenze:

```bash
npm install
```

Avvia lo sviluppo e apri l'URL stampato da Vite:

```bash
npm run dev
```

In un altro terminale, dalla stessa cartella, genera la build:

```bash
npm run build
```

Controlla i file generati con un server locale:

```bash
npm run preview
```

La build produce `dist/`; non aprire direttamente index.html con file://. Preview serve a controllare la build, non e una configurazione di hosting per la produzione. Con un lockfile gia presente, `npm ci` reinstalla le versioni bloccate e sostituisce node_modules.

## Varianti

- Framework come Next.js o React Router in modalita framework integrano altre responsabilita; controlla il modello di rendering scelto.
- TypeScript aggiunge controlli statici, non validazione runtime dei dati remoti. Vite non sostituisce il type checker.
- React Native usa un renderer diverso da React DOM: niente elementi HTML come div.
- Nel progetto minimale non c'e uno script lint: aggiungilo con dipendenze e flat config ESLint reali, seguendo la nota dedicata. Compilare non dimostra correttezza logica o accessibilita.
- In app piu grandi separa components, features e styles quando hanno una responsabilita concreta; non servono cartelle vuote per iniziare.

## Errori comuni

- Root null: id HTML diverso o script eseguito senza il contenitore previsto.
- Pagina vuota sotto una sottocartella: verifica `base` in Vite e i percorsi degli asset. Le route client richiedono anche una strategia di hosting.
- Segreti in variabili VITE_: i valori inclusi nel bundle sono pubblici.
- Log doppi in sviluppo: StrictMode aggiunge controlli su render ed effect; non rimuoverlo per nascondere un render impuro. Non implica che ogni evento utente venga eseguito due volte.
- Confondere Fast Refresh con persistenza: un reload completo perde questo stato locale.

## Checklist

- Node e dipendenze compatibili, React e React DOM allineati?
- Installazione riproducibile dal lockfile e build riuscita?
- Root presente e JSX trasformato dalla toolchain?
- Test, lint e controllo tipi distinti dalla build?
- Hosting coerente con base, route e assenza/presenza di un server?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/JavaScript/Pagine/Vite|Vite]]
- [[Programmazione/React/Pagine/JSX|JSX]]
- [[Programmazione/React/Pagine/Componenti Funzionali vs Componenti a Classe|Componenti funzionali e a classe]]
- [[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props e flusso dati]]
- [[Programmazione/React/Pagine/Framework Next.js e Remix|Framework]]
- [[Programmazione/React/Pagine/Linting e Formattazione|Linting e formattazione]]

## Fonti

- [React: creare un'app](https://react.dev/learn/creating-a-react-app).
- [React: partire da una toolchain](https://react.dev/learn/build-a-react-app-from-scratch).
- [React DOM: createRoot](https://react.dev/reference/react-dom/client/createRoot).
- [React: render e commit](https://react.dev/learn/render-and-commit).
- [React: StrictMode](https://react.dev/reference/react/StrictMode).
- [Vite: guida e requisiti](https://vite.dev/guide/).

Documentazione consultata il 2026-10-14; le versioni provate sono indicate sopra.
