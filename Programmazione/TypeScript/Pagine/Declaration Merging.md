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
  - declaration-merging
  - interfaces
  - ambient-declarations
aliases:
  - Declaration merging TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Type Aliases e Interfaces]]"
  - "[[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Module augmentation]]"
  - "[[Programmazione/TypeScript/Pagine/Namespace]]"
  - "[[Programmazione/TypeScript/Pagine/Typing di librerie JavaScript]]"
title: Declaration Merging
---

# Declaration Merging

## Sintesi

Il declaration merging combina alcune dichiarazioni con lo stesso nome e nello stesso ambito in un unico simbolo. E utile per interfacce estendibili, definizioni ambient e API con namespace, ma non crea automaticamente un'implementazione.

Baseline: **TypeScript 5.9.3**, `strict: true`, target `ES2022`. I blocchi sono indipendenti; quello con `window` richiede un browser e i tipi DOM.

## Quando usarlo

- Estendere un'interfaccia predisposta a essere ampliata.
- Descrivere proprieta globali installate dall'applicazione.
- Leggere file `.d.ts` di librerie e integrazioni.
- Distinguere estensione del contratto ed estensione del codice runtime.

## Come funziona

TypeScript distingue gli spazi di nomi per tipi, valori e namespace. Le interfacce producono tipi; classi e namespace possono contribuire anche al lato valore. Solo certe combinazioni sono ammesse.

Due interfacce omonime si uniscono se appartengono allo stesso ambito. Due file che esportano ciascuno la propria `User` sono moduli distinti: i nomi uguali non bastano a unirle. Per modificare un'interfaccia esportata da un altro modulo serve la module augmentation.

## API / Sintassi

### Unione di proprieta

```ts
interface User {
  id: string;
}
interface User {
  email: string;
}

const user: User = { id: "u1", email: "user@example.test" };
console.log(user.id, user.email); // u1 user@example.test
// const incomplete: User = { id: "u2" }; // errore: manca email
```

Se due dichiarazioni ripetono una proprieta non funzione, devono concordare sul suo tipo e sui modificatori pertinenti, inclusa l'opzionalita. `email: string` e `email: number` non diventano una union: sono un conflitto.

### Firme di metodo come overload

```ts
interface Formatter {
  format(value: string): string;
}
interface Formatter {
  format(value: number): string;
}

const formatter: Formatter = {
  format(value: string | number): string {
    return String(value);
  },
};
console.log(formatter.format(42)); // 42
console.log(formatter.format("ready")); // ready
```

Il merging raccoglie le firme di overload; non scrive il corpo della funzione. L'implementazione deve gestire i casi promessi. La scelta di un overload dipende anche dall'ordine delle firme: non usare firme sovrapposte con ritorni contraddittori confidando nel merging per risolverle.

## Esempio pratico

### Proprieta globali da un modulo browser

Il seguente file `app.ts` e un modulo: `export {}` lo rende esplicito anche senza altri import o export. `declare global` amplia il vero `Window` globale.

```ts
export {};

declare global {
  interface Window {
    appVersion?: string;
    analytics?: { track(event: string): void };
  }
}

console.log(window.appVersion ?? "not configured"); // not configured

window.appVersion = "demo";
window.analytics = {
  track(event) { console.log(event); },
};
window.analytics?.track("page_view"); // page_view
```

L'esempio si esegue dopo compilazione in un browser, non in Node, dove `window` non e normalmente disponibile. L'oggetto `analytics` qui e solo un logger dimostrativo, non un servizio di raccolta dati.

Le proprieta sono opzionali perche possono non essere ancora installate. La dichiarazione da sola non le assegna. Scrivere soltanto `interface Window` al livello superiore **dentro un modulo** creerebbe un'interfaccia locale omonima, non l'augmentation globale voluta.

## Varianti

### Interfaccia e classe: promessa senza implementazione

```ts
class Account {
  constructor(public id: string) {}
}
interface Account {
  tag: string;
}

const account = new Account("a1");
console.log(account.tag); // undefined, nonostante il tipo dichiarato string
// account.tag.toUpperCase(); // compila, ma lancia TypeError
```

Questo e un controesempio intenzionale. Il merging estende il tipo dell'istanza, ma il costruttore non ha mai creato `tag`. Non usarlo per aggirare l'inizializzazione dei campi: implementa davvero la proprieta oppure descrivi correttamente la sua eventuale assenza.

### Altre combinazioni

- I type alias non si possono riaprire come le interfacce.
- Due dichiarazioni di classe non si fondono.
- Un namespace puo aggiungere membri a una funzione o classe dichiarata prima; il codice del namespace, se presente, e cio che crea i membri runtime.
- I membri non esportati di un namespace non diventano automaticamente visibili nei blocchi che si fondono con esso.
- Le dichiarazioni ambient descrivono qualcosa che un altro script o una libreria deve fornire.

## Errori comuni

- Usare una proprieta obbligatoria per un'integrazione opzionale.
- Dimenticare `export {}` o un altro indicatore di modulo quando si usa `declare global`.
- Confondere il nome di un'interfaccia locale con un simbolo globale.
- Supporre che un file `.d.ts` venga eseguito e installi i membri dichiarati.
- Scegliere il merging per dati dell'applicazione quando una composizione esplicita sarebbe piu leggibile.

## Checklist

- Le dichiarazioni appartengono allo stesso ambito?
- La combinazione e ammessa dal linguaggio?
- Le proprieta ripetute hanno tipi e modificatori coerenti?
- Il codice runtime implementa davvero il contratto ampliato?
- Il file di dichiarazione e incluso nel progetto che lo deve usare?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Module augmentation|Module augmentation]]
- [[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts|Dichiarazioni e file d.ts]]
- [[Programmazione/TypeScript/Pagine/Typing di librerie JavaScript|Typing di librerie JavaScript]]

## Fonti

- [TypeScript - Declaration Merging](https://www.typescriptlang.org/docs/handbook/declaration-merging.html)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
