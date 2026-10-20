---
date: 2026-06-04
area: Programmazione
topic: React
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - react
  - compiler
  - performance
aliases:
  - React Compiler
prerequisites:
  - "[[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]"
  - "[[Programmazione/React/Pagine/useMemo e useCallback|Memoizzazione manuale]]"
related:
  - "[[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]"
  - "[[Programmazione/React/Pagine/Linting e Formattazione|Linting e Formattazione]]"
title: React Compiler
---

# React Compiler

## Sintesi

React Compiler analizza componenti e hook durante la build e genera memoizzazione dei calcoli e del JSX che puo riutilizzare in sicurezza. Puo ridurre l'uso manuale di `useMemo`, `useCallback` e `memo`; installare soltanto `react` non abilita questa trasformazione.

La correttezza resta a carico del codice: purezza, immutabilita e Rules of Hooks non sono facoltative. La cache generata e un'ottimizzazione, non un database, una cache HTTP o un contratto su quante volte verra chiamato il componente.

## Quando usarlo

E utile per ridurre il lavoro ripetuto durante aggiornamenti e la manutenzione della memoizzazione manuale. In una codebase esistente parti da una parte limitata, con test e misure prima/dopo. Non risolve un primo render costoso, una query lenta, troppi nodi DOM o un algoritmo inefficiente soltanto perche e presente nella build.

## Come funziona

Il plugin legge il sorgente prima delle trasformazioni che eliminano le informazioni necessarie all'analisi. Produce codice che conserva risultati finche i valori da cui dipendono restano compatibili. Non crea una cache globale condivisa fra tutte le istanze e non sostituisce lo stato applicativo.

Un componente non ottimizzabile puo essere saltato; alcuni errori di configurazione o compilazione possono invece far fallire la build. Build riuscita non significa "tutti i componenti compilati". Le diagnostiche di `eslint-plugin-react-hooks` aiutano a individuare violazioni anche senza attivare il Compiler: lint e trasformazione sono strumenti distinti.

## API / Sintassi

### Configurazione Vite verificabile

Parti dal progetto completo di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]: React/React DOM 19.3.0, Vite 8.3.4 e `@vitejs/plugin-react` 6.1.2. I comandi si eseguono nella root dell'app di esempio, **non nella cartella Quartz `site`**. Installa le dipendenze di sviluppo e conserva il lockfile:

```bash
npm install --save-dev --save-exact babel-plugin-react-compiler@1.0.0 @rolldown/plugin-babel@0.2.4 @babel/core@7.29.0
```

Sostituisci `vite.config.js` con questa configurazione. La modalita `annotation` limita la trasformazione alle funzioni che dichiarano `"use memo"`:

```js
import { defineConfig } from "vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

export default defineConfig({
  plugins: [
    react(),
    babel({
      presets: [reactCompilerPreset({ compilationMode: "annotation", target: "19" })],
    }),
  ],
});
```

Con plugin-react 6 non usare il vecchio parametro `react({ babel: ... })`: e stato rimosso. In una pipeline Babel personalizzata, il Compiler deve precedere le altre trasformazioni del sorgente. L'integrazione sopra usa il preset previsto per Vite 8; non aggiungere un secondo plugin Compiler in un'altra configurazione.

### Modalita e compatibilita

| Opzione o direttiva | Significato |
| --- | --- |
| `compilationMode: "annotation"` | Opt-in sulle funzioni annotate |
| `"use memo"` | Direttiva all'inizio del corpo della funzione da compilare; da sola non installa il Compiler |
| `"use no memo"` | Esclude temporaneamente una funzione dalla trasformazione |
| Modalita predefinita `infer` | Individua automaticamente componenti e hook secondo le euristiche del Compiler |
| `target: "19"` | Runtime del Compiler fornito da React 19 |

Per React 17/18 servono target coerente e `react-compiler-runtime`; non copiare questa configurazione come se bastasse su ogni versione. Per un framework usa l'integrazione documentata dal framework. Le direttive qui non hanno relazione con `"use client"` e `"use server"`.

## Esempio pratico

Sostituisci `src/App.jsx`. Il catalogo e locale e non rappresenta una richiesta HTTP. Il demo deve funzionare sia con sia senza Compiler:

