---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: beginner
tags: [react, frontend, javascript, toolchain]
aliases: [Introduzione React, Toolchain React, Vite React]
prerequisites: []
related: []
---

# Introduzione e Toolchain

## Sintesi

React e una libreria JavaScript per costruire interfacce utente dichiarative e component-based. Invece di modificare manualmente il DOM, descrivi come la UI dovrebbe apparire in base a props e state; React aggiorna l'interfaccia quando quei dati cambiano.

La toolchain moderna serve a compilare JSX, gestire moduli, avviare un dev server, fare build di produzione, linting, test e integrazione con TypeScript.

## Quando usarlo

Usa React quando devi costruire UI interattive con stato locale, componenti riusabili e flussi dati chiari. E adatto a dashboard, SPA, applicazioni B2B, frontend complessi, design system e prodotti dove la UI cambia spesso in risposta a input utente o dati remoti.

Per pagine statiche semplici, React puo essere eccessivo. Per app full-stack moderne conviene spesso usare un framework sopra React, come Next.js o Remix.

## Come funziona

Un'app React e composta da componenti. Ogni componente riceve props, puo avere state e restituisce JSX.

```jsx
function Greeting({ name }) {
  return <h1>Ciao {name}</h1>;
}
```

La toolchain piu comune per iniziare e Vite:

```bash
npm create vite@latest my-app -- --template react
cd my-app
npm install
npm run dev
```

Vite gestisce dev server, hot module replacement e build ottimizzata.

## API / Sintassi

Script tipici in `package.json`:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "lint": "eslint ."
  }
}
```

Entry point tipico:

```jsx
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(<App />);
```

## Esempio pratico

Struttura minima:

```text
src/
  main.jsx
  App.jsx
  components/
  features/
  styles/
```

`App.jsx`:

```jsx
export default function App() {
  return (
    <main>
      <h1>Dashboard</h1>
    </main>
  );
}
```

## Varianti

- **Vite**: scelta leggera per SPA e componenti.
- **Next.js**: framework full-stack con routing, SSR, RSC e build integrata.
- **Remix**: framework web orientato a routing, loader/action e web standards.
- **TypeScript**: scelta comune per progetti React seri.
- **React Native**: usa React per applicazioni mobile native.

## Errori comuni

- Iniziare senza capire componenti, props e state.
- Mettere tutta la UI in `App.jsx`.
- Confondere React con un framework completo.
- Ignorare linting, formattazione e struttura progetto.
- Usare librerie di stato o routing prima che servano.
- Non distinguere ambiente di sviluppo e build di produzione.

## Checklist

- Il progetto ha una struttura leggibile?
- Gli script `dev`, `build` e `lint` funzionano?
- I componenti sono piccoli e nominati bene?
- La toolchain e adatta al tipo di app?
- Serve TypeScript fin dall'inizio?
- Serve un framework come Next.js invece di React puro?

## Collegamenti

- [[Programmazione/React/Indice react|Indice React]]
- [[JSX]]
- [[Componenti Funzionali vs Componenti a Classe]]
- [[Props e Flusso di dati unidirezionale]]
- [[Framework Next.js e Remix]]
- [[Programmazione/React/Pagine/Linting e Formattazione|Linting e Formattazione]]
