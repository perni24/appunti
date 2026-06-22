---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, exhaustiveness-checking, never, discriminated-unions]
aliases: [Controllo esaustivita, Exhaustive switch]
prerequisites: [Discriminated Unions, any, unknown e never]
related: [Type Narrowing, Union e Intersection Types]
---

# Exhaustiveness Checking

## Sintesi

L'**exhaustiveness checking** serve a verificare che tutti i casi di una union siano gestiti. In TypeScript si ottiene spesso usando il tipo `never` nel ramo di default di uno `switch`.

E utile per rendere sicuri refactor e aggiunte di nuove varianti.

## Quando usarlo

- Switch su discriminated union.
- Stati applicativi con molte varianti.
- Event handler con eventi tipizzati.
- Reducer e state machine.
- Codice di dominio dove ogni caso deve essere esplicito.

## Come funziona

Se tutti i casi di una union sono gestiti, nel ramo finale il valore rimasto ha tipo `never`. Se in futuro aggiungi una variante e non aggiorni lo switch, il valore non sara piu `never` e TypeScript segnalera errore.

## API / Sintassi

```ts
function assertNever(value: never): never {
  throw new Error(`Caso non gestito: ${JSON.stringify(value)}`);
}
```

## Esempio pratico

```ts
type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; data: string[] }
  | { status: "error"; message: string };

function render(state: State): string {
  switch (state.status) {
    case "idle":
      return "In attesa";
    case "loading":
      return "Caricamento";
    case "success":
      return state.data.join(", ");
    case "error":
      return state.message;
    default:
      return assertNever(state);
  }
}

function assertNever(value: never): never {
  throw new Error(`Unhandled state: ${JSON.stringify(value)}`);
}
```

Se viene aggiunto `status: "empty"` senza aggiornare `render`, il compilatore segnala errore nel default.

## Varianti

- **Helper `assertNever`**: funzione riutilizzabile.
- **Assegnazione a `never`**: `const _exhaustive: never = value`.
- **Switch senza default**: utile con `noImplicitReturns`, ma meno esplicito.
- **Librerie pattern matching**: possono offrire esaustivita piu ergonomica.

## Errori comuni

- **Aggiungere `default` generico**: nasconde casi mancanti.
- **Non usare discriminated union**: l'esaustivita diventa piu difficile.
- **Ritornare fallback silenziosi**: puo mascherare bug di dominio.
- **Usare `any` nella union**: `any` distrugge il controllo.

## Checklist

- Usare discriminanti stabili nelle union.
- Aggiungere `assertNever` negli switch importanti.
- Evitare default silenziosi su modelli di dominio.
- Controllare che `strict` sia attivo.
- Aggiornare tutti gli switch quando aggiungi una nuova variante.

## Collegamenti

- [[Discriminated Unions]]
- [[any, unknown e never]]
- [[Type Narrowing]]
