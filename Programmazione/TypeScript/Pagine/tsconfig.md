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
  - tsconfig
  - configurazione
  - compiler
aliases:
  - tsconfig.json
  - TypeScript config
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/Introduzione a TypeScript]]"
related:
  - "[[Programmazione/TypeScript/Pagine/Strict mode]]"
  - "[[Programmazione/TypeScript/Pagine/Module resolution]]"
  - "[[Programmazione/TypeScript/Pagine/Path aliases]]"
  - "[[Programmazione/TypeScript/Pagine/Project references]]"
title: tsconfig
---

# tsconfig

## Sintesi

`tsconfig.json` descrive un progetto TypeScript: file iniziali, controlli, risoluzione degli import e output. Non configura da solo Node, un bundler o il browser.

Gli esempi sono riferiti a TypeScript **5.9.3** e, per l'esecuzione, Node **24.14.0**. Sono una base verificabile, non una configurazione universale.

## Quando usarlo

- Riprodurre gli stessi controlli in editor, terminale e CI.
- Separare configurazioni di applicazione, test e librerie.
- Decidere se `tsc` deve emettere JavaScript oppure controllare soltanto i tipi.

## Come funziona

### File del progetto

`files` elenca file iniziali espliciti; `include` li cerca tramite pattern. `exclude` filtra la ricerca di `include`: **non impedisce a un file importato di entrare nel programma**. Lo stesso vale per dipendenze richiamate da dichiarazioni di tipo.

`rootDir` stabilisce la radice dei percorsi nell'output, non seleziona i sorgenti. Con `rootDir: "src"` e `outDir: "dist"`, `src/utils/math.ts` diventa `dist/utils/math.js`. Un sorgente da emettere fuori da `rootDir` causa un errore, non viene ignorato.

### Opzioni con responsabilita diverse

| Opzione | Responsabilita |
| --- | --- |
| `target` | Sintassi JavaScript emessa; non installa polyfill |
| `lib` | Dichiarazioni delle API standard disponibili al controllo statico |
| `types` | Pacchetti di tipi inclusi automaticamente, per esempio `node` |
| `module` e `moduleResolution` | Formato dei moduli e regole con cui vengono cercati |
| `strict` | Famiglia di controlli sui tipi |
| `noEmit` | Nessuna emissione di JavaScript, dichiarazioni o mappe |
| `noEmitOnError` | Blocca l'emissione del progetto se ci sono errori |

`types` non e una whitelist degli import: le dichiarazioni di un pacchetto importato possono comunque essere caricate. `lib: ["ES2022"]` evita di aggiungere implicitamente il DOM a un backend, ma non garantisce che ogni API dichiarata sia presente nel runtime.

## API / Sintassi

Profilo per un'app con bundler: il bundler produce l'output, TypeScript controlla i tipi. File `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "strict": true,
    "noEmit": true
  },
  "include": ["src"]
}
```

In questo profilo le librerie predefinite comprendono anche il DOM. Va adattato se l'app non gira in browser.

## Esempio pratico

Progetto Node compilato. Prerequisiti: `typescript` e `@types/node` installati come dipendenze di sviluppo; scegli i tipi Node in base al runtime supportato e conserva il lockfile. I comandi seguenti si eseguono dalla radice del progetto.

`package.json` minimo, da integrare con le dipendenze del progetto:

```json
{
  "private": true,
  "type": "module"
}
```

`tsconfig.json`:

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
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

`src/app.ts`:

```ts
const message: string = "Configurazione pronta";
console.log(message);
```

Compila:

```sh
npm exec -- tsc -p tsconfig.json
```

Esegui: stampa `Configurazione pronta`.

```sh
node dist/app.js
```

Controlla senza produrre una nuova build:

```sh
npm exec -- tsc -p tsconfig.json --noEmit
```

Mostra la configurazione effettiva:

```sh
npm exec -- tsc -p tsconfig.json --showConfig
```

Per capire perche un file e incluso:

```sh
npm exec -- tsc -p tsconfig.json --noEmit --explainFiles
```

Con TypeScript 5.9.3, passare direttamente un sorgente a `tsc` fa ignorare il `tsconfig.json`; `-p` non si combina con una lista di sorgenti. Usa `-p` anche in CI per evitare controlli diversi da quelli dell'editor.

## Varianti

- **Configurazioni condivise**: `extends` eredita una base. I percorsi relativi restano riferiti al file che li definisce; `files`, `include` ed `exclude` ridefiniti sostituiscono quelli della base, non si concatenano. `references` non viene ereditato.
- **Librerie**: aggiungi dichiarazioni con `declaration`; verifica anche `package.json` ed export pubblici.
- **Progetti multipli**: usa project references e `tsc -b`, non soltanto `extends`.
- **`skipLibCheck`**: salta il controllo interno dei file di dichiarazione. Non disabilita il controllo del tuo codice, non risolve versioni di tipi incompatibili e non verifica il runtime.

## Errori comuni

- Scambiare `exclude` per un confine architetturale.
- Aggiungere `lib` o `@types` aspettandosi nuove funzionalita a runtime.
- Usare `noEmit` e poi eseguire una vecchia cartella `dist`: l'opzione non la cancella.
- Pensare che `noEmitOnError` rimuova output precedenti: una build fallita puo lasciare artefatti vecchi.
- Aspettarsi che `tsc` raggruppi i moduli in un bundle o copi automaticamente asset e configurazioni.

## Checklist

- Il comando seleziona esplicitamente il progetto corretto?
- `target`, tipi ambientali e formato corrispondono all'ambiente reale?
- I file inclusi sono quelli attesi?
- Il codice emesso parte davvero nel runtime di destinazione?
- La CI interrompe la pubblicazione quando il controllo fallisce?

## Fonti

- [TSConfig Reference](https://www.typescriptlang.org/tsconfig/)
- [rootDir](https://www.typescriptlang.org/tsconfig/rootDir.html)
- [extends](https://www.typescriptlang.org/tsconfig/extends.html)
- [What is a tsconfig.json](https://www.typescriptlang.org/docs/handbook/tsconfig-json.html)

## Collegamenti

- [[Programmazione/TypeScript/Pagine/Strict mode|Strict mode]]
- [[Programmazione/TypeScript/Pagine/Module resolution|Module resolution]]
- [[Programmazione/TypeScript/Pagine/Path aliases|Path aliases]]
- [[Programmazione/TypeScript/Pagine/Project references|Project references]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
