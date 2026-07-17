---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [typescript, template-literal-types, string-types]
aliases: [Template literal type]
prerequisites: [Union e Intersection Types, Literal Types]
related: [Mapped Types, Keyof e typeof]
---

# Template Literal Types

## Sintesi

I template literal types permettono di costruire tipi stringa combinando literal types, union e interpolazioni type-level.

Sono utili per modellare pattern di stringhe prevedibili, come event names, chiavi di traduzione, route, classi CSS o nomi derivati da proprieta.

## Quando usarlo

- Eventi come `user:created` o `order:paid`.
- Chiavi derivate da nomi di proprieta.
- Route o endpoint con pattern noti.
- Naming convention interne.
- Utility type che generano stringhe tipizzate.

## Come funziona

La sintassi usa backtick come i template literal JavaScript, ma a livello di tipo. Se interpolazioni contengono union, TypeScript genera tutte le combinazioni possibili.

## API / Sintassi

```ts
type Entity = "user" | "order";
type Action = "created" | "deleted";

type EventName = `${Entity}:${Action}`;
```

`EventName` diventa `"user:created" | "user:deleted" | "order:created" | "order:deleted"`.

## Esempio pratico

```ts
type User = {
  id: string;
  email: string;
};

type ChangeEvent<T> = `${Extract<keyof T, string>}Changed`;

type UserEvent = ChangeEvent<User>;

function onUserEvent(event: UserEvent): void {
  console.log(event);
}

onUserEvent("emailChanged");
```

Il tipo accetta solo eventi derivati dalle chiavi di `User`.

## Varianti

- **Combinazione di union**: genera tutte le stringhe possibili.
- **Key remapping**: usato nei mapped types con `as`.
- **Intrinsic string manipulation types**: `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`.
- **Pattern nominali leggeri**: ID o chiavi con prefisso.

## Errori comuni

- **Generare union enormi**: troppe combinazioni rallentano il compilatore.
- **Usare template literal type per validazione runtime**: non valida stringhe reali a runtime.
- **Rendere i nomi troppo magici**: difficile capire da dove arrivano.
- **Dimenticare `Extract<keyof T, string>`**: `keyof` puo includere `number` o `symbol`.

## Checklist

- Usare template literal types per pattern stringa davvero limitati.
- Evitare combinazioni esplosive.
- Aggiungere validazione runtime se le stringhe arrivano dall'esterno.
- Documentare naming convention generate.
- Usare utility standard per maiuscole/minuscole quando serve.

## Collegamenti

- [[Keyof e typeof]]
- [[Mapped Types]]
- [[Union e Intersection Types]]
