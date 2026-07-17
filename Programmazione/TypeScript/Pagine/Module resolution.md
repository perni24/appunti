---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [typescript, module-resolution, modules, nodejs]
aliases: [Risoluzione moduli TypeScript]
prerequisites: [tsconfig, Moduli ES e CommonJS]
related: [Path aliases, TypeScript con Node.js]
---

# Module resolution

## Sintesi

La module resolution e il processo con cui TypeScript decide a quale file, pacchetto o dichiarazione corrisponde un import.

E una delle parti piu importanti della configurazione, perche un import deve essere valido sia per il compilatore sia per il runtime o bundler.

## Quando usarlo

- Quando un import non viene trovato.
- Quando usi Node.js ESM o CommonJS.
- Quando configuri Vite, Next.js, ts-node, Vitest o Jest.
- Quando usi path alias.
- Quando sviluppi librerie con export map.

## Come funziona

TypeScript legge `moduleResolution` in `tsconfig` e applica regole compatibili con un ambiente: Node classico, Node moderno, bundler o modalità legacy.

Le opzioni piu comuni nei progetti moderni sono `NodeNext` e `Bundler`.

## API / Sintassi

```json
{
  "compilerOptions": {
    "module": "NodeNext",
    "moduleResolution": "NodeNext"
  }
}
```

## Esempio pratico

```ts
import { createServer } from "node:http";
import { loadConfig } from "./config";
import { UserRepository } from "@/repositories/UserRepository";
```

TypeScript deve risolvere tre casi diversi: modulo built-in Node, file relativo e alias configurato.

## Varianti

- **`Node` / `Node10`**: modello storico CommonJS.
- **`Node16` / `NodeNext`**: regole moderne per ESM e CommonJS.
- **`Bundler`**: adatto a bundler che gestiscono risoluzione e output.
- **Classic**: modalità legacy, raramente utile.

## Errori comuni

- **Usare `moduleResolution` non coerente con `module`**: soprattutto in Node ESM.
- **Configurare path alias solo in TypeScript**: il runtime non li capisce automaticamente.
- **Ignorare `exports` dei pacchetti**: nei pacchetti moderni decide cosa e importabile.
- **Assumere che editor e build usino lo stesso tsconfig**: non sempre e vero.

## Checklist

- Scegliere `moduleResolution` in base a runtime/bundler.
- Verificare import relativi, alias e pacchetti npm.
- Allineare TypeScript, bundler, test runner e runtime.
- Controllare `package.json` dei pacchetti problematici.
- Non risolvere errori di import con `any` o dichiarazioni fittizie.

## Collegamenti

- [[tsconfig]]
- [[Moduli ES e CommonJS]]
- [[Path aliases]]
