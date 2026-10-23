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
  - module-augmentation
  - declaration-merging
  - dts
aliases:
  - Augmentazione moduli TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Declaration Merging]]"
  - "[[Programmazione/TypeScript/Pagine/Moduli ES e CommonJS]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts]]"
  - "[[Programmazione/TypeScript/Pagine/Typing di librerie JavaScript]]"
title: Module augmentation
---

# Module augmentation

## Sintesi

La module augmentation amplia dichiarazioni esportate da un **modulo esistente**. Serve a descrivere un'integrazione o un plugin; non cambia da sola gli oggetti JavaScript e non permette di riscrivere arbitrariamente i tipi di una libreria.

Baseline dell'esempio completo: **TypeScript 5.9.3**, Node.js **24.14.0**, ESM con `NodeNext`. Non servono librerie applicative esterne.

## Quando usarlo

- Integrare un plugin che aggiunge realmente operazioni a un oggetto.
- Estendere interfacce che una libreria espone come punti di personalizzazione.
- Correggere una dichiarazione mancante quando l'implementazione esiste gia.
- Mantenere separata un'integrazione dai sorgenti originali del modulo.

Se controlli entrambi i componenti, un wrapper o una composizione esplicita puo essere piu semplice di una modifica al prototipo.

## Come funziona

L'augmentation deve trovarsi nel contesto di un modulo, per esempio in un file con `import` o `export` al livello superiore. Il nome in `declare module` viene risolto come un module specifier: deve identificare la dichiarazione da ampliare.

Un blocco `declare module "nome-pacchetto"` in un file **script** privo di import/export puo invece dichiarare un modulo ambient. Non e automaticamente un'augmentation di un pacchetto gia installato.

## API / Sintassi

Il progetto dimostrativo contiene:

```text
augmentation-demo/
  package.json
  tsconfig.json
  src/
    box.ts
    box-label.ts
    main.ts
```

`package.json`:

```json
{
  "private": true,
  "type": "module",
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
    "module": "NodeNext",
    "strict": true,
    "rootDir": "src",
    "outDir": "dist",
    "types": [],
    "noEmitOnError": true
  },
  "include": ["src/**/*.ts"]
}
```

L'esempio non usa API specifiche di Node oltre al caricamento dei moduli e a `console`; non richiede `@types/node`.

## Esempio pratico

### 1. Modulo originale

`src/box.ts`:

```ts
export class Box<T> {
  constructor(public value: T) {}
}
```

### 2. Contratto aggiunto e implementazione

`src/box-label.ts`:

```ts
import { Box } from "./box.js";

declare module "./box.js" {
  interface Box<T> {
    describe(): string;
  }
}

Box.prototype.describe = function<T>(this: Box<T>): string {
  return String(this.value);
};
```

L'interfaccia si fonde con il lato istanza della classe `Box`. Il nome e i parametri generici devono essere coerenti con la dichiarazione originale. L'assegnazione al prototipo, invece, e codice runtime: e lei a installare il metodo.

Il suffisso `.js` negli import indica il percorso usato dopo la compilazione ESM; TypeScript risolve il sorgente `.ts` corrispondente.

### 3. Consumer e caricamento del plugin

`src/main.ts`:

```ts
import { Box } from "./box.js";
import "./box-label.js";

console.log(new Box(42).describe()); // 42
```

Dalla cartella del progetto, installare le dipendenze:

```sh
npm install
```

Compilare:

```sh
npm exec -- tsc -p tsconfig.json
```

Eseguire:

```sh
node dist/main.js
```

L'output e `42`. I comandi riguardano questo progetto dimostrativo, non la root del vault.

### 4. Cosa accade senza l'import di inizializzazione

Se togli `import "./box-label.js"` da `main.ts`, il compilatore puo ancora vedere l'augmentation: `include` continua a includere `box-label.ts`. Ma Node non carica automaticamente tutti i file emessi in `dist`.

Il consumer allora compila e fallisce a runtime con `TypeError`, perche `describe` non e stato installato. Anche un `import type` viene eliminato e non puo sostituire l'import con effetti collaterali.

## Varianti

### Solo dichiarazioni, implementazione gia fornita

Un file `.d.ts` puo contenere l'augmentation se il plugin runtime esiste altrove. Importa i tipi del modulo nel file di dichiarazione e assicurati che quel file faccia parte del progetto; carica separatamente il plugin effettivo. Non importare un `.d.ts` per eseguirlo.

L'augmentation descrive un contratto per l'intero programma TypeScript che la include, non solo per il punto in cui il plugin viene attivato. Per plugin opzionali puo essere piu corretto un tipo locale esteso, ottenuto dopo un controllo esplicito.

### Integrazioni con framework

Un caso comune e aggiungere dati al tipo della richiesta HTTP. Prima identifica la dichiarazione effettivamente estendibile nella versione dei tipi installata: il modulo che re-esporta un tipo non e sempre quello in cui e definito.

Per esempio, un campo `user?` su una richiesta Express non autentica la richiesta e non viene valorizzato dai tipi. Occorrono middleware runtime e controlli prima dell'uso; una proprieta obbligatoria sarebbe una promessa falsa prima dell'autenticazione.

### Limiti

- Non si possono riaprire type alias come interfacce.
- Le proprieta esistenti devono mantenere tipi compatibili con le regole del merging; non e un override.
- L'augmentation serve ad ampliare dichiarazioni esistenti, non ad aggiungere arbitrariamente nuovi export di primo livello.
- Un export `default` non e direttamente augmentabile con questo meccanismo; servono dichiarazioni nominate predisposte all'estensione.

## Errori comuni

- Dichiarare per errore un nuovo modulo ambient al posto di ampliare quello corretto.
- Usare uno specifier che risolve un altro file o un'altra copia del pacchetto.
- Installare solo i tipi e dimenticare l'implementazione.
- Aggiungere metodi al prototipo di librerie non progettate per questo.
- Forzare proprieta obbligatorie quando il plugin puo non essere caricato.

## Checklist

- Il file e un modulo e viene incluso dal compilatore?
- Lo specifier risolve la dichiarazione originale?
- Il simbolo e estendibile e ha un export nominato?
- Il codice runtime viene caricato prima dell'uso?
- Ho verificato il comportamento anche senza inizializzazione del plugin?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Declaration Merging|Declaration Merging]]
- [[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts|Dichiarazioni e file d.ts]]
- [[Programmazione/TypeScript/Pagine/Typing di librerie JavaScript|Typing di librerie JavaScript]]

## Fonti

- [TypeScript - Module Augmentation](https://www.typescriptlang.org/docs/handbook/declaration-merging.html#module-augmentation)
- [TypeScript - Modules Reference](https://www.typescriptlang.org/docs/handbook/modules/reference.html)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
