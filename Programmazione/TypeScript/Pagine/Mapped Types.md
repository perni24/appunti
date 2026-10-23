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
  - mapped-types
  - keyof
  - utility-types
aliases:
  - Mapped Type
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Keyof e typeof]]"
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Utility Types]]"
  - "[[Programmazione/TypeScript/Pagine/Utility Types personalizzati]]"
  - "[[Programmazione/TypeScript/Pagine/Indexed Access Types]]"
title: Mapped Types
---

# Mapped Types

## Sintesi

I mapped types permettono di creare un nuovo tipo trasformando le proprieta di un altro tipo. Sono alla base di utility come `Partial`, `Readonly`, `Pick` e molti tipi personalizzati.

La forma tipica itera su `keyof T` e produce una nuova proprieta per ogni chiave.

## Quando usarlo

- Rendere tutte le proprieta opzionali o readonly.
- Creare DTO derivati da tipi di dominio.
- Mappare valori di un oggetto verso un nuovo tipo.
- Costruire utility type personalizzati.
- Evitare duplicazione tra tipi simili.

## Come funziona

Un mapped type usa una sintassi simile a un ciclo sulle chiavi: `[K in keyof T]`. Per ogni chiave `K`, puoi decidere il tipo del valore risultante, aggiungere o rimuovere modificatori e anche rinominare chiavi.

Il ciclo e solo una descrizione statica: non enumera proprieta, non crea campi e non converte oggetti. Nella forma che mappa direttamente `keyof T`, i modificatori esistenti vengono normalmente conservati, salvo modifica esplicita. Baseline degli esempi: TypeScript 5.9.3 con `strict: true`.

## API / Sintassi

```ts
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};

const state: MyReadonly<{ nested: { count: number } }> = {
  nested: { count: 0 },
};
state.nested.count++; // consentito: readonly e superficiale
console.log(state.nested.count); // 1
// state.nested = { count: 2 }; // errore di compilazione
```

Non viene chiamato `Object.freeze`. Un alias mutabile dello stesso oggetto puo ancora modificarlo. Anche `-readonly` cambia una vista statica, non scongela un oggetto congelato a runtime.

## Esempio pratico

```ts
type User = {
  id: string;
  email: string;
  active: boolean;
};

type FormState<T> = {
  [K in keyof T]: {
    value: T[K];
    touched: boolean;
  };
};

type UserForm = FormState<User>;

const form: UserForm = {
  id: { value: "u_1", touched: false },
  email: { value: "demo@example.com", touched: false },
  active: { value: true, touched: false },
};
form.email.touched = true;
console.log(form.email.value, form.email.touched);
// demo@example.com true
```

`UserForm` contiene una proprieta per ogni campo di `User`, ma ogni valore viene trasformato in stato di form.

Il valore `form` viene costruito esplicitamente: il tipo non genera un'interfaccia grafica, valori iniziali o validazione. Se il modello ha un campo opzionale, anche il suo stato resta opzionale in questo mapped type; se e `readonly`, lo stato non e riassegnabile. Decidi se sia il contratto desiderato per il form.

## Varianti

- **Mapped type base**: `[K in keyof T]: T[K]`.
- **Aggiunta/rimozione readonly**: `+readonly`, `-readonly`.
- **Aggiunta/rimozione opzionale**: `+?`, `-?`.
- **Key remapping**: `[K in keyof T as NewKey]`.
- **Mapped type su union di stringhe**: `Record<Keys, Value>`.

### Rimuovere modificatori

```ts
type EditableComplete<T> = {
  -readonly [K in keyof T]-?: T[K];
};
type Draft = { readonly title?: string };
const complete: EditableComplete<Draft> = { title: "Appunti" };
complete.title = "Manuale";
console.log(complete.title); // Manuale
```

`-?` rende il campo obbligatorio, ma non lo riempie. Con `strictNullChecks`, per `title?: string` il tipo richiesto diventa `string`. Se dichiari anche `| undefined`, il risultato dipende da `exactOptionalPropertyTypes`: con questa opzione attiva l'`undefined` esplicito resta. Verifica la configurazione prima di usare la utility come contratto di dati completi.

### Rinominare e filtrare chiavi

```ts
type User = { id: string; email: string; active: boolean };
type ValueReaders<T> = {
  [K in keyof T as K extends string ? `read_${K}` : never]: () => T[K];
};
type WithoutId<T> = {
  [K in keyof T as Exclude<K, "id">]: T[K];
};

const readers: ValueReaders<User> = {
  read_id: () => "u_1",
  read_email: () => "demo@example.com",
  read_active: () => true,
};
console.log(readers.read_active()); // true
```

Il remapping con `as` e disponibile da TS 4.1. Produrre `never` elimina una chiave dal **tipo**, non dall'oggetto originale: `WithoutId<User>` non e una funzione di rimozione dei dati. Qui le chiavi numeriche e symbol sono volutamente escluse dai reader. Se piu chiavi confluiscono nello stesso nome, i tipi dei valori possono unirsi; non hai una garanzia automatica di nomi univoci.

I mapped types che preservano la struttura possono trattare anche array e tuple: `MyReadonly<[string, number]>` produce una tuple readonly. Un remapping arbitrario puo invece perdere la forma di tuple; usa test dedicati se la tua utility deve supportarla.

## Errori comuni

- **Duplicare tipi invece di derivarli**: aumenta drift tra modelli.
- **Trasformare troppo**: utility troppo astratte diventano opache.
- **Dimenticare modificatori opzionali/readonly**: possono propagarsi in modo inatteso.
- **Usare mapped type dove basta `Pick` o `Partial`**: preferire utility standard quando adatte.

## Checklist

- Usare mapped types per derivare tipi da modelli esistenti.
- Mantenere nomi espliciti per utility personalizzate.
- Controllare propagazione di `readonly` e `?`.
- Preferire utility standard se sufficienti.
- Testare il tipo risultante con esempi concreti.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Keyof e typeof|Keyof e typeof]]
- [[Programmazione/TypeScript/Pagine/Indexed Access Types|Indexed Access Types]]
- [[Programmazione/TypeScript/Pagine/Utility Types|Utility Types]]
- [[Programmazione/TypeScript/Pagine/Utility Types personalizzati|Utility Types personalizzati]]

## Fonti

- [TypeScript: Mapped Types](https://www.typescriptlang.org/docs/handbook/2/mapped-types.html).
- [TypeScript 3.4: readonly mapped types e array](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#readonly-mapped-type-modifiers-and-readonly-arrays).
- [TypeScript: exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
