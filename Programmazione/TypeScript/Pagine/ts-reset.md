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
  - ts-reset
  - standard-library
  - type-safety
aliases:
  - ts-reset
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Strict mode]]"
  - "[[Programmazione/TypeScript/Pagine/Best Practices]]"
related:
  - "[[Programmazione/TypeScript/Pagine/any, unknown e never]]"
  - "[[Programmazione/TypeScript/Pagine/Linting e formattazione]]"
title: ts-reset
---

# ts-reset

## Sintesi

`@total-typescript/ts-reset` modifica alcune **dichiarazioni globali** usate da TypeScript. Non modifica gli algoritmi JavaScript e non e un validatore o un polyfill. Alcune regole restringono tipi permissivi; altre allargano le chiamate ammesse per renderle piu ergonomiche.

Baseline: **ts-reset 0.6.1**, **TypeScript 5.9.3**, **Node 24.14.0**. Valuta la compatibilita ad ogni aggiornamento: una patch globale puo interagire con altre dichiarazioni e dipendenze.

## Quando usarlo

- Applicazioni dove il team vuole cambiare consapevolmente determinati tipi standard.
- Riduzione degli `any` restituiti da API come JSON.parse.
- Adozione graduale di regole selezionate, accompagnata da type tests.

**Non introdurlo nelle dichiarazioni pubbliche di una libreria**: il consumatore potrebbe ricevere cambiamenti globali non richiesti. Per una libreria preferisci wrapper locali e contratti espliciti.

## Come funziona

Gli import del file di setup portano dichiarazioni nel programma TypeScript: il loro effetto non e limitato al file che le importa. Un progetto escluso da quel programma o un altro workspace non riceve magicamente la stessa configurazione.

La regola json-parse fa inferire `unknown` invece di `any`. Cosi l'accesso alle proprieta richiede un controllo, ma JSON.parse continua a lanciare su JSON malformato. Un cast puo ancora aggirare il checker.

Il setup va in un **file .d.ts incluso dal tsconfig**. Non produce un import JavaScript. Spostarlo nell'entry point .ts crea invece una dipendenza runtime nell'output: non e necessario per ottenere le dichiarazioni e puo rompere un deploy che omette le devDependencies.

## API / Sintassi

Demo autonomo con una sola regola, per isolare l'effetto. `package.json`:

```json
{
  "name": "typescript-reset-demo",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "tsc --noEmit",
    "build": "tsc",
    "start": "node dist/main.js"
  },
  "devDependencies": {
    "typescript": "5.9.3",
    "@total-typescript/ts-reset": "0.6.1"
  }
}
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022", "DOM"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmitOnError": true,
    "rootDir": "src",
    "outDir": "dist",
    "types": []
  },
  "include": ["src/**/*.ts", "reset.d.ts"]
}
```

DOM fornisce qui le dichiarazioni di console e delle API web eventualmente usate nelle varianti; non installa quelle API nel runtime. Il demo principale usa solo console e JSON disponibili in Node.

`reset.d.ts`, soltanto questo import:

```ts
import "@total-typescript/ts-reset/json-parse";
```

NodeNext risolve i subpath esportati; anche Node16 e Bundler sono opzioni supportate dal pacchetto, da scegliere in coerenza con il progetto.

## Esempio pratico

`src/main.ts`:

```ts
const value = JSON.parse('{"id":"u1","internal":true}');

function readId(input: unknown): string | undefined {
  if (
    typeof input === "object" &&
    input !== null &&
    !Array.isArray(input) &&
    Object.hasOwn(input, "id") &&
    "id" in input &&
    typeof input.id === "string" &&
    input.id.length > 0
  ) {
    return input.id;
  }
  return undefined;
}

console.log(readId(value)); // u1
```

Il codice controlla soltanto che id sia una stringa non vuota e ne restituisce il valore; non verifica formato, identita o autorizzazione. Non propaga il campo internal. Il valore iniziale e unknown grazie alla regola: aggiungere `value.id` senza narrowing deve produrre una diagnostica.

