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
  - strict-mode
  - type-safety
  - tsconfig
aliases:
  - strict TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/tsconfig]]"
  - "[[Programmazione/TypeScript/Pagine/any, unknown e never]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Best Practices]]"
  - "[[Programmazione/TypeScript/Pagine/Error Handling]]"
title: Strict mode
---

# Strict mode

## Sintesi

`strict: true` attiva una famiglia di controlli TypeScript: riduce assunzioni implicite su tipi, valori nulli e inizializzazione. Non dimostra l'assenza di bug e non valida i dati ricevuti a runtime.

Questa nota descrive TypeScript **5.9.3**. Aggiornamenti del compilatore possono aggiungere controlli alla famiglia `strict`: conserva la versione nel progetto e ricontrolla le diagnostiche durante un upgrade.

## Quando usarlo

- Come base per nuovi progetti TypeScript.
- Durante refactor che coinvolgono valori opzionali o callback.
- Per migrare gradualmente codice permissivo senza nascondere errori dietro `any`.

## Come funziona

In questa versione, `strict` abilita le seguenti opzioni, salvo override espliciti:

- `noImplicitAny`: segnala casi di `any` implicito dovuti a inferenza insufficiente.
- `noImplicitThis`: segnala `this` implicitamente `any`.
- `strictNullChecks`: distingue `null` e `undefined` dai valori presenti.
- `strictFunctionTypes`: controlla piu rigorosamente i parametri dei tipi funzione; esistono eccezioni per metodi.
- `strictBindCallApply`: controlla gli argomenti di `bind`, `call` e `apply`.
- `strictPropertyInitialization`: controlla l'inizializzazione delle proprieta di istanza.
- `useUnknownInCatchVariables`: usa `unknown` per la variabile di `catch` non annotata.
- `strictBuiltinIteratorReturn`: rende piu preciso il valore di ritorno degli iteratori built-in.
- `alwaysStrict`: applica la modalita strict JavaScript e, dove necessario, emette `"use strict"`.

Non confondere **strict TypeScript** con la sola direttiva JavaScript `"use strict"`: quest'ultima non controlla i tipi. I moduli ESM sono gia strict a runtime.

## API / Sintassi

Frammento da integrare nel `tsconfig.json` del progetto:

```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "noEmitOnError": true
  }
}
```

Le ultime tre opzioni sono **aggiuntive**, non vengono attivate da `strict`. Anche `noImplicitReturns`, `noImplicitOverride`, `noUnusedLocals`, `noUnusedParameters` e `noFallthroughCasesInSwitch` sono scelte separate.

## Esempio pratico

Gestione di `null` senza confonderlo con una stringa vuota:

```ts
function formatName(name: string | null): string {
  if (name === null) {
    return "Senza nome";
  }

  return name.toUpperCase();
}

console.log(formatName(null));  // Senza nome
console.log(formatName("Ada")); // ADA
console.log(formatName(""));    // stringa vuota
```

Con `strictNullChecks`, rimuovere il controllo su `null` rende non valida la chiamata a `toUpperCase()`. Una non-null assertion `name!` silenzierebbe il compilatore, ma non eliminerebbe il valore nullo a runtime.

### Accessi indicizzati

Esempio valido anche con `noUncheckedIndexedAccess: true`:

```ts
function firstUpper(names: string[]): string {
  const first = names[0];
  return first === undefined ? "Lista vuota" : first.toUpperCase();
}

console.log(firstUpper([]));      // Lista vuota
console.log(firstUpper(["Ada"])); // ADA
```

Con il solo `strict`, `names[0]` puo essere trattato come `string`, pur restituendo `undefined` per una lista vuota. `noUncheckedIndexedAccess` rende esplicito questo rischio; non rende sicuro ogni possibile accesso.

### Proprieta opzionali

```ts
type Preferences = {
  theme?: "light" | "dark";
};

const defaults: Preferences = {};
const selected: Preferences = { theme: "dark" };
```

Con `exactOptionalPropertyTypes: true`, assegnare `{ theme: undefined }` a `Preferences` e un errore: assenza e presenza con valore `undefined` sono diverse. Per permettere entrambe, dichiara `theme?: "light" | "dark" | undefined`. La lettura di una proprieta opzionale puo comunque restituire `undefined`.

## Varianti

- **Migrazione graduale**: attiva la famiglia, misura gli errori e usa override temporanei mirati dove necessario. Evita di sostituire indiscriminatamente i tipi con `any`.
- **Input esterno**: assegna il risultato a `unknown` e validalo. `JSON.parse` restituisce `any` anche con `strict`.
- **Confini di funzione**: preferisci contratti espliciti e narrowing; una type assertion non controlla il dato.
- **Controllo senza build**: con TypeScript locale installato, dalla radice del progetto:

```sh
npm exec -- tsc -p tsconfig.json --noEmit
```

## Errori comuni

- Pensare che `noImplicitAny` vieti anche gli `any` espliciti o quelli delle API di libreria.
- Supporre che `strict` includa ogni controllo del compilatore.
- Usare `!`, `as` o predicati di tipo scorretti per aggirare gli errori.
- Attribuire a `strict` il blocco dell'emissione: serve `noEmitOnError`, oppure una pipeline che interrompa la build quando il controllo fallisce.
- Considerare superflui test e validazione runtime dopo una compilazione riuscita.

## Checklist

- Le opzioni attive sono note, incluse le eventuali eccezioni?
- Array vuoti, valori nulli e proprieta assenti sono gestiti?
- I dati esterni vengono validati?
- I workaround temporanei sono tracciati?
- L'upgrade TypeScript viene verificato prima della distribuzione?

## Fonti

- [TypeScript: strict](https://www.typescriptlang.org/tsconfig/strict.html)
- [noUncheckedIndexedAccess](https://www.typescriptlang.org/tsconfig/noUncheckedIndexedAccess.html)
- [exactOptionalPropertyTypes](https://www.typescriptlang.org/tsconfig/exactOptionalPropertyTypes.html)
- [alwaysStrict](https://www.typescriptlang.org/tsconfig/alwaysStrict.html)
- [strictBuiltinIteratorReturn](https://www.typescriptlang.org/tsconfig/strictBuiltinIteratorReturn.html)

## Collegamenti

- [[Programmazione/TypeScript/Pagine/tsconfig|tsconfig]]
- [[Programmazione/TypeScript/Pagine/any, unknown e never|any, unknown e never]]
- [[Programmazione/TypeScript/Pagine/Best Practices|Best Practices]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
