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
  - definitelytyped
  - at-types
  - typings
aliases:
  - DefinitelyTyped
  - "@types"
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts]]"
  - "[[Programmazione/TypeScript/Pagine/Typing di librerie JavaScript]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Declaration Merging]]"
  - "[[Programmazione/TypeScript/Pagine/Module augmentation]]"
title: DefinitelyTyped
---

# DefinitelyTyped

## Sintesi

DefinitelyTyped mantiene dichiarazioni TypeScript per librerie JavaScript che non le distribuiscono direttamente. I pacchetti `@types/*` descrivono API: non installano l'implementazione runtime e possono essere incompleti o non allineati alla versione usata.

Baseline dell'esempio: **TypeScript 5.9.3**, **Node.js 24.14.0**, **Lodash 4.18.1** e **@types/lodash 4.17.27**. La prova riguarda `debounce`, non certifica tutte le API delle due versioni.

## Quando usarlo

- Aggiungere tipi a una dipendenza che ne e priva.
- Capire un errore di declaration file mancante.
- Diagnosticare globali o firme provenienti da `@types`.
- Correggere un contratto community con un caso riproducibile.

## Come funziona

Prima verifica i tipi inclusi nel pacchetto. Se esistono, un ulteriore `@types` puo essere inutile, un vecchio stub o una fonte di conflitti.

La convenzione comune e `@types/nome`. Per un pacchetto scoped come `@scope/nome`, il nome diventa `@types/scope__nome`. E una convenzione, non la garanzia che quel pacchetto esista.

Le versioni delle dichiarazioni hanno un ciclo proprio: la patch non deve necessariamente coincidere con quella del runtime, e aggiornamenti dei tipi possono introdurre nuovi errori di compilazione. Controlla API, major/minor dichiarate, compatibilita con TypeScript e lockfile. Nel demo la minor di Lodash e piu recente di quella dei tipi: l'uso verificato e limitato alla funzione mostrata.

## API / Sintassi

In un progetto dimostrativo separato, installare il runtime:

```sh
npm install --save-exact lodash@4.18.1
```

Installare gli strumenti e i tipi:

```sh
npm install --save-dev --save-exact typescript@5.9.3 @types/lodash@4.17.27
```

Controllare le versioni risolte:

```sh
npm ls lodash @types/lodash typescript
```

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "strict": true,
    "types": [],
    "rootDir": "src",
    "outDir": "dist",
    "noEmitOnError": true
  },
  "include": ["src/**/*.cts"]
}
```

Conserva il lockfile del progetto. Non installare queste dipendenze nella root del vault solo per leggere la nota.

## Esempio pratico

`src/main.cts` usa CommonJS esplicito, coerente con il sottopercorso di Lodash:

```ts
import debounce = require("lodash/debounce");

const messages: string[] = [];
const queue = debounce((message: string) => {
  messages.push(message);
  return messages.length;
}, 300);

const pending = queue("draft");
queue("final");

console.log(pending); // undefined: il callback non e ancora stato eseguito
console.log(queue.flush()); // 1: esegue subito la chiamata pendente
queue.cancel();
console.log(messages.join(",")); // final

// queue(42); // errore statico: serve una stringa
```

Compilare:

```sh
npm exec -- tsc -p tsconfig.json
```

Eseguire:

```sh
node dist/main.cjs
```

I messaggi sono registrati soltanto nell'array locale: non e un salvataggio persistente. I tipi descrivono argomenti, risultato eventuale e metodi `flush`/`cancel`; Lodash fornisce il comportamento runtime. Il valore restituito da una funzione debounced non e una Promise che aspetta la prossima esecuzione.

## Varianti

### types non e una lista di tutti i moduli importabili

Nella baseline TypeScript 5.9.3, i pacchetti `@types` visibili sono normalmente inclusi anche per i loro globali. `types: []` disabilita quell'inclusione automatica; non impedisce di risolvere dichiarazioni per un modulo importato esplicitamente.

Per questo il demo rimane tipizzato anche con `types: []`. Al contrario, un globale come `process` non viene aggiunto automaticamente da `@types/node` se e escluso. I default possono cambiare nelle major successive: verifica la versione del compilatore.

`typeRoots` seleziona cartelle contenenti pacchetti di tipi: non e una lista di file `.d.ts`. Di solito non serve impostarlo per la normale installazione in `node_modules/@types`.

### Applicazione e libreria pubblicata

In un'applicazione i tipi sono spesso devDependency. Se distribuisci dichiarazioni che importano altri pacchetti di tipi, devi garantirne la risoluzione anche ai consumer: la regola "sempre devDependency" non basta.

Per Node, scegli tipi compatibili con la versione runtime di destinazione. Installare tipi piu nuovi non rende disponibili API nuove sul server.

### Diagnosi e contributi

Per capire quali dichiarazioni vengono usate:

```sh
npm exec -- tsc -p tsconfig.json --traceResolution
```

Se una firma e sbagliata, prepara un esempio minimo, verifica il comportamento della libreria e aggiungi un test alla correzione. Evita di modificare `node_modules` manualmente; una patch locale temporanea deve essere riproducibile e possibilmente sostituita da una correzione upstream.

## Errori comuni

- Installare solo `@types/lodash` e aspettarsi che Node carichi Lodash.
- Interpretare il successo del checker come prova di compatibilita dell'intera libreria.
- Importare da `@types/lodash` nel codice applicativo invece che da `lodash`.
- Usare `types` per cercare di abilitare tutti gli import.
- Nascondere conflitti con `skipLibCheck` senza identificarne l'origine.
- Aggiornare tipi e runtime senza ricontrollare i consumer.

## Checklist

- La libreria distribuisce gia i propri tipi?
- Runtime, dichiarazioni e compilatore sono compatibili per le API usate?
- Il lockfile rende ripetibile l'installazione?
- Globali e moduli importati sono distinti nella configurazione?
- L'esempio compila ed esegue davvero?
- Eventuali dipendenze dei tipi pubblici arrivano ai consumer?

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Typing di librerie JavaScript|Typing di librerie JavaScript]]
- [[Programmazione/TypeScript/Pagine/Dichiarazioni e file d.ts|Dichiarazioni e file d.ts]]
- [[Programmazione/TypeScript/Pagine/Module augmentation|Module augmentation]]

## Fonti

- [DefinitelyTyped - Repository e convenzioni](https://github.com/DefinitelyTyped/DefinitelyTyped)
- [TypeScript - types](https://www.typescriptlang.org/tsconfig/types.html)
- [Lodash - debounce](https://lodash.com/docs/4.18.1#debounce)

## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