Installazione:

```bash
npm install
```

```bash
npm run check
```

```bash
npm run build
```

```bash
npm start
```

L'output atteso e `u1`. Il JavaScript emesso non importa ts-reset. Conserva il lockfile, e in CI installa anche le devDependencies per il controllo/build; l'esecuzione di questo output non richiede il pacchetto.

## Varianti

### Preset completo

In alternativa alla regola singola, sostituisci il contenuto di reset.d.ts con:

```ts
import "@total-typescript/ts-reset";
```

Nel preset 0.6.1 sono incluse anche regole su fetch, filter(Boolean), Array.isArray, includes/indexOf, Map/Set e Promise.catch. Le regole DOM/storage richiedono un import separato `@total-typescript/ts-reset/dom`. Non assumere che "recommended" significhi "tutte le API sono piu restrittive".

Con il **preset completo**, questo secondo esempio puo stare in `src/filter.ts`:

```ts
const values: (0 | 1 | "" | "ok" | null | false)[] = [
  0,
  1,
  "",
  "ok",
  null,
  false,
];
const kept = values.filter(Boolean); // (1 | "ok")[]

const numbers: (number | undefined)[] = [0, 1, undefined];
const filtered = numbers.filter(Boolean); // number[], a runtime [1]

const roles = ["reader", "writer"] as const;
function containsRole(value: string): boolean {
  return roles.includes(value);
}

console.log(kept, filtered, containsRole("admin"));
// [1, "ok"], [1], false
```

`filter(Boolean)` elimina **tutti i falsy**, non solo null e undefined: anche zero e stringa vuota. Il tipo number non rappresenta "numero diverso da zero", quindi l'annotazione resta piu ampia del risultato effettivo.

La regola includes accetta una stringa piu ampia della union letterale, ma restituisce boolean: **non e una type guard** che restringe value a reader o writer. Il comportamento di ricerca runtime non cambia.

L'esempio filter si compila con la stessa build, ma lo script start esegue soltanto main.js. Per osservarlo:

```bash
node dist/filter.js
```

### Alternative locali

Puoi annotare esplicitamente `const data: unknown = JSON.parse(text)` o esporre un wrapper che restituisce unknown, senza modificare dichiarazioni globali. Lint type-aware puo segnalare usi di any; non sostituisce il parsing.

## Errori comuni

- Import nel .ts invece che nel file di setup dei tipi.
- File reset.d.ts escluso dal tsconfig: pacchetto installato ma nessun effetto.
- Pensare che unknown validi o renda JSON.parse non lanciabile.
- Usare filter(Boolean) quando zero e una stringa vuota sono valori validi.
- Pubblicare accidentalmente l'import globale nelle .d.ts di una libreria.
- Usare skipLibCheck come rimedio automatico a conflitti tra dichiarazioni.

## Checklist

- Applicazione, non API di libreria che impone globali ai consumatori.
- Regole scelte e motivate.
- Setup incluso e non emesso nel JavaScript.
- Type tests su JSON, filtri e chiamate interessate.
- Test runtime separati: nessun comportamento viene corretto dal solo tipo.
- Upgrade di TypeScript e dipendenze verificati insieme.

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Strict mode|Strict mode]]
- [[Programmazione/TypeScript/Pagine/any, unknown e never|any, unknown e never]]
- [[Programmazione/TypeScript/Pagine/Validazione runtime e tipi statici|Validazione runtime e tipi statici]]
- [[Programmazione/TypeScript/Pagine/Type-level testing|Type-level testing]]

## Fonti

- [ts-reset: setup, regole e avvertenza per le librerie](https://www.totaltypescript.com/ts-reset).
- [Sorgenti e dichiarazioni del progetto](https://github.com/mattpocock/ts-reset). Verificati anche exports e file dist del pacchetto npm 0.6.1; i sorgenti del ramo principale possono evolvere.

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
