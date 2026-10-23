---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - typescript
  - generics
  - type-system
aliases:
  - Generics TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Funzioni tipizzate]]"
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Generics avanzati]]"
  - "[[Programmazione/TypeScript/Pagine/Utility Types]]"
title: Generics
---

# Generics

## Sintesi

I generics permettono di scrivere funzioni, tipi, interfacce e classi che lavorano con tipi variabili senza perdere informazione.

Sono utili quando il tipo in input deve essere collegato al tipo in output, oppure quando vuoi riutilizzare una struttura mantenendo type safety.

## Quando usarlo

- Funzioni che restituiscono lo stesso tipo ricevuto.
- Wrapper come `Promise<T>`, `Array<T>`, `Map<K, V>`.
- API riutilizzabili su piu modelli dati.
- Repository, client, cache e helper generici.
- Componenti o funzioni dove il tipo deve essere preservato.

## Come funziona

Esempi indipendenti con TypeScript 5.9.3, `strict: true` e target ES2022. Non serve una classe per usare un generic: questa tecnica si applica anche a funzioni e semplici strutture dati.

Un parametro di tipo, spesso chiamato `T`, collega parti di una firma. Il checker deve accettare il corpo per ogni tipo ammesso dal vincolo, non soltanto per il tipo di una particolare chiamata. Puo inferire `T` dagli argomenti o dal contesto, oppure puoi specificarlo.

I parametri di tipo vengono eliminati dal JavaScript. Non puoi fare `new T()` o `value instanceof T`: serve un costruttore come valore. Un `<User>` esplicito non converte un oggetto e non valida JSON.

## API / Sintassi

```ts
function identity<T>(value: T): T {
  return value;
}

const text = identity("ciao");
const count = identity(42);
console.log(text, count); // ciao 42
// identity<number>("42"); // Errore: non converte string in number.
```

In queste chiamate i tipi inferiti conservano i literal `"ciao"` e `42`. `identity<string>("ciao")` restituisce invece il tipo `string`. Altri contesti possono allargare i literal: un generic non garantisce sempre il tipo piu stretto possibile.

## Esempio pratico

```ts
type ApiResponse<T> = {
  data: T;
  status: number;
};

type User = {
  id: string;
  email: string;
};

function unwrap<T>(response: ApiResponse<T>): T {
  return response.data;
}

const response: ApiResponse<User> = {
  status: 200,
  data: { id: "u_1", email: "luca@example.com" },
};
const user = unwrap(response);
console.log(user.email); // luca@example.com
```

`ApiResponse<T>` conserva il tipo di `data`; `unwrap` restituisce lo stesso riferimento, senza copiarlo. E un contenitore locale gia tipizzato: non interpreta lo status HTTP, non effettua richieste e non valida input esterni. Per una vera risposta di rete acquisisci `unknown` e valida prima di costruire questo valore.

### Raccolta vuota: un generic non garantisce presenza

```ts
function first<T>(items: readonly T[]): T | undefined {
  return items[0];
}

const firstName = first(["Luca", "Marta"]);
const missing = first<string>([]);
console.log(firstName, missing); // Luca undefined
```

Il ritorno include `undefined` anche senza `noUncheckedIndexedAccess`. Senza quell'opzione, una firma sbagliata `: T` con lo stesso corpo potrebbe compilare e mentire per l'array vuoto. Usa una tupla non vuota solo se il contratto garantisce davvero un elemento; non correggere l'errore con `!`.

### Vincolo: utilizzare campi senza perdere il tipo

**Controesempio da non usare:** un aggiornamento che promette troppo.

```ts
function withUpdatedId<T extends { id: string }>(value: T, id: string): T {
  return { ...value, id };
}

const updated = withUpdatedId({ id: "old", email: "x@example.com" }, "new");
console.log(updated.email, updated.id);
```

**Attenzione:** questa forma compila ma non e corretta per tutti i sottotipi: `T` potrebbe imporre `id: "old"`, e cambiarlo violerebbe quella promessa. Il vincolo `extends` indica requisiti minimi, non autorizza a ricostruire arbitrariamente un `T`.

Per una funzione che deve soltanto usare un campo, preserva l'oggetto senza alterarlo:

```ts
function requireId<T extends { id: string }>(value: T): T {
  if (value.id.length === 0) {
    throw new Error("ID vuoto");
  }
  return value;
}

const entry = requireId({ id: "n_1", title: "Appunti" });
console.log(entry.title); // Appunti
// requireId({ title: "Appunti" }); // Errore: manca id.
```

Qui `entry` mantiene anche `title`, e il risultato e lo stesso oggetto. Il controllo runtime verifica soltanto che la stringa non sia vuota; non garantisce unicita, formato o provenienza. Per leggere una proprieta con una chiave correlata al tipo vedi [[Programmazione/TypeScript/Pagine/Generics avanzati|Generics avanzati]] (`K extends keyof T`).

### Classe generica: il tipo si fissa per istanza

```ts
class Slot<T> {
  #value: T | undefined;

  set(value: T): void {
    this.#value = value;
  }

  get(): T | undefined {
    return this.#value;
  }
}

const slot = new Slot<string>();
console.log(slot.get()); // undefined
slot.set("pronto");
console.log(slot.get()); // pronto
// slot.set(42); // Errore: questa istanza usa string.
```

Il parametro della classe e disponibile sul lato istanza, non nei suoi membri `static`. Un metodo puo avere un proprio parametro generico, ma non esistono copie runtime separate della classe per `Slot<string>` e `Slot<number>`. Questo esempio ammette uno slot vuoto e non distingue "mai assegnato" da "assegnato a undefined" quando `T` include `undefined`.

## Varianti

- **Generic function**: `function f<T>(value: T): T`.
- **Generic type alias**: `type Box<T> = { value: T }`.
- **Generic interface**: `interface Repository<T>`.
- **Generic class**: `class Cache<T>`.
- **Generic constraint**: `T extends { id: string }`.

## Errori comuni

- **Generic di sola uscita senza evidenza runtime**: `parse<T>(json)` basato su `JSON.parse(json) as T` si fida del chiamante. Serve un parser o uno schema che controlli davvero i dati.
- **Specificare manualmente `T` quando l'inferenza basta**: rende il codice piu verboso.
- **Usare `T extends any`**: non aggiunge informazione utile.
- **Rendere una funzione generica quando basta una union**: aumenta complessita.
- **Restituire il solo constraint come `T`**: `{ id: "x" }` non contiene necessariamente gli altri campi richiesti dal sottotipo scelto.

## Checklist

- Usare generics quando un tipo deve essere preservato o riusato.
- Lasciare inferire il parametro di tipo quando possibile.
- Aggiungere constraint se usi proprieta specifiche di `T`.
- Evitare generics che non migliorano sicurezza o riuso.
- Preferire nomi espliciti se ci sono piu parametri: `TInput`, `TOutput`.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Funzioni tipizzate|Funzioni tipizzate]]
- [[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces|Type Aliases e Interfaces]]
- [[Programmazione/TypeScript/Pagine/Generics avanzati|Generics avanzati]]
- [[Programmazione/TypeScript/Pagine/Utility Types|Utility Types]]


## Fonti

- [TypeScript: Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html), vincoli, inferenza e classi generiche.
- [TypeScript: More on Functions](https://www.typescriptlang.org/docs/handbook/2/functions.html), relazioni tra tipi e uso dei constraint.
- [TSConfig: noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html), letture potenzialmente assenti.
- [TypeScript: Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html), limiti del sistema di tipi.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
