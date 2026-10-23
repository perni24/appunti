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
  - type-aliases
  - interfaces
  - object-types
aliases:
  - Type Alias
  - Interface
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Tipi primitivi]]"
  - "[[Programmazione/TypeScript/Pagine/Variabili e annotazioni di tipo]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
  - "[[Programmazione/TypeScript/Pagine/Implementazione di interfacce]]"
title: Type Aliases e Interfaces
---

# Type Aliases e Interfaces

## Sintesi

`type` e `interface` servono a dare un nome a una forma di dato. Sono usati per descrivere oggetti, parametri, ritorni di funzione, modelli di dominio e contratti tra moduli.

In molti casi possono descrivere gli stessi oggetti, ma hanno differenze pratiche importanti.

## Quando usarlo

- Quando una forma dati viene usata in piu punti.
- Quando vuoi rendere chiaro il contratto di una funzione o API.
- Quando modelli entita di dominio, DTO o configurazioni.
- Quando vuoi comporre tipi con union, intersection o generics.

## Come funziona

Gli esempi sono indipendenti, verificati con TypeScript 5.9.3 e `strict: true`. Non incollare tutte le definizioni `User` in un unico scope: i blocchi illustrano contratti diversi.

| Esigenza | `type` | `interface` |
| --- | --- | --- |
| Oggetto o firma chiamabile | Si | Si |
| Primitive, union, tuple | Si | Non come alias diretto |
| Composizione | Per esempio intersection | `extends` per tipi oggetto compatibili |
| Stesso nome dichiarato piu volte | Normalmente errore per alias duplicato | Puo avvenire declaration merging |
| Esistenza a runtime | No | No |

I nomi non creano automaticamente tipi nominali: `type UserId = string` e `type OrderId = string` restano compatibili. Il confronto tra oggetti e generalmente strutturale: contano i membri richiesti, non l'uso di `implements` o il nome del tipo.

Il merging riguarda dichiarazioni dello stesso simbolo/scope, non interfacce omonime arbitrarie in moduli indipendenti. I membri ripetuti devono essere compatibili.

## API / Sintassi

```ts
type UserId = string;

type UserRole = "admin" | "editor" | "viewer";

interface User {
  id: UserId;
  email: string;
  role: UserRole;
}
```

## Esempio pratico

```ts
type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string };

interface User {
  id: string;
  email: string;
}

function formatUser(result: ApiResult<User>): string {
  if (!result.ok) {
    return result.error;
  }

  return result.data.email;
}
```

`ApiResult<T>` usa un parametro di tipo per riutilizzare la stessa union; `ApiResult<User>` sostituisce `T` con `User`. Qui `type` rappresenta l'alternativa e `interface` l'oggetto.

La funzione formatta dati gia disponibili, senza richiesta HTTP:

```ts
// Da aggiungere al blocco dell'esempio pratico.
console.log(formatUser({
  ok: true,
  data: { id: "u_1", email: "luca@example.com" },
})); // luca@example.com
console.log(formatUser({ ok: false, error: "Non disponibile" }));
```

### Contratti strutturali, non filtri

Blocco indipendente:

```ts
interface PublicUser {
  id: string;
}

const internalUser = { id: "u_1", internalNote: "solo per uso interno" };
const publicUser: PublicUser = internalUser;
console.log(Object.keys(publicUser)); // ["id", "internalNote"]

// const direct: PublicUser = { id: "u_1", internalNote: "extra" };
// Errore: controllo delle proprieta in eccesso sul literal diretto.

const projected: PublicUser = { id: internalUser.id };
console.log(Object.keys(projected)); // ["id"]
```

L'annotazione restringe cio che il codice puo usare staticamente, **non rimuove campi dall'oggetto**. Per inviare dati pubblici crea una proiezione esplicita; il controllo delle proprieta in eccesso non e un sistema di tipi "esatti" ne una misura di riservatezza.

### Estensione e merging

```ts
interface User {
  id: string;
}

interface Admin extends User {
  role: "admin";
}

interface Settings {
  theme: string;
}
interface Settings {
  locale: string;
}

const settings: Settings = { theme: "dark", locale: "it" };
const admin: Admin = { id: "u_1", role: "admin" };
```

`Settings` richiede entrambi i campi. Una seconda dichiarazione incompatibile di `theme` non sovrascrive la prima: produce un errore. Analogamente, `extends` segnala un membro incompatibile; un'intersection puo invece produrre una proprieta `never`.

## Varianti

- **Type alias per union**: `type Status = "idle" | "loading"`.
- **Type alias per function type**: `type Handler = (event: Event) => void`.
- **Interface per object shape**: `interface User { ... }`.
- **Interface estesa**: `interface Admin extends User { ... }`.
- **DTO e dominio**: stessa forma oggi non significa stessi vincoli o stessa evoluzione; separali quando hanno contratti diversi, senza duplicarli meccanicamente.

## Errori comuni

- **Litigare su type vs interface come regola assoluta**: spesso entrambe vanno bene.
- **Usare interface per union**: le union richiedono `type`.
- **Dimenticare declaration merging**: due interface con lo stesso nome possono fondersi.
- **Creare tipi troppo generici**: nomi come `Data`, `Payload`, `Item` senza contesto aiutano poco.
- **Usare `instanceof User` con un'interfaccia**: non esiste un costruttore `User` a runtime.
- **Pensare che assegnare a un tipo pubblico elimini dati privati**: l'oggetto originale resta lo stesso.

## Checklist

- Usare `type` per union, tuple, primitive alias e utility avanzate.
- Usare `interface` per contratti oggetto estendibili.
- Dare nomi legati al dominio, non alla struttura generica.
- Decidere se DTO e dominio hanno davvero lo stesso contratto.
- Controllare se declaration merging e desiderato o accidentale.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Union e Intersection Types|Union e Intersection Types]]
- [[Programmazione/TypeScript/Pagine/Implementazione di interfacce|Implementazione di interfacce]]
- [[Programmazione/TypeScript/Pagine/Generics|Generics]]
- [[Programmazione/TypeScript/Pagine/Structural typing|Structural typing]]
- [[Programmazione/TypeScript/Pagine/Declaration Merging|Declaration Merging]]
- [[Programmazione/TypeScript/Pagine/DTO e modelli di dominio|DTO e modelli di dominio]]

## Fonti

- [TypeScript: Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html), confronto strutturale.
- [TypeScript: Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html), interfacce omonime.
- [TypeScript: Object Types](https://www.typescriptlang.org/docs/handbook/2/objects.html), excess property checks, extends e intersection.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
