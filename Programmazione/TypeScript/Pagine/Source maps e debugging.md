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
  - sourcemap
  - debugging
  - build
aliases:
  - Source maps
  - Debugging TypeScript
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/tsconfig]]"
related:
  - "[[Programmazione/TypeScript/Pagine/TypeScript con Node.js]]"
  - "[[Programmazione/TypeScript/Pagine/Testing in TypeScript]]"
title: Source maps e debugging
---

# Source maps e debugging

## Sintesi

Le source map associano posizioni del JavaScript generato ai sorgenti TypeScript. Aiutano debugger e lettori di stack trace, ma non cambiano la logica del programma ne correggono gli errori.

Esempio riferito a TypeScript **5.9.3** e Node **24.14.0**, con esecuzione del JavaScript compilato.

## Quando usarlo

- Leggere stack trace riferiti alle righe originali.
- Impostare breakpoint nei sorgenti con un debugger compatibile.
- Ricostruire errori di una build minificata, disponendo delle sue mappe esatte.

## Come funziona

Con `sourceMap: true`, `tsc` produce il JavaScript, il relativo `.js.map` e un commento `sourceMappingURL` nell'output. La mappa contiene percorsi dei sorgenti e associazioni tra posizioni, non necessariamente il contenuto dei sorgenti.

Il consumatore deve caricarla e applicarla. Per gli stack trace di Node usa `--enable-source-maps`; la sola generazione del file non basta. Un debugger puo avere una gestione propria delle mappe.

## API / Sintassi

`tsconfig.json` completo per l'esempio:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": ["node"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "noEmitOnError": true,
    "rootDir": "src",
    "outDir": "dist",
    "sourceMap": true
  },
  "include": ["src"]
}
```

Prerequisiti: `typescript` e `@types/node` locali. `package.json` minimo:

```json
{
  "private": true,
  "type": "module"
}
```

## Esempio pratico

`src/app.ts` genera intenzionalmente un errore; serve a confrontare gli stack trace, non e un programma che deve terminare con successo.

```ts
type Operand = number;

function divide(a: Operand, b: Operand): number {
  if (b === 0) {
    throw new Error("Divisione per zero");
  }

  return a / b;
}

divide(10, 0);
```

Compila dalla radice del progetto:

```sh
npm exec -- tsc -p tsconfig.json
```

Esegui senza supporto mappe: lo stack indica `dist/app.js`.

```sh
node dist/app.js
```

Esegui con supporto mappe: lo stack indica `src/app.ts`, alla riga del `throw`.

```sh
node --enable-source-maps dist/app.js
```

**Entrambi i comandi terminano con errore**, perche la divisione per zero resta invariata. Percorsi assoluti e formattazione dello stack dipendono dalla piattaforma.

### Breakpoint con Node

Per avviare il processo in pausa e collegare un debugger compatibile con Node Inspector:

```sh
node --inspect-brk=127.0.0.1:9229 --enable-source-maps dist/app.js
```

Collega il debugger alla porta locale, apri `src/app.ts`, imposta un breakpoint nel corpo della funzione e riprendi l'esecuzione. Se il breakpoint resta non associato, verifica che il debugger carichi `dist/app.js.map` e che i percorsi dei sorgenti siano raggiungibili.

Il processo resta in attesa finche non viene ripreso o terminato. Usa una porta libera e **non esporre Inspector su interfacce pubbliche**: offre controllo sull'esecuzione del processo.

## Varianti

| Opzione | Effetto |
| --- | --- |
| `sourceMap` | Mappa esterna separata dal JavaScript |
| `inlineSourceMap` | Mappa incorporata nel JavaScript; alternativa a `sourceMap`, non cumulabile |
| `inlineSources` | Contenuto TypeScript in `sourcesContent`; richiede una delle due opzioni precedenti |
| `declarationMap` | Mappa delle dichiarazioni `.d.ts` per la navigazione editor, non degli stack runtime |

Con `noEmit: true`, `tsc` non produce mappe JavaScript: vanno configurate nello strumento che produce il codice. Se piu strumenti trasformano l'output, devono preservare e combinare le mappe lungo la catena; una mappa precedente alla minificazione non descrive automaticamente il bundle finale.

In produzione puoi conservare le mappe privatamente e usarle per analisi offline o con un servizio di error tracking. L'upload a un servizio e una scelta della pipeline, non un requisito universale.

## Errori comuni

- Analizzare JavaScript e mappe di build diverse.
- Confondere `inlineSourceMap` con `inlineSources`: incorporano contenuti diversi.
- Pubblicare `sourcesContent` senza valutare la visibilita del sorgente.
- Togliere solo `sourceMappingURL` e considerare la mappa protetta: se il server continua a servirla, resta scaricabile.
- Cercare di nascondere segreti disabilitando le mappe: non devono essere presenti neanche nel JavaScript distribuito.
- Personalizzare `Error.prepareStackTrace` senza preservare la gestione delle mappe.

## Checklist

- La build corrente contiene le mappe previste?
- Lo stack con mappe punta alla riga TypeScript corretta?
- Il debugger riesce a reperire i sorgenti o il loro contenuto incorporato?
- Dopo bundling e minificazione la corrispondenza e ancora valida?
- La politica di pubblicazione delle mappe e esplicita e verificata?

## Fonti

- [TypeScript: sourceMap](https://www.typescriptlang.org/tsconfig/sourceMap.html)
- [inlineSourceMap](https://www.typescriptlang.org/tsconfig/inlineSourceMap.html)
- [inlineSources](https://www.typescriptlang.org/tsconfig/inlineSources.html)
- [Node 24.14.0: enable-source-maps](https://nodejs.org/download/release/v24.14.0/docs/api/cli.html#--enable-source-maps)
- [Node: sicurezza del debugger](https://nodejs.org/en/learn/getting-started/debugging#security-implications)

## Collegamenti

- [[Programmazione/TypeScript/Pagine/tsconfig|tsconfig]]
- [[Programmazione/TypeScript/Pagine/TypeScript con Node.js|TypeScript con Node.js]]
- [[Programmazione/TypeScript/Pagine/Testing in TypeScript|Testing in TypeScript]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
