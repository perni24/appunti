---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: base
tags: [typescript, inferenza, type-inference]
aliases: [Type inference]
prerequisites: [Introduzione a TypeScript, Variabili e annotazioni di tipo]
related: [any, unknown e never, Union e Intersection Types]
---

# Inferenza dei tipi

## Sintesi

L'inferenza dei tipi e la capacita di TypeScript di dedurre il tipo di un valore senza annotazione esplicita.

Usarla bene rende il codice piu leggibile: si annotano i contratti importanti e si lascia al compilatore il lavoro sui dettagli locali.

## Quando usarlo

- Variabili inizializzate immediatamente.
- Risultati di funzioni gia tipizzate.
- Array e oggetti locali semplici.
- Callback dove il contesto fornisce gia il tipo.
- Codice interno non esportato.

## Come funziona

TypeScript osserva il valore assegnato, il contesto e le operazioni disponibili. Da queste informazioni produce un tipo.

Per esempio, `const name = "Luca"` puo essere inferito come literal type `"Luca"`, mentre `let name = "Luca"` viene di solito allargato a `string`, perche una variabile `let` puo cambiare.

## API / Sintassi

```ts
const port = 3000; // 3000
let retries = 3; // number

const names = ["Luca", "Marta"]; // string[]
```

## Esempio pratico

```ts
type User = {
  id: string;
  email: string;
};

function getUserEmail(user: User) {
  return user.email;
}

const email = getUserEmail({ id: "u_1", email: "luca@example.com" });
```

Il ritorno di `getUserEmail` viene inferito come `string`, quindi `email` non ha bisogno di annotazione.

## Varianti

- **Inferenza da inizializzazione**: `const value = 1`.
- **Inferenza contestuale**: una callback riceve tipi dal contesto.
- **Literal inference**: `const role = "admin"`.
- **Best common type**: un array viene inferito dal tipo comune dei suoi elementi.

## Errori comuni

- **Combattere l'inferenza con annotazioni inutili**: rende il codice piu verboso.
- **Non controllare tipi inferiti troppo larghi**: un array vuoto puo diventare `any[]` o `never[]` in base al contesto.
- **Confondere `const` con immutabilita profonda**: `const` impedisce riassegnazione, non rende immutabile un oggetto.
- **Aspettarsi inferenza perfetta ai confini del sistema**: API pubbliche e input esterni vanno tipizzati chiaramente.

## Checklist

- Lasciare inferire variabili locali ovvie.
- Annotare parametri e API pubbliche.
- Controllare array vuoti e oggetti inizialmente incompleti.
- Usare `as const` quando servono literal types profondi.
- Leggere i tipi inferiti dall'editor quando qualcosa non torna.

## Collegamenti

- [[Variabili e annotazioni di tipo]]
- [[any, unknown e never]]
- [[Union e Intersection Types]]
