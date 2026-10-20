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
  - jsx
  - frontend
aliases:
  - JSX
prerequisites:
  - "[[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]]"
related:
  - "[[Programmazione/React/Indice React|Indice React]]"
title: JSX
---

# JSX

## Sintesi

JSX e un'estensione sintattica di JavaScript, non HTML e non un linguaggio interpretato direttamente dal browser. La toolchain la trasforma in espressioni JavaScript che costruiscono elementi React: descrizioni della UI, non nodi DOM gia inseriti.

Con il runtime JSX automatico non serve importare React solo per scrivere tag; devi comunque importare hook e API usate. React puo essere usato anche senza JSX, per esempio con createElement.

## Quando usarlo

Per descrivere markup dinamico e composizione dei componenti. Le condizioni e le trasformazioni dei dati restano JavaScript: estrai prima i passaggi che renderebbero il markup difficile da leggere.

Gli esempi sono per React DOM 19.3.0 e una toolchain JSX, come il progetto di [[Programmazione/React/Pagine/Introduzione e Toolchain|Introduzione e Toolchain]].

## Come funziona

### Tag, espressioni e attributi

- Tag minuscoli come button indicano elementi DOM; nomi maiuscoli come UserCard indicano componenti definiti o importati.
- Chiudi tutti i tag, anche input e img. Per piu elementi adiacenti usa un contenitore o un Fragment.
- Le graffe contengono espressioni: valori, chiamate, map e ternari. Un if o un for va prima del return, non direttamente tra graffe nel markup.
- className e htmlFor seguono i nomi React DOM; aria-* e data-* conservano i trattini.
- Gli handler ricevono funzioni: onClick={handleClick}, non onClick={handleClick()}, salvo che quest'ultima sia intenzionalmente una factory.

Schema con callback passata dal chiamante:

```jsx
export function SaveButton({ disabled = false, onSave }) {
  return (
    <button type="button" className="primary" disabled={disabled} onClick={onSave}>
      Salva
    </button>
  );
}
```

Il contratto richiede un booleano e una funzione. `disabled="false"` e una stringa, non il booleano false.

### Children e sicurezza

Stringhe e numeri sono contenuto testuale; elementi e array di elementi descrivono UI. null, undefined e booleani non producono testo. **Zero viene visualizzato.** Un oggetto ordinario non e un child valido: scegli un suo campo oppure serializzalo per una vista di debug.

Le stringhe interpolate non diventano markup HTML. Questo protegge quel contesto testuale, non valida URL, autorizzazioni o HTML passato a dangerouslySetInnerHTML. Non usare quest'ultima API per aggirare l'escaping di dati non fidati.

## API / Sintassi

Esempi separati, con i dati ricevuti tramite props.

Condizione booleana esplicita:

```jsx
export function ResultCount({ count }) {
  return <p>{count > 0 ? `${count} risultati` : "Nessun risultato"}</p>;
}
```

Fragment e lista con key sul nodo restituito direttamente da map:

```jsx
import { Fragment } from "react";

export function Glossary({ entries }) {
  return (
    <dl>
      {entries.map((entry) => (
        <Fragment key={entry.id}>
          <dt>{entry.term}</dt>
          <dd>{entry.definition}</dd>
        </Fragment>
      ))}
    </dl>
  );
}
```

Contratto: array di record con id stabili e univoci nella lista. La forma breve `<>...</>` non accetta key; Fragment non aggiunge un wrapper DOM.

Stile come oggetto, non stringa CSS:

```jsx
export function Toolbar({ children }) {
  return <div style={{ display: "flex", gap: 8, opacity: 0.9 }}>{children}</div>;
}
```

Le due graffe sono due costrutti distinti: espressione JSX e oggetto JavaScript. React aggiunge px a molte proprieta numeriche dimensionali, non a quelle senza unita come opacity. Per percentuali o rem passa una stringa.

## Esempio pratico

File `src/App.jsx` completo nel progetto introduttivo; nessun servizio esterno. UserCard riceve un record gia validato dall'applicazione.

```jsx
export function UserCard({ user }) {
  return (
    <article className="user-card" data-user-id={user.id}>
      <h2>{user.name}</h2>
      <p>{user.bio}</p>
      {user.isAdmin ? <strong>Admin</strong> : null}
    </article>
  );
}

export default function App() {
  const user = {
    id: "u-1",
    name: "Ada",
    bio: "<em>Testo, non HTML</em>",
    isAdmin: false,
  };
  return <main><UserCard user={user} /></main>;
}
```

Nel browser la descrizione mostra anche i caratteri < e >: non viene creato un elemento em. Cambiare isAdmin a true aggiunge il badge; non concede un permesso sul server.

## Varianti

- Elemento: `<UserCard user={user} />` e una descrizione, non una chiamata manuale del componente.
- Fragment: raggruppa figli senza un elemento DOM aggiuntivo; usa quello esplicito quando serve key.
- Espressione lista: map con corpo tra graffe deve avere return; con parentesi tonde l'espressione viene restituita.
- JSX multilinea: metti la parentesi aperta sulla stessa riga di return per evitare l'inserimento automatico del punto e virgola.
- JSX e TypeScript: un file .tsx permette controlli statici, non rende affidabili i dati ricevuti dalla rete.

## Errori comuni

- Renderizzare direttamente un oggetto: mostra un campo come user.name.
- Importare male un componente: default e named export non sono intercambiabili.
- Usare una condizione numerica con &&: count uguale a 0 lascia uno zero nella UI; confronta esplicitamente.
- Usare key dentro il figlio anziche sull'elemento restituito dal map.
- Inserire elementi HTML in posizioni non valide, come div dentro p: il parser HTML puo correggere la struttura e creare problemi di hydration.
- Passare indiscriminatamente oggetti con spread a elementi DOM: separa le props applicative da quelle HTML ammesse.

## Checklist

- Identificatori e componenti sono definiti/importati?
- Tag chiusi, struttura HTML valida e attributi corretti?
- Booleani reali, funzioni passate senza chiamarle nel render?
- Dati non fidati resi come testo e URL trattati separatamente?
- Key stabile sull'elemento giusto?

## Collegamenti

- [[Programmazione/React/Indice React|Indice React]]
- [[Programmazione/React/Pagine/Rendering Condizionale e Liste|Rendering e liste]]
- [[Programmazione/React/Pagine/Props e Flusso di dati unidirezionale|Props e flusso dati]]
- [[Programmazione/React/Pagine/Componenti Funzionali vs Componenti a Classe|Componenti]]
- [[Programmazione/React/Pagine/Protezione XSS|Protezione XSS]]

## Fonti

- [React: markup JSX](https://react.dev/learn/writing-markup-with-jsx).
- [React DOM: attributi, style e HTML](https://react.dev/reference/react-dom/components/common).
- [React: Fragment](https://react.dev/reference/react/Fragment).
- [React: rendering condizionale](https://react.dev/learn/conditional-rendering).

Verificato con React 19.3.0; consultazione del 2026-10-14.
