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
  - satisfies
  - type-checking
  - inference
aliases:
  - satisfies
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Inferenza dei tipi]]"
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
related:
  - "[[Programmazione/TypeScript/Pagine/as const]]"
  - "[[Programmazione/TypeScript/Pagine/Keyof e typeof]]"
title: satisfies operator
---

# satisfies operator

## Sintesi

`espressione satisfies Tipo` verifica l'assegnabilita al contratto indicato senza sostituire il tipo dell'espressione con quel contratto. E utile per configurazioni di cui vuoi conservare chiavi e dettagli inferiti.

Non significa pero "inferenza sempre identica a quella senza `satisfies`": il contratto fornisce un **tipo contestuale**, che puo influenzare i literal inferiti.

Disponibile da TypeScript **4.9**; esempi verificati con **5.9.3**, `strict: true`.

## Quando usarlo

- Controllare mappe di route, handler o feature flag definite nel codice.
- Rilevare campi mancanti o valori incompatibili in configurazioni.
- Derivare tipi dall'oggetto concreto senza annotarlo interamente con un tipo piu ampio.

Non sostituisce un parser per dati ricevuti da API, form o file.

## Come funziona

Il controllo avviene durante la compilazione. A runtime resta il valore originale, non un booleano, una copia o un oggetto filtrato.

La differenza pratica:

- `const x: T = ...`: la variabile viene dichiarata con il contratto `T`.
- `const x = ... satisfies T`: verifica il contratto e conserva il tipo dell'espressione risultante dall'inferenza contestuale.
- `const x = ... as T`: asserisce un tipo; non dimostra che i dati rispettino il contratto. Il compilatore rifiuta comunque alcune assertion fra tipi troppo diversi.

## API / Sintassi

```ts
type Route = {
  path: string;
  method: "GET" | "POST";
};

const route = {
  path: "/users",
  method: "GET",
} satisfies Route;

route.path = "/accounts"; // path e string
console.log(route.method); // GET
// route.method = "POST"; // Errore: il tipo inferito e "GET"
```

Non tutti i campi restano literal: qui `path` e `string`, mentre `method` resta `"GET"`. Il rifiuto di `"POST"` dipende dal tipo ristretto, non da `readonly`: assegnare nuovamente `"GET"` e lecito.

Se l'oggetto e uno stato destinato a cambiare fra tutti i valori del contratto, un'annotazione `const route: Route = ...` puo essere la scelta corretta.

## Esempio pratico

Una union finita delle chiavi rende obbligatorie tutte le voci attese e consente di rilevare errori di battitura nell'oggetto letterale.

```ts
type FeatureName = "darkMode" | "betaDashboard";
type FeatureConfig = Record<FeatureName, { enabled: boolean }>;

const features = {
  darkMode: { enabled: true },
  betaDashboard: { enabled: false },
} satisfies FeatureConfig;

type ConfiguredFeature = keyof typeof features;

function isEnabled(name: ConfiguredFeature): boolean {
  return features[name].enabled;
}

console.log(isEnabled("darkMode")); // true
// features.darkMode.enabled = false; // Errore: il tipo e true

const mutableFeatures: FeatureConfig = {
  darkMode: { enabled: true },
  betaDashboard: { enabled: false },
};

mutableFeatures.darkMode.enabled = false; // Consentito
```

`satisfies Record<string, ...>` e un'alternativa per mappe aperte, ma non impone un insieme finito di nomi: una chiave scritta male potrebbe essere accettata. La precisione dei boolean literal e utile per configurazioni, meno per stato modificabile.

## Varianti

### Controllo di forma e const assertion

Per mantenere anche string literal, tuple e proprieta readonly, applicare `as const` al letterale e poi verificarlo:

```ts
type EndpointConfig = {
  path: string;
  methods: readonly ("GET" | "POST")[];
};

const endpoint = {
  path: "/users",
  methods: ["GET"],
} as const satisfies EndpointConfig;

console.log(endpoint.methods[0]); // GET
```

Il vincolo usa un array readonly per accettare la tupla. L'oggetto non e congelato a runtime; vedere [[Programmazione/TypeScript/Pagine/as const|as const]].

### Proprieta aggiuntive e opzionali

Il controllo delle proprieta in eccesso su un letterale fresco non crea un sistema di "tipi esatti". Le variabili seguono la compatibilita strutturale:

```ts
type RequestConfig = { path: string; retries?: number };

const source = { path: "/api", debug: true };
const checked = source satisfies RequestConfig;

console.log(checked === source); // true
console.log(checked.debug); // true
// checked.retries; // Errore: la proprieta non e stata aggiunta
```

Il contratto non rimuove `debug` e non aggiunge `retries`. Per filtrare campi costruire esplicitamente un nuovo oggetto; per validare input usare controlli runtime.

## Errori comuni

- Aspettarsi che `satisfies` restituisca `true` o `false`.
- Affermare che preserva sempre tutti i literal o che non influenza mai l'inferenza.
- Confondere un literal ristretto con una proprieta readonly.
- Usare `any satisfies T` come validazione: `any` aggira il controllo.
- Aspettarsi che il contratto aggiunga proprieta opzionali o filtri campi extra.

## Checklist

- Distinguere configurazioni fisse da stato mutabile.
- Scegliere chiavi finite quando l'insieme e noto.
- Controllare i tipi effettivamente inferiti per stringhe, booleani e tuple.
- Usare `as const` solo quando la precisione readonly e voluta.
- Validare separatamente i valori non attendibili.

## Fonti

- [TypeScript 4.9: satisfies](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-4-9.html#the-satisfies-operator).
- [TypeScript: chiarimento dei manutentori sull'inferenza contestuale](https://github.com/microsoft/TypeScript/issues/55189).
- [TypeScript Handbook: compatibilita strutturale](https://www.typescriptlang.org/docs/handbook/type-compatibility.html).

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Inferenza dei tipi|Inferenza dei tipi]]
- [[Programmazione/TypeScript/Pagine/as const|as const]]
- [[Programmazione/TypeScript/Pagine/Keyof e typeof|Keyof e typeof]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
