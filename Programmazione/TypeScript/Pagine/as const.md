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

`as const` preserva i literal di un'espressione e fa inferire proprieta readonly e, in assenza di un contesto array mutabile, tuple readonly. Serve a descrivere costanti definite nel codice da cui ricavare tipi precisi.

Non congela il valore a runtime e non rende immutabili tutti gli oggetti raggiungibili attraverso riferimenti gia esistenti.

Disponibile da TypeScript **3.4**; esempi verificati con **5.9.3**, `strict: true`. Ogni blocco e indipendente.

## Quando usarlo

- Elenchi finiti di valori da cui derivare union.
- Mappe di route, etichette e configurazioni fisse.
- Tuple in cui contano posizione e valore di ogni elemento.
- Oggetti costanti usati come alternativa a un enum, quando non servono le sue specifiche caratteristiche.

## Come funziona

`const role = "admin"` ha gia il tipo literal `"admin"`. Invece `const user = { role: "admin" }` permette di modificare `user.role`, che viene normalmente inferito come `string`: `const` protegge il binding, non il contenuto.

Una const assertion sul letterale conserva quella informazione e aggiunge vincoli readonly nel tipo. Non e una funzione, non fa una copia e non chiama `Object.freeze`.

## API / Sintassi

```ts
const roles = ["admin", "editor", "viewer"] as const;

type Role = (typeof roles)[number];

function labelRole(role: Role): string {
  return role.toUpperCase();
}

console.log(labelRole("editor")); // EDITOR
// roles.push("owner"); // Errore: tupla readonly
// labelRole("owner"); // Errore: valore fuori dalla union
```

Il tipo di `roles` e `readonly ["admin", "editor", "viewer"]`. `Role` e `"admin" | "editor" | "viewer"`. Questa e una lista di valori ammessi dal compilatore, non una verifica dei permessi dell'utente.

## Esempio pratico

```ts
const routes = {
  home: "/",
  users: "/users",
  settings: "/settings",
} as const;

type RouteName = keyof typeof routes;
type RoutePath = (typeof routes)[RouteName];

function routePath<K extends RouteName>(name: K): (typeof routes)[K] {
  return routes[name];
}

const userPath = routePath("users");
console.log(userPath); // /users
```

`RouteName` contiene le chiavi; `RoutePath` contiene i tre percorsi. Il tipo di `userPath` e precisamente `"/users"`. La funzione legge una mappa, non registra route in un framework.

## Varianti

### Riferimenti condivisi

Gli oggetti annidati scritti nel letterale ricevono inferenza readonly; un riferimento a un valore gia creato conserva invece il proprio tipo.

```ts
const sharedTags = ["draft"];

const config = {
  kind: "document",
  nested: { enabled: true },
  tags: sharedTags,
} as const;

sharedTags.push("ready");
config.tags.push("published"); // Consentito: tags e string[]

console.log(config.tags.join(", ")); // draft, ready, published
console.log(Object.isFrozen(config)); // false
// config.nested.enabled = false; // Errore statico
// config.tags = []; // Errore: la proprieta tags e readonly
```

Non equivale a una `DeepReadonly` applicata a un grafo di oggetti, ne a un freeze profondo. Anche `Object.freeze`, se usato separatamente, congela solo il primo livello.

### Funzioni che leggono array

Preferire un parametro readonly quando la funzione non modifica l'input. Un array mutabile puo essere passato a un parametro readonly; il contrario non vale.

```ts
function joinLabels(values: readonly string[]): string {
  return values.join(", ");
}

const labels = ["small", "large"] as const;
const mutableCopy = [...labels];

mutableCopy.push("small");
console.log(joinLabels(labels)); // small, large
console.log(mutableCopy.length); // 3
```

La copia e mutabile, ma il suo tipo elemento rimane `"small" | "large"`, non diventa automaticamente `string`. Per accettare altre stringhe scegliere esplicitamente `const mutableCopy: string[] = [...labels]`.

### Controllo di forma e limiti sintattici

`as const satisfies T` combina precisione del letterale e controllo di compatibilita; vedere [[Programmazione/TypeScript/Pagine/satisfies operator|satisfies operator]].

Attenzione al tipo contestuale: in TypeScript 5.9.3 un vincolo array mutabile puo far inferire una tupla mutabile anche con `as const`:

```ts
const contextual = ["small", "large"] as const satisfies string[];

contextual.push("small"); // Consentito
console.log(contextual.length); // 3
// contextual.push("other"); // Errore: i literal restano ristretti
```

Per mantenere readonly in questo pattern usare `satisfies readonly string[]`. Il comportamento con contesti mutabili e stato aggiornato dopo l'introduzione della feature: vedere la modifica ufficiale nelle fonti.

Non si puo applicare `as const` indiscriminatamente a una variabile, a una chiamata o a un'espressione calcolata. Per esempio `existingArray as const` e rifiutato: non ricostruisce i literal persi. Applicarlo al letterale iniziale oppure usare un'API generica che preservi l'inferenza.

In un'espressione condizionale puoi applicarlo ai singoli rami letterali, per esempio `condition ? ("on" as const) : ("off" as const)`, non all'intera espressione condizionale.

## Errori comuni

- Confondere `const`, readonly statico e immutabilita runtime.
- Credere che vengano congelati anche riferimenti condivisi.
- Passare tuple readonly a funzioni che richiedono array mutabili.
- Cercare di validare JSON o valori dinamici con una const assertion.
- Dimenticare che un array copiato puo conservare un tipo elemento molto ristretto.

## Checklist

- Applicare l'assertion al letterale nel punto in cui viene definito.
- Usare `keyof typeof` per le chiavi e indexed access per i valori.
- Documentare eventuali riferimenti condivisi mutabili.
- Scegliere parametri readonly per funzioni di sola lettura.
- Verificare a parte forma, dati esterni e invarianti runtime.

## Fonti

- [TypeScript 3.4: const assertions e limiti](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-4.html#const-assertions).
- [TypeScript Handbook: oggetti e readonly array](https://www.typescriptlang.org/docs/handbook/2/objects.html).
- [TypeScript: inferenza dipendente dai vincoli, PR 55229](https://github.com/microsoft/TypeScript/pull/55229).
- [MDN: Object.freeze](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze).

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Enums e Literal Types|Enums e Literal Types]]
- [[Programmazione/TypeScript/Pagine/satisfies operator|satisfies operator]]
- [[Programmazione/TypeScript/Pagine/Keyof e typeof|Keyof e typeof]]
- [[Programmazione/TypeScript/Pagine/const type parameters|const type parameters]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
