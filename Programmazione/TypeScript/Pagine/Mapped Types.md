---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [typescript, mapped-types, keyof, utility-types]
aliases: [Mapped Type]
prerequisites: [Keyof e typeof, Type Aliases e Interfaces]
related: [Utility Types, Utility Types personalizzati, Indexed Access Types]
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

## API / Sintassi

```ts
type MyReadonly<T> = {
  readonly [K in keyof T]: T[K];
};
```

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
```

`UserForm` contiene una proprieta per ogni campo di `User`, ma ogni valore viene trasformato in stato di form.

## Varianti

- **Mapped type base**: `[K in keyof T]: T[K]`.
- **Aggiunta/rimozione readonly**: `+readonly`, `-readonly`.
- **Aggiunta/rimozione opzionale**: `+?`, `-?`.
- **Key remapping**: `[K in keyof T as NewKey]`.
- **Mapped type su union di stringhe**: `Record<Keys, Value>`.

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

- [[Keyof e typeof]]
- [[Indexed Access Types]]
- [[Utility Types]]
- [[Utility Types personalizzati]]
