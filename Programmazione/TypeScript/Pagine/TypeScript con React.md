---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - typescript
  - react
  - frontend
  - props
  - hooks
aliases:
  - React con TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
  - "[[Programmazione/TypeScript/Pagine/Generics]]"
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
related:
  - "[[Programmazione/TypeScript/Pagine/TypeScript con Next.js]]"
  - "[[Programmazione/TypeScript/Pagine/API tipizzate]]"
title: TypeScript con React
---

# TypeScript con React

## Sintesi

TypeScript rende espliciti props, stato, eventi e callback di React. Il checker controlla il codice; React esegue i componenti e aggiorna il DOM. Un tipo non valida una risposta HTTP e non impedisce mutazioni a runtime.

Baseline del progetto: **TypeScript 5.9.3**, **React/React DOM 19.3.0**, tipi React **19.3.0**, **Vite 8.3.4**, plugin React **6.1.2**, **Node 24.14.0**. E una piccola app client, non un framework SSR.

## Quando usarlo

- Componenti condivisi con contratti di props e callback.
- Form, selezioni e stati che ammettono piu varianti.
- Hook custom e ref verso elementi DOM.
- Refactor di interfacce che consumano dati validati.

## Come funziona

I file con JSX hanno estensione `.tsx`. Il runtime JSX automatico non richiede `import React` in ogni file; gli hook e i tipi usati vanno comunque importati. `import type` non produce un import runtime.

Vite trasforma TypeScript ma **non esegue il type checking**. Il comando build qui esegue prima `tsc`: una build Vite isolata non prova la correttezza dei tipi.

## API / Sintassi

Crea questi file in un progetto dimostrativo separato dal vault.

`package.json`:

```json
{
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "check": "tsc --noEmit",
    "build": "tsc --noEmit && vite build"
  },
  "dependencies": { "react": "19.3.0", "react-dom": "19.3.0" },
  "devDependencies": {
    "typescript": "5.9.3",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "vite": "8.3.4",
    "@vitejs/plugin-react": "6.1.2"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "strict": true,
    "noEmit": true,
    "isolatedModules": true,
    "verbatimModuleSyntax": true,
    "types": ["vite/client"]
  },
  "include": ["src"]
}
```

`vite.config.js`:

```javascript
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({ plugins: [react()] });
```

`index.html`:

```html
<!doctype html>
<html lang="it">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Selezione utenti</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

## Esempio pratico

`src/App.tsx`:

```tsx
import { useRef, useState } from "react";
import type { ChangeEvent } from "react";

type User = { id: string; email: string };
type UserListProps = {
  users: readonly User[];
  onSelect: (user: User) => void;
};

export function UserList({ users, onSelect }: UserListProps) {
  return (
    <ul>
      {users.map((user) => (
        <li key={user.id}>
          <button type="button" onClick={() => onSelect(user)}>
            {user.email}
          </button>
        </li>
      ))}
    </ul>
  );
}

const users: readonly User[] = [
  { id: "u1", email: "ada@example.test" },
  { id: "u2", email: "lin@example.test" },
];

export default function App() {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<User | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const visible = users.filter((user) => user.email.includes(query));

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    setQuery(event.currentTarget.value);
  }

  return (
    <main>
      <h1>Selezione utenti</h1>
      <label htmlFor="query">Filtra per email</label>
      <input id="query" ref={inputRef} value={query} onChange={handleChange} />
      <button type="button" onClick={() => inputRef.current?.focus()}>
        Vai al filtro
      </button>
      <UserList users={visible} onSelect={setSelected} />
      <p role="status">
        {selected ? "Selezionato: " + selected.email : "Nessuna selezione"}
      </p>
    </main>
  );
}
```

`src/main.tsx`:

```tsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

const container = document.getElementById("root");
if (!container) throw new Error("Missing root element");

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

Installare:

```sh
npm install
```

Avviare:

```sh
npm run dev
```

Controllare e generare il bundle:

```sh
npm run build
```

Conserva il lockfile; usa `npm ci` nelle installazioni successive. La configurazione controlla `src`, non il file di config JavaScript. I dati sono locali e non viene contattato un backend.

### Scelte di tipo e comportamento

- `useState("")` inferisce `string`; l'iniziale `null` richiede `User | null` per ammettere una futura selezione. Per un array inizialmente vuoto, annota il tipo degli elementi.
- `currentTarget` e l'input che gestisce l'evento; `target` puo riferirsi a un discendente in altri contesti. Un handler inline spesso permette inferenza automatica.
- La ref puo essere `null` prima del mount o dopo lo smontaggio: niente assertion `!` per nasconderlo.
- `readonly User[]` vieta modifiche all'array attraverso quella vista, non congela gli utenti.
- Gli ID devono essere unici e stabili; il tipo `string` non prova questa proprieta.
- Cambiare filtro non cancella la selezione: e una scelta della UI, non un effetto del typing.

## Varianti

`ReactNode` descrive contenuto renderizzabile, non solo un elemento JSX. Dichiara `children` quando fa parte del contratto. `ComponentPropsWithoutRef<"button">` puo riusare props native; definisci quali campi un wrapper espone o sostituisce.

Per un reducer, usa una union discriminata delle azioni e un controllo esaustivo. Per Context opzionali, distingui assenza di provider e valore valido. Un custom hook puo esporre tipi inferiti o espliciti senza ricorrere a `any`.

`React.FC` e facoltativo: non e una protezione runtime e non e obbligatorio per componenti moderni. Con React 19 e relativi tipi una ref puo essere una prop; non applicare alla cieca esempi `forwardRef` di versioni differenti.

## Errori comuni

- Confondere trasformazione JSX con controllo dei tipi.
- Usare `any`, cast o non-null assertion per nascondere uno stato possibile.
- Annotare una risposta API senza validarla.
- Credere che readonly sia un freeze o che una callback `void` attenda una Promise.
- Duplicare il significato degli stati con booleani incompatibili.

## Checklist

- Compilo TSX con tipi React compatibili e strict?
- La CI esegue anche il checker?
- Null, array vuoti, eventi e ref sono modellati?
- Props e callback corrispondono al comportamento reale?
- I dati esterni sono validati prima della UI?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/TypeScript con Next.js|TypeScript con Next.js]]
- [[Programmazione/TypeScript/Pagine/API tipizzate|API tipizzate]]
- [[Programmazione/TypeScript/Pagine/Discriminated Unions|Discriminated Unions]]
- [[Programmazione/React/Pagine/Introduzione e Toolchain|React: introduzione e toolchain]]

## Fonti

- [React - Using TypeScript](https://react.dev/learn/typescript)
- [React - useRef](https://react.dev/reference/react/useRef)
- [Vite - TypeScript e transpile only](https://vite.dev/guide/features.html#typescript)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
