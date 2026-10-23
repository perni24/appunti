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
  - project-references
  - monorepo
  - build
aliases:
  - TypeScript project references
prerequisites:
  - "[[Programmazione/TypeScript/Pagine/tsconfig]]"
related:
  - "[[Programmazione/TypeScript/Pagine/TypeScript monorepo]]"
  - "[[Programmazione/TypeScript/Pagine/Path aliases]]"
title: Project references
---

# Project references

## Sintesi

Le project references descrivono dipendenze tra progetti TypeScript con configurazioni separate. `tsc -b` usa questo grafo per compilare nell'ordine necessario e riutilizzare risultati aggiornati.

Non sono alias, non installano pacchetti e non creano un bundle. Esempio riferito a TypeScript **5.9.3** e Node **24.14.0**.

## Quando usarlo

- Una codebase ha componenti con confini e build realmente distinti.
- Vuoi controllare separatamente una libreria interna e l'app che la usa.
- I benefici delle build incrementali giustificano piu configurazioni.

Per un'app piccola con un solo output, un normale `tsconfig` puo bastare.

## Come funziona

Il progetto consumatore dichiara una `reference` verso quello da cui dipende. Il progetto referenziato usa `composite: true` e produce dichiarazioni; il consumatore viene controllato usando quei contratti.

Con `composite`, i file di implementazione devono essere coperti da `include` o `files`. Senza un `rootDir` esplicito, la radice predefinita e la directory del `tsconfig`.

`tsc -p` non orchestra la build delle dipendenze. `tsc -b` percorre il grafo, aggiorna i progetti necessari e registra informazioni incrementali in `.tsbuildinfo`. Questi file sono cache, non codice runtime.

## API / Sintassi

Config di soluzione alla radice, `tsconfig.json`:

```json
{
  "files": [],
  "references": [
    { "path": "./packages/domain" },
    { "path": "./packages/api" }
  ]
}
```

`files: []` evita di ricompilare i sorgenti come un unico progetto root. Elencare due progetti qui non dichiara la dipendenza tra loro: la reference da `api` a `domain` va nel config di `api`.

## Esempio pratico

Prerequisiti: `typescript` e `@types/node` locali nella radice. I file da creare sono:

```text
project/
  package.json
  tsconfig.json
  packages/
    domain/
      tsconfig.json
      src/
        index.ts
    api/
      tsconfig.json
      src/
        main.ts
```

`package.json` minimo della radice:

```json
{
  "private": true,
  "type": "module"
}
```

`packages/domain/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": ["node"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "composite": true,
    "declaration": true,
    "noEmitOnError": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"]
}
```

`packages/api/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["ES2022"],
    "types": ["node"],
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "composite": true,
    "declaration": true,
    "noEmitOnError": true,
    "rootDir": "src",
    "outDir": "dist"
  },
  "include": ["src"],
  "references": [{ "path": "../domain" }]
}
```

`packages/domain/src/index.ts`:

```ts
export function greeting(name: string): string {
  return "Ciao " + name;
}
```

`packages/api/src/main.ts`:

```ts
import { greeting } from "../../domain/dist/index.js";

console.log(greeting("Ada"));
```

Il percorso relativo verso `dist` rende l'esempio autonomo, senza workspace npm. Funziona anche dall'output `packages/api/dist/main.js`. In un monorepo reale preferisci un pacchetto interno con `exports` e dipendenza dichiarata nel package manager; conserva comunque la reference TypeScript.

Compila dalla radice:

```sh
npm exec -- tsc -b --stopBuildOnErrors
```

Esegui: stampa `Ciao Ada`.

```sh
node packages/api/dist/main.js
```

Ripeti la build con log: senza modifiche i progetti risultano aggiornati.

```sh
npm exec -- tsc -b --verbose --stopBuildOnErrors
```

### Errori e artefatti precedenti

Da TypeScript 5.6, la modalita build puo proseguire sui progetti a valle anche dopo errori. In questo esempio:

- `noEmitOnError` blocca nuovi output di codice e dichiarazioni nel progetto errato;
- `--stopBuildOnErrors` evita di costruire i progetti che dipendono da quello errato;
- la CI deve comunque considerare il codice di uscita non zero un fallimento.

Il flag si chiama `stopBuildOnErrors` in TypeScript 5.9.3. Nessuna di queste opzioni elimina automaticamente gli output di una build precedente: non distribuirli dopo un controllo fallito.

## Varianti

Simula la build senza emettere file:

```sh
npm exec -- tsc -b --dry --verbose
```

Forza la ricompilazione, utile per verificare una cache sospetta:

```sh
npm exec -- tsc -b --force --stopBuildOnErrors
```

Pulizia: **elimina gli output riconosciuti dei progetti**, non i sorgenti. Controlla prima i percorsi; non e una cancellazione generica di ogni file presente in `dist`.

```sh
npm exec -- tsc -b --clean
```

`declarationMap` puo migliorare la navigazione ai sorgenti dagli editor. I workspace del package manager gestiscono invece installazione e collegamento dei package: sono un livello complementare.

## Errori comuni

- Configurare soltanto le references della root, senza quelle tra i consumatori.
- Condividere lo stesso percorso `tsBuildInfoFile` tra progetti distinti.
- Creare cicli nel grafo delle references.
- Confondere una build funzionante nell'editor con una build CLI riproducibile da checkout pulito.
- Aspettarsi che le references vietino ogni import privato: i confini pubblici richiedono anche export map e regole architetturali.

## Checklist

- I nomi e i percorsi dei progetti sono coerenti?
- Ogni dipendenza TypeScript ha la reference corretta?
- La build da zero genera sia JavaScript sia dichiarazioni?
- Un errore impedisce la distribuzione di artefatti vecchi?
- Il runtime trova i moduli senza dipendere dalle cache dell'editor?

## Fonti

- [TypeScript: Project References](https://www.typescriptlang.org/docs/handbook/project-references.html)
- [TypeScript 5.6: build con errori intermedi](https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-6.html#allow---build-with-intermediate-errors)
- [stopBuildOnErrors](https://www.typescriptlang.org/tsconfig/stopBuildOnErrors.html)

## Collegamenti

- [[Programmazione/TypeScript/Pagine/tsconfig|tsconfig]]
- [[Programmazione/TypeScript/Pagine/Path aliases|Path aliases]]
- [[Programmazione/TypeScript/Pagine/TypeScript monorepo|TypeScript monorepo]]


## Navigazione

- [[Programmazione/TypeScript/Indice TypeScript|Indice TypeScript]]
