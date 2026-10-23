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
  - narrowing
  - type-system
  - control-flow-analysis
aliases:
  - Narrowing TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Union e Intersection Types]]"
  - "[[Programmazione/TypeScript/Pagine/any, unknown e never]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Type Guards]]"
  - "[[Programmazione/TypeScript/Pagine/Type predicates]]"
  - "[[Programmazione/TypeScript/Pagine/Discriminated Unions]]"
  - "[[Programmazione/TypeScript/Pagine/Exhaustiveness Checking]]"
title: Type Narrowing
---

# Type Narrowing

## Sintesi

Il **type narrowing** e il processo con cui TypeScript restringe un tipo ampio a un tipo piu specifico in base ai controlli presenti nel codice.

E fondamentale quando lavori con union, valori opzionali, `unknown`, input esterni e stati applicativi che possono assumere forme diverse.

## Quando usarlo

- Quando una variabile ha tipo union.
- Quando un valore puo essere `null` o `undefined`.
- Quando ricevi input `unknown` da JSON, form, file o rete.
- Quando una funzione deve gestire piu forme di dato.
- Quando vuoi evitare assertion non sicure.

## Come funziona

Esempi indipendenti verificati con TypeScript 5.9.3, `strict: true` e target ES2022. E la baseline delle prove, non l'indicazione dell'ultima release.

TypeScript segue controlli, assegnazioni e percorsi raggiungibili. Il tipo osservato in un punto puo essere piu stretto del tipo dichiarato della variabile. Una successiva assegnazione deve ancora rispettare il tipo dichiarato, non necessariamente quello ristretto nel ramo precedente.

Il narrowing puo riguardare entrambi i rami di un `if`. Un `return` o `throw` elimina un percorso dal codice successivo. Non avviene nessuna conversione: sono i controlli JavaScript a eseguire la verifica; le informazioni di tipo non restano a runtime.

## API / Sintassi

```ts
function format(value: string | number): string {
  if (typeof value === "number") {
    return value.toFixed(2);
  }

  return value.toUpperCase();
}

console.log(format(12), format("ciao")); // 12.00 CIAO
```

Il ramo numerico termina con `return`, quindi sotto resta solo `string`. `number` comprende anche `NaN` e infinito: se il dominio li esclude serve un controllo aggiuntivo, non il solo `typeof`.

## Esempio pratico

```ts
type ApiResponse =
  | { status: "success"; data: string[] }
  | { status: "error"; message: string };

function render(response: ApiResponse): string {
  if (response.status === "success") {
    return response.data.join(", ");
  }

  return `Errore: ${response.message}`;
}

console.log(render({ status: "success", data: ["A", "B"] })); // A, B
console.log(render({ status: "error", message: "Timeout" })); // Errore: Timeout
```

Il discriminante `status` correla il ramo con il payload. La funzione assume un `ApiResponse` gia valido: un oggetto JSON con il solo `status: "success"` non e sufficiente. Il controllo di un discriminante interno non sostituisce la validazione dell'intero input `unknown`.

### Assenza e truthiness non sono equivalenti

```ts
function normalizeLabel(value: string | null | undefined): string {
  if (value === null || value === undefined) {
    return "(assente)";
  }
  return value.trim();
}

console.log(normalizeLabel(""), normalizeLabel(null)); // "" (assente)
```

`if (value)` scarterebbe anche la stringa vuota; con numeri scarterebbe zero e `NaN`. Usa truthiness solo quando tutti i valori falsy sono davvero da trattare allo stesso modo. `value != null` e una forma intenzionale per escludere sia `null` sia `undefined`; non estendere automaticamente questo uso ad altri confronti non stretti.

### Mutazioni e alias possono invalidare la premessa

```ts
type Profile = { name?: string };

function normalizedName(
  profile: Profile,
  beforeRead: (profile: Profile) => void,
): string {
  const name = profile.name;
  if (name === undefined) {
    return "(assente)";
  }
  beforeRead(profile);
  return name.toUpperCase();
}

const profile: Profile = { name: "Luca" };
console.log(normalizedName(profile, (value) => {
  delete value.name;
})); // LUCA
```

Qui viene conservata una stringa locale, non riletto il campo mutabile. Se controllassi `profile.name` e dopo la callback usassi `profile.name.toUpperCase()`, il codice potrebbe compilare ma fallire: il checker non invalida ogni narrowing quando chiami una funzione che puo mutare un alias.

La copia di un riferimento a un oggetto non rende immutabili i suoi campi. Getter e Proxy possono inoltre restituire valori diversi tra letture: questi esempi assumono record ordinari.

### Valori catturati da una closure

```ts
function makeLabelReader(value: string | undefined): () => string {
  if (value === undefined) {
    return () => "(assente)";
  }
  const label = value;
  return () => label.toUpperCase();
}

console.log(makeLabelReader("Luca")()); // LUCA
```

Una copia locale costante rende esplicita la premessa usata dalla callback. TypeScript puo conservare anche alcuni narrowing dopo l'ultima assegnazione di parametri o variabili catturate; non tutti i casi richiedono una copia. Riassegnazioni dentro altre closure possono invece impedire il restringimento. Per valori mutabili o lavoro asincrono, verifica quale dato verra effettivamente letto al momento dell'uso.

## Varianti

- **`typeof` narrowing**: primitive come `string`, `number`, `boolean`.
- **`instanceof` narrowing**: istanze di classi o costruttori.
- **`in` narrowing**: presenza di una proprieta.
- **Equality narrowing**: confronto con literal value.
- **Control-flow narrowing**: `return`, `throw`, `continue` eliminano casi.

## Errori comuni

- **Usare `as` invece di narrowing**: aggira il compilatore e aumenta rischio runtime.
- **Dimenticare `null`**: `typeof null === "object"`.
- **Controllare proprieta non discriminanti**: puo non restringere come previsto.
- **Mutare una variabile dopo il narrowing**: puo invalidare assunzioni logiche.
- **Considerare un check una garanzia permanente**: alias, callback e mutazioni possono rendere obsoleto un controllo.

## Checklist

- Preferire narrowing a type assertion.
- Usare discriminanti stabili per union di oggetti.
- Gestire `null` e `undefined` in modo esplicito.
- Separare validazione runtime e uso del dato validato.
- Usare `never` per controllare casi impossibili.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Type Guards|Type Guards]]
- [[Programmazione/TypeScript/Pagine/Type predicates|Type predicates]]
- [[Programmazione/TypeScript/Pagine/Discriminated Unions|Discriminated Unions]]
- [[Programmazione/TypeScript/Pagine/Exhaustiveness Checking|Exhaustiveness Checking]]


## Fonti

- [TypeScript: Narrowing](https://www.typescriptlang.org/docs/handbook/2/narrowing.html), flusso di controllo e truthiness.
- [TypeScript 5.4: narrowing nelle closure](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-4.html), preservazione dopo l'ultima assegnazione.
- [TypeScript: Type Compatibility](https://www.typescriptlang.org/docs/handbook/type-compatibility.html), limiti del sistema di tipi.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
