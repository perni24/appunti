---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [typescript, type-aliases, interfaces, object-types]
aliases: [Type Alias, Interface]
prerequisites: [Tipi primitivi, Variabili e annotazioni di tipo]
related: [Union e Intersection Types, Implementazione di interfacce]
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

Un `type alias` puo dare un nome a qualsiasi tipo: primitive, union, tuple, function type, object type.

Una `interface` descrive principalmente la forma di un oggetto ed e estendibile tramite `extends` e declaration merging.

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

`type` e comodo per union generiche, mentre `interface` descrive bene la forma dell'entita `User`.

## Varianti

- **Type alias per union**: `type Status = "idle" | "loading"`.
- **Type alias per function type**: `type Handler = (event: Event) => void`.
- **Interface per object shape**: `interface User { ... }`.
- **Interface estesa**: `interface Admin extends User { ... }`.

## Errori comuni

- **Litigare su type vs interface come regola assoluta**: spesso entrambe vanno bene.
- **Usare interface per union**: le union richiedono `type`.
- **Dimenticare declaration merging**: due interface con lo stesso nome possono fondersi.
- **Creare tipi troppo generici**: nomi come `Data`, `Payload`, `Item` senza contesto aiutano poco.

## Checklist

- Usare `type` per union, tuple, primitive alias e utility avanzate.
- Usare `interface` per contratti oggetto estendibili.
- Dare nomi legati al dominio, non alla struttura generica.
- Evitare duplicati tra DTO e dominio se rappresentano lo stesso concetto.
- Controllare se declaration merging e desiderato o accidentale.

## Collegamenti

- [[Union e Intersection Types]]
- [[Implementazione di interfacce]]
- [[Programmazione/TypeScript/Pagine/Generics|Generics]]
