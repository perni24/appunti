---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, path-aliases, tsconfig, module-resolution]
aliases: [Path alias TypeScript, paths]
prerequisites: [tsconfig, Module resolution]
related: [Moduli ES e CommonJS, TypeScript monorepo]
---

# Path aliases

## Sintesi

I path aliases permettono di usare import con prefissi leggibili, come `@/services/UserService`, invece di percorsi relativi lunghi come `../../../services/UserService`.

Sono utili per migliorare leggibilita e stabilita degli import, ma vanno configurati anche nel runtime, bundler o test runner.

## Quando usarlo

- Progetti con molte cartelle annidate.
- Frontend con struttura `src`.
- Backend Node.js con layer separati.
- Monorepo o librerie interne.
- Codebase dove i percorsi relativi diventano fragili.

## Come funziona

In `tsconfig.json` si configurano `baseUrl` e `paths`. TypeScript usa queste regole per type checking e risoluzione durante la compilazione.

Il codice emesso, pero, puo mantenere gli stessi import. Per questo anche bundler, Node.js, Jest, Vitest o ts-node devono conoscere gli alias.

## API / Sintassi

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    }
  }
}
```

## Esempio pratico

```ts
import { createUser } from "@/features/users/createUser";
import { db } from "@/shared/db";
```

Questi import sono piu stabili rispetto a percorsi relativi profondi, ma funzionano solo se toolchain e runtime risolvono `@`.

## Varianti

- **Alias root**: `@/* -> src/*`.
- **Alias per layer**: `@domain/*`, `@infra/*`, `@app/*`.
- **Alias monorepo**: puntano a package interni.
- **Package exports**: alternativa piu robusta per librerie pubblicate.

## Errori comuni

- **Configurare alias solo in TypeScript**: il codice puo compilare ma fallire a runtime.
- **Alias troppo generici**: nascondono confini architetturali.
- **Usare alias per import locali vicini**: peggiora leggibilita.
- **Creare dipendenze circolari invisibili**: alias ampi possono mascherarle.

## Checklist

- Configurare alias in TypeScript e nel bundler/runtime.
- Tenere pochi alias chiari.
- Preferire import relativi per file vicini.
- Verificare test runner e lint.
- Usare alias per confini architetturali reali, non per estetica.

## Collegamenti

- [[tsconfig]]
- [[Module resolution]]
- [[TypeScript monorepo]]
