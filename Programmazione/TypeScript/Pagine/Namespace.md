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
  - namespace
  - modules
  - legacy
aliases:
  - Namespaces TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS]]"
  - "[[Programmazione/TypeScript/Pagine/Declaration Merging]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Module augmentation]]"
  - "[[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts]]"
title: Namespace
---

# Namespace

## Sintesi

Un namespace TypeScript raggruppa nomi sotto un prefisso. Se contiene valori puo generare codice JavaScript; se contiene solo tipi puo essere eliminato. Non e un sistema di caricamento dei file e non sostituisce i moduli ES.

Baseline: **TypeScript 5.9.3**, `strict: true`, target `ES2022`. Gli esempi sono blocchi indipendenti.

## Quando usarlo

- Leggere codice legacy organizzato in script globali.
- Descrivere API ambient o librerie con un oggetto globale.
- Aggiungere membri associati a una funzione tramite declaration merging.
- Mantenere un'API esistente senza introdurre nuovi globali nei moduli moderni.

Per separare i file di una nuova applicazione, in genere preferisci `import` e `export`.

## Come funziona

Un membro con `export` e accessibile dall'esterno tramite il nome del namespace. Qui `export` rende il membro pubblico **nel namespace**; non rende necessariamente il file un modulo ES.

Un namespace dichiarato dentro un modulo resta nel suo ambito e deve essere esportato dal modulo per essere importato altrove. Un namespace in uno script globale, invece, contribuisce al relativo ambito globale.

## API / Sintassi

### Membri pubblici e privati al blocco

```ts
namespace MathUtils {
  const precision = 2;

  export function sum(a: number, b: number): number {
    return a + b;
  }

  export function format(value: number): string {
    return value.toFixed(precision);
  }
}

console.log(MathUtils.sum(1, 2)); // 3
console.log(MathUtils.format(3)); // 3.00
// MathUtils.precision; // errore: membro non esportato
```

Qui TypeScript emette un oggetto e codice che lo popola. `precision` e locale all'implementazione del blocco, non una proprieta pubblica dell'oggetto.

## Esempio pratico

### Funzione con proprieta associate

```ts
function buildLabel(name: string): string {
  return buildLabel.prefix + name;
}

namespace buildLabel {
  export const prefix = "label:";
}

console.log(buildLabel("user")); // label:user
console.log(buildLabel.prefix); // label:
```

La funzione viene dichiarata prima del namespace che la amplia. Il namespace crea realmente la proprieta `prefix`; non e soltanto una dichiarazione di tipo. Questo pattern e utile per leggere certe API, ma un semplice oggetto esportato puo bastare se stai progettando una nuova interfaccia.

## Varianti

### Merging di namespace

```ts
namespace Settings {
  const localPrefix = "app:";
  export function label(name: string): string {
    return localPrefix + name;
  }
}

namespace Settings {
  export const enabled = true;
  // export const copied = localPrefix; // errore: privato dell'altro blocco
}

console.log(Settings.label("theme"), Settings.enabled); // app:theme true
```

I membri esportati si combinano; quelli non esportati rimangono visibili soltanto nel blocco originale. Per distribuire un namespace globale tra file bisogna anche caricare il JavaScript necessario nell'ordine corretto. Le triple-slash reference descrivono dipendenze al compilatore, non caricano script nel browser.

### Namespace di soli tipi

```ts
namespace Models {
  export interface User {
    id: string;
  }
}

const user: Models.User = { id: "u1" };
console.log(user.id); // u1
// console.log(Models); // errore: Models non e un valore runtime
```

Questo namespace non ha bisogno di un oggetto runtime. Non puoi usarlo come contenitore di dati soltanto perche lo vedi nei suggerimenti dell'editor.

### Namespace ambient

```ts
declare namespace ExternalUI {
  function version(): string;
}

// ExternalUI.version(); // richiede una vera libreria runtime gia caricata
```

E un esempio di sola dichiarazione: non installa una libreria e non implementa `version`. La chiamata sarebbe accettata dal compilatore ma, in assenza del valore globale, produrrebbe `ReferenceError`.

### Vincoli del compilatore e alias

`erasableSyntaxOnly` rifiuta i namespace che richiedono generazione di codice runtime. Con `isolatedModules`, un namespace globale con valori richiede attenzione: rendere il file un modulo evita quel vincolo, ma cambia anche il suo ambito.

`outFile` puo essere usato in scenari legacy; per i moduli supporta AMD e System, non e un modo per creare un bundle ESM. Usa gli strumenti del progetto, non aggiungerlo automaticamente.

La sintassi `import Alias = Namespace.Subnamespace` crea un alias TypeScript e non carica un pacchetto. Viceversa `import * as api from "./api.js"` e un import ES: non richiede di dichiarare un namespace TypeScript nel file importato.

## Errori comuni

- Aggiungere namespace dentro ogni modulo per ripetere il nome del file.
- Credere che un namespace globale venga condiviso fra moduli senza import/export.
- Confondere un'API ambient con un'implementazione.
- Aspettarsi che membri non esportati diventino visibili dopo il merging.
- Usare una pipeline che elimina solo i tipi per sintassi che richiede trasformazione.

## Checklist

- Sto raggruppando nomi o cercando di caricare moduli?
- Il namespace genera valori oppure contiene solo tipi?
- Il file e uno script globale o un modulo?
- I membri necessari sono esportati e il codice e caricato?
- La pipeline supporta questa sintassi?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS|Moduli ES e CommonJS]]
- [[Programmazione/TypeScript/Pagine/Declaration Merging|Declaration Merging]]
- [[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts|Dichiarazioni e file d.ts]]

## Fonti

- [TypeScript - Namespaces](https://www.typescriptlang.org/docs/handbook/namespaces.html)
- [TypeScript - Namespaces and Modules](https://www.typescriptlang.org/docs/handbook/namespaces-and-modules.html)
- [TypeScript - erasableSyntaxOnly](https://www.typescriptlang.org/tsconfig/erasableSyntaxOnly.html)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
