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
  - template-literal-types
  - string-types
aliases:
  - Template literal type
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
  - "[[Programmazione/TypeScript/Pagine/Enums e Literal Types]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Mapped Types]]"
  - "[[Programmazione/TypeScript/Pagine/Keyof e typeof]]"
title: Template Literal Types
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

Con union finite il risultato e un prodotto cartesiano: due entita e due azioni producono quattro nomi, anche se alcune combinazioni non hanno senso nel dominio. Non usare questa tecnica per autorizzare transizioni o azioni. I tipi vengono cancellati, mentre un template literal usato in un'espressione costruisce davvero una stringa.

Disponibili da TS 4.1; esempi verificati con TS 5.9.3 e `strict: true`.

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

`onUserEvent` qui **stampa soltanto il nome**: non registra listener e non implementa un event emitter. Il filtro `Extract<keyof T, string>` esclude volutamente chiavi numeriche e symbol; non le converte. Se `T` ha un indice stringa, il risultato non e piu un elenco finito di eventi.

## Varianti

- **Combinazione di union**: genera tutte le stringhe possibili.
- **Key remapping**: usato nei mapped types con `as`.
- **Intrinsic string manipulation types**: `Uppercase`, `Lowercase`, `Capitalize`, `Uncapitalize`.
- **Pattern strutturali di stringa**: ID o chiavi con prefisso; non brand nominali.

### Collegare nome evento e payload

```ts
type Profile = { email: string; active: boolean };
type Change<T> = {
  [K in keyof T & string]: { name: `${K}Changed`; value: T[K] };
}[keyof T & string];

function describeChange(change: Change<Profile>): string {
  if (change.name === "activeChanged") {
    return change.value ? "Attivo" : "Inattivo";
  }
  return change.value.toLowerCase();
}

console.log(describeChange({ name: "activeChanged", value: false }));
// Inattivo
// describeChange({ name: "activeChanged", value: "yes" }); // errore
```

Questa union conserva l'abbinamento fra chiave e valore. Due campi indipendenti come `name: "emailChanged" | "activeChanged"` e `value: string | boolean` ammetterebbero anche abbinamenti errati. L'esempio usa un modello con campi obbligatori; modelli opzionali richiedono una policy esplicita per assenza e `undefined`.

### Pattern aperti e controllo runtime

```ts
type UserId = `user_${string}`;

function parseUserId(value: unknown): UserId {
  if (typeof value !== "string" || !value.startsWith("user_")) {
    throw new TypeError("Expected user_ prefix");
  }
  return value as UserId;
}

console.log(parseUserId("user_42")); // user_42
console.log(parseUserId("user_")); // user_: suffisso vuoto ammesso
```

Il cast e localizzato dopo il controllo che giustifica esattamente questo pattern. Non garantisce suffisso non vuoto, formato UUID, esistenza dell'utente o autorizzazione. `${number}` descrive stringhe numeriche riconosciute dal checker, non una regex per ID decimali o un controllo di intervallo. Per regole piu strette servono un parser e, se utile, un brand separato.

`Uppercase`, `Lowercase`, `Capitalize` e `Uncapitalize` trasformano tipi stringa, non il testo del valore. Non sono regole di normalizzazione locale o di sicurezza; `Capitalize` riguarda il primo carattere, non ogni parola. Le unioni grandi possono richiedere tipi generati a build time invece di molte interpolazioni.

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

- [[Programmazione/TypeScript/Pagine/Keyof e typeof|Keyof e typeof]]
- [[Programmazione/TypeScript/Pagine/Mapped Types|Mapped Types]]
- [[Programmazione/TypeScript/Pagine/Union e Intersection Types|Union e Intersection Types]]
- [[Programmazione/TypeScript/Pagine/Brand Types|Brand Types]]

## Fonti

- [TypeScript: Template Literal Types](https://www.typescriptlang.org/docs/handbook/2/template-literal-types.html).
- [TypeScript 4.1](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-1.html), introduzione e integrazione con mapped types.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