```jsx
import { useId, useState } from "react";

const products = [
  { id: "notebook", name: "Quaderno", priceCents: 1250 },
  { id: "mouse", name: "Mouse", priceCents: 2500 },
  { id: "keyboard", name: "Tastiera", priceCents: 5000 },
];

export function ProductList({ items }) {
  "use memo";
  const totalCents = items.reduce((total, item) => total + item.priceCents, 0);
  return (
    <section aria-label="Catalogo filtrato">
      <p>Totale EUR: {(totalCents / 100).toFixed(2)}</p>
      <ul>{items.map((item) => <li key={item.id}>{item.name}</li>)}</ul>
    </section>
  );
}

export function CatalogLabel() {
  "use no memo";
  return <p>Catalogo dimostrativo locale</p>;
}

export default function CatalogDemo() {
  "use memo";
  const inputId = useId();
  const [query, setQuery] = useState("");
  const [compact, setCompact] = useState(false);
  const filtered = products.filter((item) =>
    item.name.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <div style={{ lineHeight: compact ? 1.25 : 1.8 }}>
      <CatalogLabel />
      <label htmlFor={inputId}>Cerca prodotti</label>
      <input id={inputId} value={query}
        onChange={(event) => setQuery(event.target.value)} />
      <button type="button" aria-pressed={compact}
        onClick={() => setCompact((value) => !value)}>
        Spaziatura compatta
      </button>
      <ProductList items={filtered} />
    </div>
  );
}
```

Il cambio di spaziatura non cambia la query: il Compiler puo riusare filtro e JSX dei risultati. La ricerca deve invece aggiornare righe e totale. `CatalogLabel` mostra solo come escludere una funzione; in codice reale documenta il motivo e una condizione per rimuovere l'esclusione. L'esclusione non impone un render: un parent ottimizzato puo comunque riusare il JSX che contiene quel componente.

Avvia lo sviluppo:

```bash
npm run dev
```

Verifica anche l'output di produzione:

```bash
npm run build
```

```bash
npm run preview
```

In DevTools cerca l'indicatore di memoizzazione dei componenti compilati; in un output non minificato puoi controllare l'uso del runtime e delle cache generate. Non scrivere a mano quel codice generato. La prova funzionale verifica risultati e interazioni; un miglioramento prestazionale richiede misure separate su un carico rappresentativo, non un semplice conteggio di `console.log` in sviluppo.

## Varianti

- **Adozione globale**: progetto gia compatibile.
- **Adozione incrementale**: solo file o funzioni annotate.
- **Gating**: rollout controllato da feature flag.
- **Compilazione librerie**: per autori di package.
- **Lint compiler-aware**: segnala pattern incompatibili.

Per estendere il demo alla rilevazione automatica, rimuovi `compilationMode: "annotation"` e lascia il target; `"use no memo"` continua a escludere la funzione. Il gating richiede un modulo di feature flag realmente implementato: non e una variabile magica fornita da React. Le librerie pubblicate devono includere output e dipendenze runtime compatibili con i consumatori.

## Errori comuni

- Usarlo per correggere codice impuro.
- Rimuovere memoization manuale senza misurare.
- Ignorare regole hooks e purezza.
- Abilitarlo su tutta una codebase legacy senza rollout.
- Non testare comportamento prima/dopo.

## Checklist

- Il progetto rispetta Rules of React?
- Le regole lint sono aggiornate?
- Esiste una strategia di rollout?
- I componenti critici sono testati?
- Le performance sono misurate?
- La documentazione ufficiale e stata verificata per versione e setup?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/useMemo e useCallback|useMemo e useCallback]]
- [[Programmazione/React/Pagine/Profiler e Debugging|Profiler e Debugging]]
- [[Programmazione/React/Pagine/Linting e Formattazione|Linting e Formattazione]]
- [[Programmazione/React/Pagine/Fiber Architecture e Concurrent Mode|Fiber Architecture e Concurrent Mode]]

## Fonti

- [React Compiler: introduzione e limiti](https://react.dev/learn/react-compiler/introduction).
- [Installazione e integrazione Vite](https://react.dev/learn/react-compiler/installation).
- [Adozione incrementale e gating](https://react.dev/learn/react-compiler/incremental-adoption).
- [Modalita di compilazione](https://react.dev/reference/react-compiler/compilationMode).
- [Direttiva use no memo](https://react.dev/reference/react-compiler/directives/use-no-memo).
- [Compatibilita del Compiler con le versioni React](https://react.dev/reference/react-compiler/target).
- Versioni del setup fissate sopra; ricontrolla documentazione e peer dependencies quando aggiorni la toolchain.
