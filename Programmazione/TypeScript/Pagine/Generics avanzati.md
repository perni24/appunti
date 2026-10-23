---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - typescript
  - generics
  - type-system
  - advanced-types
aliases:
  - Advanced generics TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Generics]]"
  - "[[Programmazione/TypeScript/Pagine/Conditional Types]]"
  - "[[Programmazione/TypeScript/Pagine/Keyof e typeof]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Utility Types]]"
  - "[[Programmazione/TypeScript/Pagine/Mapped Types]]"
  - "[[Programmazione/TypeScript/Pagine/Infer nei Conditional Types]]"
title: Generics avanzati
---

# Generics avanzati

## Sintesi

I generics avanzati usano vincoli, parametri multipli, default, `keyof`, conditional types e inferenza per costruire API riutilizzabili senza perdere precisione.

La regola pratica e semplice: un generic e utile quando collega piu parti del tipo, per esempio input e output, chiave e valore, payload e risultato.

## Quando usarlo

- API che preservano il tipo dell'input.
- Helper per leggere proprieta da oggetti.
- Repository, cache, client HTTP o SDK tipizzati.
- Utility type riutilizzabili.
- Componenti o funzioni con vincoli tra parametri.

## Come funziona

Un generic puo avere un constraint con `extends`, un valore default e piu parametri collegati tra loro. TypeScript usa il contesto della chiamata per inferire i parametri di tipo.

Il constraint descrive cio che l'implementazione puo assumere, non sostituisce `T` con il vincolo: se `T extends { id: string }`, il chiamante puo passare un tipo con altri campi obbligatori. La funzione non puo quindi costruire un `T` arbitrario restituendo solo `{ id: "x" }`.

I parametri generici vengono cancellati nel JavaScript emesso: non creano validatori, costruttori o contenitori diversi a runtime. Gli esempi sono verificati con TypeScript 5.9.3 e `strict: true`.

## API / Sintassi

```ts
function getProperty<TObject, TKey extends keyof TObject>(
  object: TObject,
  key: TKey
): TObject[TKey] {
  return object[key];
}

const settings = { retries: 3, label: "demo" };
const retries = getProperty(settings, "retries"); // number
console.log(retries); // 3
// getProperty(settings, "missing"); // errore di compilazione
```

Con una chiave specifica il ritorno resta specifico. Con una chiave di tipo `"retries" | "label"` il risultato e `number | string`: il generic non sa quale chiave verra scelta a runtime. Una stringa ricevuta dall'esterno deve prima essere controllata, non semplicemente convertita con `as keyof ...`.

## Esempio pratico

```ts
type Entity = {
  id: string;
};

class Repository<T extends Entity> {
  private items = new Map<string, T>();

  save(item: T): void {
    this.items.set(item.id, item);
  }

  findById(id: string): T | undefined {
    return this.items.get(id);
  }
}

type User = Entity & {
  email: string;
};

const users = new Repository<User>();
users.save({ id: "u_1", email: "luca@example.com" });
console.log(users.findById("u_1")?.email); // luca@example.com
console.log(users.findById("missing")); // undefined
```

Il vincolo `T extends Entity` permette al repository di usare `id` senza conoscere tutti gli altri campi dell'entita.

Questo repository e solo una mappa in memoria: `save` sostituisce un elemento con lo stesso ID, non scrive in un database e non controlla email, permessi o unicita applicativa. Conserva e restituisce lo stesso riferimento. Se il chiamante cambia `id` dopo il salvataggio, la chiave della mappa non viene aggiornata: servono una policy di immutabilita o copie esplicite quando questo comportamento non e desiderato.

## Varianti

- **Constraint**: `T extends SomeType`.
- **Default type parameter**: `<T = string>`.
- **Parametri collegati**: `<TObject, TKey extends keyof TObject>`.
- **Generic su classi/interfacce**: `Repository<T>`.
- **Generic con conditional types**: tipo risultato dipendente da input.

### Default e vincoli tra parametri

```ts
type Outcome<T, TError = Error> =
  | { ok: true; value: T }
  | { ok: false; error: TError };

type Page<T, TItems extends readonly T[] = readonly T[]> = {
  items: TItems;
};

const failure: Outcome<number> = {
  ok: false,
  error: new Error("No result"),
};
const page: Page<string> = { items: ["a", "b"] };
console.log(failure.error.message, page.items.length); // No result 2
```

Il default rende omissibile il parametro di tipo e deve rispettarne il constraint. Non e un argomento runtime predefinito e non crea un `Error` o un array. I parametri obbligatori precedono quelli con default; l'inferenza, dove disponibile, puo scegliere un candidato invece del default.

### Preservare literal e tuple

Per input array in sola lettura usa constraint come `readonly unknown[]`, cosi accetti anche tuple `as const`. Non scrivere `unknown[]` se l'implementazione non deve mutare l'array. I `const type parameters` (da TS 5.0) aiutano l'inferenza dei literal nelle espressioni passate direttamente, ma non ricostruiscono precisione gia persa in una variabile: vedi la nota dedicata.

## Errori comuni

- **Usare generics decorativi**: se `T` non collega nulla, spesso non serve.
- **Vincolare troppo presto**: constraint rigidi riducono riuso.
- **Usare `any` dentro un generic**: rompe la precisione che il generic dovrebbe preservare.
- **Rendere API semplici troppo astratte**: peggiora leggibilita.

## Checklist

- Verificare che ogni parametro generico abbia uno scopo.
- Usare constraint solo quando servono proprieta specifiche.
- Preferire inferenza alla specifica manuale del tipo.
- Dare nomi espliciti quando i parametri sono molti.
- Testare i casi limite con chiamate reali.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Generics|Generics]]
- [[Programmazione/TypeScript/Pagine/Conditional Types|Conditional Types]]
- [[Programmazione/TypeScript/Pagine/Keyof e typeof|Keyof e typeof]]
- [[Programmazione/TypeScript/Pagine/Utility Types|Utility Types]]
- [[Programmazione/TypeScript/Pagine/const type parameters|const type parameters]]
- [[Programmazione/TypeScript/Pagine/Variadic tuple types|Variadic tuple types]]

## Fonti

- [TypeScript: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html), constraint e default dei parametri.
- [TypeScript 5.0: const type parameters](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-0.html#const-type-parameters).
- Gli esempi del repository in memoria sono locali; non rappresentano un'API di persistenza.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
