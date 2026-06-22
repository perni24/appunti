---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [typescript, monorepo, project-references, workspace]
aliases: [Monorepo TypeScript]
prerequisites: [Project references, Path aliases, tsconfig]
related: [API tipizzate, Generazione di tipi da API]
---

# TypeScript monorepo

## Sintesi

Un monorepo TypeScript contiene piu app e package nello stesso repository. Permette di condividere tipi, librerie interne, configurazioni e contratti, ma richiede disciplina su confini, build e dipendenze.

Il rischio principale e creare accoppiamento invisibile tra package.

## Quando usarlo

- Frontend e backend nello stesso repo.
- Librerie interne condivise.
- Design system e app.
- SDK generati e contratti API.
- Team che vuole refactor atomici tra package.

## Come funziona

Si usano workspace del package manager, configurazioni `tsconfig` condivise, project references o tool di build. Ogni package dovrebbe avere confini chiari e dipendenze dichiarate.

## API / Sintassi

```text
apps/
  web/
  api/
packages/
  domain/
  ui/
  config/
```

## Esempio pratico

```json
{
  "files": [],
  "references": [
    { "path": "./packages/domain" },
    { "path": "./apps/api" },
    { "path": "./apps/web" }
  ]
}
```

Il root `tsconfig` coordina i progetti TypeScript referenziati.

## Varianti

- **Package workspace**: npm, pnpm o yarn workspaces.
- **Project references**: build incrementale TypeScript.
- **Shared tsconfig**: configurazione comune.
- **Internal packages**: pacchetti non pubblicati.
- **Generated contracts**: tipi generati condivisi tra app.

## Errori comuni

- **Usare path alias al posto di dipendenze package reali**.
- **Dipendenze circolari tra package**.
- **Condividere troppo dominio tra frontend e backend**.
- **Non separare build e test per package**.
- **Configurazioni TypeScript divergenti senza motivo**.

## Checklist

- Definire confini tra package.
- Dichiarare dipendenze in `package.json`.
- Usare project references se la codebase e grande.
- Separare tipi condivisi da implementazioni runtime.
- Verificare che ogni package possa essere buildato/testato isolatamente.

## Collegamenti

- [[Project references]]
- [[Path aliases]]
- [[API tipizzate]]
- [[Generazione di tipi da API]]
