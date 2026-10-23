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
  - type-level-testing
  - testing
  - type-system
aliases:
  - Test type-level
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Utility Types]]"
  - "[[Programmazione/TypeScript/Pagine/Conditional Types]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Testing in TypeScript]]"
  - "[[Programmazione/TypeScript/Pagine/Utility Types personalizzati]]"
title: Type-level testing
---

# Type-level testing

## Sintesi

I type tests controllano **inferenza, assegnabilita e chiamate vietate** dal contratto TypeScript. Il loro risultato e una compilazione riuscita o una diagnostica attesa; non provano che una funzione calcoli correttamente il risultato.

Baseline: **TypeScript 5.9.3**, `strict: true`. Mantieni la versione esplicita: un aggiornamento puo cambiare inferenza e diagnostiche anche se il JavaScript resta uguale.

## Quando usarlo

- API generiche e utility types pubbliche.
- Overload, inferenza e readonly.
- Tipi generati e dichiarazioni di libreria.
- Regressioni in cui un tipo diventa accidentalmente `any` o troppo permissivo.

## Come funziona

Un test positivo deve essere accettato; uno negativo contiene una chiamata che deve restare vietata. Con `@ts-expect-error` il **file nel suo insieme deve compilare**: la direttiva sopprime una diagnostica attesa e diventa essa stessa errore se la riga successiva non ne produce nessuna.

La direttiva non verifica il codice o il testo esatto della diagnostica: anche un errore diverso sulla stessa riga puo soddisfarla. Tieni il caso minimo, usa import verificati e non nascondere piu operazioni sulla riga. `@ts-ignore` non segnala quando la soppressione non serve piu.

## API / Sintassi

Progetto autonomo. `package.json`:

```json
{
  "name": "typescript-type-tests-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "test:types": "tsc -p tsconfig.json"
  },
  "devDependencies": {
    "typescript": "5.9.3"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noEmit": true,
    "types": []
  },
  "include": ["src/**/*.ts", "tests/**/*.ts"]
}
```

I file sotto tests sono solo per il checker; non vengono eseguiti. `noUnusedLocals` non e abilitato, per consentire alias usati unicamente come assertion.

## Esempio pratico

`src/first.ts`:

```ts
export function first<T>(values: readonly T[]): T | undefined {
  return values[0];
}
```

`tests/first.types.ts`:

```ts
import { first } from "../src/first.js";

type Equal<A, B> =
  (<T>() => T extends A ? 1 : 2) extends <T>() => T extends B ? 1 : 2
    ? true
    : false;

type Expect<T extends true> = T;
type IsAny<T> = 0 extends 1 & T ? true : false;

const id = first(["u1", "u2"]);
const tuple = ["u1"] as const;
const literal = first(tuple);
const empty = first<number>([]);

type IdTest = Expect<Equal<typeof id, string | undefined>>;
type LiteralTest = Expect<Equal<typeof literal, "u1" | undefined>>;
type EmptyTest = Expect<Equal<typeof empty, number | undefined>>;
type NoAnyTest = Expect<Equal<IsAny<typeof id>, false>>;

const accepted: string | undefined = id;

// @ts-expect-error il parametro esplicito richiede stringhe
first<string>([123]);

// @ts-expect-error first puo restituire undefined
const required: string = id;

// @ts-expect-error serve un array, non un oggetto generico
first({ value: "u1" });
```

`id` conserva la possibilita di assenza. Anche per la tupla con un elemento la firma generica scelta restituisce `T | undefined`: non promette un overload per tuple non vuote. La tupla e dichiarata separatamente per provare un riferimento gia readonly: un literal passato direttamente alla funzione puo ricevere contextual typing e non rilevare la stessa regressione.

Il test `accepted` verifica **assegnabilita in una direzione**. `Equal` controlla una relazione piu restrittiva utile nei casi mostrati, ma non e una definizione universale di identita dei tipi: intersection, overload, tipi generici e rappresentazioni equivalenti richiedono test mirati. Il controllo esplicito su `any` evita che la sola assegnabilita dia una falsa sicurezza.

Installazione:

```bash
npm install
```

Esecuzione, con exit code zero atteso:

```bash
npm run test:types
```

Conserva il lockfile e usa `npm ci` in CI. Non eseguire questo file tramite un runner runtime: le chiamate intenzionalmente invalide sono comunque JavaScript eseguibile se qualcuno lo trasforma.

### Come verificare che i test servano

Prova una modifica per volta e poi ripristinala:

- Cambia il parametro di `first` in `T[]`: il caso readonly deve segnalare una regressione.
- Rimuovi `undefined` dal ritorno: `noUncheckedIndexedAccess` segnala l'implementazione non coerente e le assertion cambiano.
- Sostituisci `first<string>([123])` con una chiamata valida: la direttiva inutilizzata genera TS2578.
- Rendi il risultato `any`: NoAnyTest e altri casi devono fallire.

Una compilazione verde senza il file tests nell'include non costituisce una verifica.

## Varianti

- **Vitest**: `expectTypeOf` e `assertType` con checker separato, oppure modalita typecheck esplicitamente attivata. I file `*.test-d.ts` sono analizzati staticamente; il normale `vitest run` non basta a provare i tipi.
- **tsd**: utile per verificare le dichiarazioni consumate da una libreria; occorre testare anche package exports e dipendenze.
- **Test compile-fail separati**: un harness puo controllare il codice diagnostico atteso senza direttive.
- **Snapshot delle dichiarazioni**: mostrano differenze, non stabiliscono da soli se una modifica e corretta.

## Errori comuni

- Testare soltanto il tipo atteso senza importare l'API reale.
- Usare assertion `as` o `any` per far passare il test.
- Considerare tutti gli errori di compilazione una prova positiva.
- Confondere return type dichiarato e valore realmente restituito.
- Aggiornare gli snapshot senza valutare la compatibilita.

## Checklist

- Casi positivi e negativi sul contratto pubblico.
- Include, flag e versione del checker espliciti.
- Direttive piccole e motivate.
- Controlli su inferenza, readonly, nullabilita e any dove rilevanti.
- Mutazione intenzionale capace di far fallire la suite.
- Test runtime separati per i risultati effettivi.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Testing in TypeScript|Testing in TypeScript]]
- [[Programmazione/TypeScript/Pagine/Utility Types personalizzati|Utility Types personalizzati]]
- [[Programmazione/TypeScript/Pagine/Conditional Types|Conditional Types]]
- [[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts|Dichiarazioni e file d.ts]]

## Fonti

- [TypeScript 3.9: ts-expect-error](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-9.html).
- [TypeScript: noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html).
- [Vitest 4: testing types e attivazione del checker](https://v4.vitest.dev/guide/testing-types).

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
