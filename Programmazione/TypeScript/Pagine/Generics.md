---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [typescript, generics, type-system]
aliases: [Generics TypeScript]
prerequisites: [Funzioni tipizzate, Type Aliases e Interfaces]
related: [Generics avanzati, Utility Types]
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

Un generic introduce un parametro di tipo, spesso chiamato `T`. TypeScript puo inferirlo dalla chiamata o puoi specificarlo esplicitamente.

Il parametro di tipo si comporta come una variabile del type system.

## API / Sintassi

```ts
function identity<T>(value: T): T {
  return value;
}

const text = identity("ciao");
const count = identity(42);
```

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

const user = unwrap<User>({
  status: 200,
  data: { id: "u_1", email: "luca@example.com" },
});
```

`ApiResponse<T>` riusa la stessa struttura mantenendo il tipo specifico di `data`.

## Varianti

- **Generic function**: `function f<T>(value: T): T`.
- **Generic type alias**: `type Box<T> = { value: T }`.
- **Generic interface**: `interface Repository<T>`.
- **Generic class**: `class Cache<T>`.
- **Generic constraint**: `T extends { id: string }`.

## Errori comuni

- **Usare generics senza collegare input e output**: se `T` non serve a nulla, e rumore.
- **Specificare manualmente `T` quando l'inferenza basta**: rende il codice piu verboso.
- **Usare `T extends any`**: non aggiunge informazione utile.
- **Rendere una funzione generica quando basta una union**: aumenta complessita.

## Checklist

- Usare generics quando un tipo deve essere preservato o riusato.
- Lasciare inferire il parametro di tipo quando possibile.
- Aggiungere constraint se usi proprieta specifiche di `T`.
- Evitare generics che non migliorano sicurezza o riuso.
- Preferire nomi espliciti se ci sono piu parametri: `TInput`, `TOutput`.

## Collegamenti

- [[Funzioni tipizzate]]
- [[Type Aliases e Interfaces]]
- [[Generics avanzati]]
- [[Utility Types]]
