---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - typescript
  - as-const
  - literal-types
  - readonly
aliases:
  - const assertion
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Inferenza dei tipi]]"
  - "[[Programmazione/TypeScript/Pagine/Enums e Literal Types]]"
related:
  - "[[Programmazione/TypeScript/Pagine/satisfies operator]]"
  - "[[Programmazione/TypeScript/Pagine/Keyof e typeof]]"
  - "[[Programmazione/TypeScript/Pagine/const type parameters]]"
title: as const
---

# as const

## Sintesi

`as const` e una const assertion che dice a TypeScript di inferire un valore nel modo piu specifico possibile: literal types, proprieta readonly e tuple readonly.

E molto utile per configurazioni, mappe costanti e alternative moderne agli enum.

## Quando usarlo

- Oggetti costanti da cui derivare tipi.
- Array che devono diventare tuple readonly.
- Mappe di valori fissi.
- Configurazioni con literal types.
- Alternative agli enum runtime.

## Come funziona

Senza `as const`, TypeScript tende ad allargare valori come `"admin"` a `string`. Con `as const`, preserva il literal `"admin"` e rende readonly le strutture annidate.

## API / Sintassi

```ts
const roles = ["admin", "editor", "viewer"] as const;

type Role = (typeof roles)[number];
```

## Esempio pratico

```ts
const routes = {
  home: "/",
  users: "/users",
  settings: "/settings",
} as const;

type RouteName = keyof typeof routes;
type RoutePath = (typeof routes)[RouteName];
```

Da un oggetto runtime vengono derivati tipi precisi per nomi e path.

## Varianti

- **Array `as const`**: diventa tuple readonly.
- **Oggetto `as const`**: proprieta readonly e literal.
- **`as const satisfies`**: precisione piu controllo di forma.
- **Const type parameters**: preservano literal types in funzioni generiche.

## Errori comuni

- **Pensare che `as const` congeli a runtime**: non chiama `Object.freeze`.
- **Usarlo per mascherare tipi sbagliati**: e comunque una assertion.
- **Dimenticare che rende readonly**: alcune funzioni mutanti non accetteranno il valore.
- **Usarlo su dati dinamici**: e piu adatto a costanti definite nel codice.

## Checklist

- Usare `as const` su costanti di configurazione.
- Derivare union con `(typeof value)[number]` per array.
- Usare `keyof typeof` per chiavi di oggetti costanti.
- Abbinarlo a `satisfies` per controllare la forma.
- Non confonderlo con immutabilita runtime.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Enums e Literal Types|Enums e Literal Types]]
- [[Programmazione/TypeScript/Pagine/satisfies operator|satisfies operator]]
- [[Programmazione/TypeScript/Pagine/Keyof e typeof|Keyof e typeof]]
- [[Programmazione/TypeScript/Pagine/const type parameters|const type parameters]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
