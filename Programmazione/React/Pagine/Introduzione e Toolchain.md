---
date: 2026-05-14
area: Programmazione
topic: React
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [react, frontend, javascript]
aliases: [Introduzione e Toolchain]
prerequisites: []
related: []
---
# Introduzione e Toolchain di React

## Sintesi

Nota su Introduzione e Toolchain in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.

**React** è una libreria JavaScript open-source sviluppata da Meta per la creazione di interfacce utente (UI) moderne, dinamiche e scalabili. Si basa sul concetto di **Componenti** e utilizza il **Virtual DOM** per ottimizzare le prestazioni delle applicazioni Single Page (SPA).

## 1. Perché React?

React ha rivoluzionato lo sviluppo frontend introducendo diversi concetti chiave:
- **Dichiaratività:** Definiamo *cosa* vogliamo vedere sullo schermo, e React si occupa di aggiornare il DOM in modo efficiente.
- **Component-Based:** L'interfaccia viene divisa in piccoli pezzi isolati e riutilizzabili chiamati componenti.
- **Unidirectional Data Flow:** I dati fluiscono in una sola direzione (dall'alto verso il basso), rendendo l'applicazione più prevedibile e facile da debuggare.

> [!INFO] Virtual DOM
> React crea una rappresentazione in memoria del DOM reale. Quando lo stato cambia, React confronta il nuovo Virtual DOM con quello precedente (processo di *Reconciliation*) e aggiorna solo gli elementi necessari nel DOM del browser (processo di *Diffing*), massimizzando la velocità.

---

## 2. La Toolchain Moderna

Per sviluppare con React oggi non basta un semplice file HTML. È necessaria una **toolchain** che gestisca la compilazione del codice (JSX, ES6+), l'ottimizzazione degli asset e lo sviluppo locale.

### Requisiti
- **Node.js:** L'ambiente di runtime necessario per eseguire gli strumenti di sviluppo (npm/yarn).
- **npm / yarn / pnpm:** Gestori di pacchetti per installare React e le sue dipendenze.

### Vite (Scelta Consigliata)
**Vite** è attualmente lo standard per iniziare nuovi progetti React. È estremamente veloce grazie all'uso di ES Modules nativi durante lo sviluppo.

```bash
# Introduzione e Toolchain di React

## Sintesi

Nota su Introduzione e Toolchain in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.
npm create vite@latest my-react-app -- --template react
```

### npx create-react-app (Legacy)
In passato, `create-react-app` (CRA) era lo strumento ufficiale. Oggi è considerato deprecato perché più lento e meno flessibile rispetto a Vite.

```bash
# Introduzione e Toolchain di React

## Sintesi

Nota su Introduzione e Toolchain in React. Riassume il concetto, quando usarlo, i punti critici e gli errori da evitare durante sviluppo, debugging o revisione di applicazioni React.
npx create-react-app my-app
```

---

## 3. Struttura di un Progetto React

Un progetto standard generato con Vite ha la seguente struttura:

- `index.html`: Il punto di ingresso dell'applicazione (contiene il `<div id="root"></div>`).
- `src/main.jsx`: Il file JavaScript principale che "monta" l'applicazione React nel DOM.
- `src/App.jsx`: Il componente radice della tua applicazione.
- `package.json`: Contiene le dipendenze e gli script di avvio (`npm run dev`).

---
