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
  - javascript
  - typings
  - librerie
  - dts
aliases:
  - Tipizzare librerie JavaScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts]]"
  - "[[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS]]"
related:
  - "[[Programmazione/TypeScript/Pagine/DefinitelyTyped]]"
  - "[[Programmazione/TypeScript/Pagine/Declaration Merging]]"
  - "[[Programmazione/TypeScript/Pagine/Module augmentation]]"
title: Typing di librerie JavaScript
---

# Typing di librerie JavaScript

## Sintesi

Tipizzare una libreria JavaScript significa descrivere l'API che esiste realmente. Le dichiarazioni migliorano il controllo del consumer, ma il compilatore non dimostra che il codice JavaScript rispetti quel contratto.

Baseline: **TypeScript 5.9.3**, **Node.js 24.14.0**. L'esempio usa un piccolo modulo CommonJS locale di cui possiamo verificare sia dichiarazioni sia implementazione.

## Quando usarlo

- Integrare una dipendenza senza tipi o un modulo legacy.
- Completare tipi incompleti usando API pubbliche documentate.
- Esporre un contratto ristretto davanti a una libreria complessa.
- Diagnosticare import che funzionano a runtime ma non nel checker, o viceversa.

## Come funziona

Procedi in quest'ordine:

1. Controlla se il pacchetto contiene gia dichiarazioni o sorgenti tipizzati.
2. Controlla `exports`, `types` e il formato dei moduli del pacchetto. La risoluzione dipende dal `tsconfig`, non da una ricerca universale indipendente dalla configurazione.
3. Se mancano tipi, cerca un pacchetto DefinitelyTyped compatibile.
4. In alternativa, descrivi localmente solo l'API verificata che usi.
5. Se aggiungi metodi a dichiarazioni esistenti, valuta l'augmentation; non usarla per riscrivere type alias o cambiare arbitrariamente firme.

Un `declare module "pacchetto";` senza membri e una scorciatoia verso `any`, non una tipizzazione utile.

## API / Sintassi

Struttura del demo:

```text
typing-demo/
  legacy-codec/
    index.cjs
    index.d.cts
  src/
    main.cts
  tsconfig.json
```

Presupposto: TypeScript 5.9.3 installato nel progetto. `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true,
    "rootDir": "src",
    "outDir": "dist",
    "noEmitOnError": true,
    "types": []
  },
  "include": ["src/**/*.cts"]
}
```

I suffissi `.cjs`, `.cts` e `.d.cts` rendono esplicito CommonJS anche se una cartella superiore usa ESM.

## Esempio pratico

### Implementazione reale

`legacy-codec/index.cjs`:

```js
exports.parse = function (text) {
  return JSON.parse(text);
};

exports.format = function (value) {
  return JSON.stringify(value);
};
```

### Dichiarazione corrispondente

`legacy-codec/index.d.cts`:

```ts
export function parse(input: string): unknown;
export function format(value: unknown): string | undefined;
```

`parse` non promette un DTO: un JSON valido puo contenere numeri, null o strutture diverse da quelle attese. `format` puo restituire `undefined`, per esempio con `undefined` come valore principale. Entrambe le funzioni possono lanciare eccezioni; questa firma non codifica una garanzia di assenza di errori.

### Consumer con controllo del dato

`src/main.cts`:

```ts
import codec = require("../legacy-codec/index.cjs");

const value = codec.parse('{"id":"u1"}');

if (
  typeof value !== "object" ||
  value === null ||
  !("id" in value) ||
  typeof value.id !== "string"
) {
  throw new TypeError("Expected an object with a string id");
}

console.log(value.id); // u1
console.log(codec.format({ id: value.id })); // {"id":"u1"}
```

Questo controllo dimostrativo verifica il campo usato, non un formato universale degli ID o l'autorizzazione dell'utente. Non trasforma il valore originale.

Compilare:

```sh
npm exec -- tsc -p tsconfig.json
```

Eseguire:

```sh
node dist/main.cjs
```

La cartella `legacy-codec` resta accanto a `dist`: TypeScript usa il `.d.cts` durante il controllo, ma non copia automaticamente l'implementazione descritta. Per distribuire il demo servono anche i file runtime, non soltanto il consumer compilato.

## Varianti

### Dichiarazione ambient per un pacchetto

Per un pacchetto importato per nome si puo usare un file script `.d.ts` con `declare module "nome-pacchetto" { ... }`. Il pacchetto deve comunque esistere nel runtime. Se il file contiene import/export al livello superiore, quel blocco puo essere invece un'augmentation: vedi [[Programmazione/TypeScript/Pagine/Module augmentation|Module augmentation]].

Per moduli locali come quello del demo e piu diretto affiancare il file di dichiarazione con estensione coerente, invece di inventare un modulo ambient relativo.

### Wrapper tipizzato

Un wrapper puo validare il risultato e restituire un modello applicativo, tradurre errori e restringere le funzioni esposte. Il wrapper e codice runtime; una semplice assertion `as User` non svolge questo lavoro.

### Codice sotto il tuo controllo

Se puoi modificare il JavaScript, JSDoc con `checkJs` permette di controllare anche il corpo. Puoi poi generare le dichiarazioni, evitando di mantenere firme separate a mano.

## Errori comuni

- Scrivere tipi piu ottimistici del runtime, per esempio un risultato sempre stringa.
- Confondere `default export`, export nominati e `module.exports`.
- Pensare che `esModuleInterop` o un `.d.ts` creino export inesistenti.
- Modificare direttamente `node_modules`: la correzione non e stabile tra installazioni.
- Copiare una dichiarazione senza provare un import e una chiamata reali.
- Usare `skipLibCheck` come se controllasse o correggesse l'implementazione.

## Checklist

- L'API dichiarata e documentata e presente nella versione installata?
- La dichiarazione rispetta formato del modulo e sottopercorsi pubblici?
- La risoluzione del checker punta al file previsto?
- I risultati incerti restano `unknown` finche non sono controllati?
- Ho provato valori validi, errori e assenza di implementazione?
- La distribuzione include tutti i file runtime necessari?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts|Dichiarazioni e file d.ts]]
- [[Programmazione/TypeScript/Pagine/DefinitelyTyped|DefinitelyTyped]]
- [[Programmazione/TypeScript/Pagine/Module augmentation|Module augmentation]]
- [[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS|Moduli ES e CommonJS]]

## Fonti

- [TypeScript - Library Structures](https://www.typescriptlang.org/docs/handbook/declaration-files/library-structures.html)
- [TypeScript - Modules Reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)
- [MDN - JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
