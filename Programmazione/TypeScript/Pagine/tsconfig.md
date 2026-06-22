---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, tsconfig, configurazione, compiler]
aliases: [tsconfig.json, TypeScript config]
prerequisites: [Introduzione a TypeScript]
related: [Strict mode, Module resolution, Path aliases, Project references]
---

# tsconfig

## Sintesi

`tsconfig.json` e il file di configurazione principale di TypeScript. Definisce quali file fanno parte del progetto e come il compilatore deve controllarli o trasformarli in JavaScript.

Una buona configurazione TypeScript e importante quanto i tipi nel codice: decide severita del type checking, formato dei moduli, target JavaScript, source map, path alias e integrazione con tool esterni.

## Quando usarlo

- In qualsiasi progetto TypeScript non banale.
- Quando vuoi abilitare `strict`.
- Quando devi configurare output JavaScript.
- Quando usi path alias o monorepo.
- Quando vuoi separare configurazioni per app, test, build o librerie.

## Come funziona

Il file contiene opzioni come `compilerOptions`, `include`, `exclude`, `files` e, nei progetti composti, `references`.

`compilerOptions` controlla il comportamento del compilatore. `include` ed `exclude` stabiliscono quali file entrano nel programma TypeScript.

## API / Sintassi

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

## Esempio pratico

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "outDir": "dist",
    "rootDir": "src",
    "sourceMap": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
```

Questa configurazione e tipica per un progetto Node.js TypeScript che compila da `src` a `dist`.

## Varianti

- **App con bundler**: spesso usa `moduleResolution: "Bundler"` e `noEmit: true`.
- **Node.js moderno**: spesso usa `module` e `moduleResolution` con `NodeNext`.
- **Libreria**: richiede attenzione a `declaration`, `outDir`, `exports` e formato modulo.
- **Monorepo**: usa `references` e configurazioni condivise.

## Errori comuni

- **Disabilitare `strict` senza motivo**: riduce molto il valore di TypeScript.
- **Confondere `target` e `module`**: il primo riguarda sintassi JS emessa, il secondo il sistema moduli.
- **Usare path alias senza configurare runtime/bundler**: TypeScript compila, ma Node o il bundler non risolvono.
- **Mettere tutto in un solo tsconfig**: test, app e build possono avere esigenze diverse.

## Checklist

- Abilitare `strict` nei nuovi progetti.
- Scegliere `module` e `moduleResolution` coerenti con runtime e bundler.
- Definire chiaramente `include` ed `exclude`.
- Usare `noEmit` se la build e gestita da un bundler.
- Separare configurazioni quando app, test e build hanno requisiti diversi.

## Collegamenti

- [[Strict mode]]
- [[Module resolution]]
- [[Path aliases]]
- [[Project references]]
