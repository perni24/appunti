---
date: 2026-06-22
area: Programmazione
topic: TypeScript
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [typescript, project-references, monorepo, build]
aliases: [TypeScript project references]
prerequisites: [tsconfig]
related: [TypeScript monorepo, Path aliases]
---

# Project references

## Sintesi

Le project references permettono di dividere una codebase TypeScript in piu progetti collegati. Sono utili in monorepo, librerie interne e codebase grandi, per migliorare build incrementali e confini tra moduli.

Ogni progetto ha il proprio `tsconfig` e puo dichiarare dipendenze verso altri progetti.

## Quando usarlo

- Monorepo con piu package.
- Applicazioni grandi con librerie interne.
- Build TypeScript lente.
- Separazione tra app, domain, shared e tooling.
- Librerie che devono generare declaration files.

## Come funziona

Un progetto referenziabile usa `composite: true`. Un `tsconfig` superiore elenca i progetti in `references`. TypeScript puo poi compilare con `tsc --build`, rispettando l'ordine delle dipendenze.

## API / Sintassi

```json
{
  "files": [],
  "references": [
    { "path": "./packages/domain" },
    { "path": "./packages/app" }
  ]
}
```

Nel progetto referenziato:

```json
{
  "compilerOptions": {
    "composite": true,
    "declaration": true
  }
}
```

## Esempio pratico

```text
packages/
  domain/
    tsconfig.json
  api/
    tsconfig.json
tsconfig.json
```

`api` puo referenziare `domain`, e `tsc --build` compila prima `domain` e poi `api`.

## Varianti

- **Root build config**: solo `references`, senza sorgenti.
- **Package config**: `composite`, `declaration`, `outDir`.
- **Solution-style tsconfig**: usato da editor e build.
- **Monorepo con package manager**: combinato con workspace npm/pnpm/yarn.

## Errori comuni

- **Dimenticare `composite`**: i progetti referenziati devono abilitarlo.
- **Mescolare path alias e references senza strategia**: puo creare confusione.
- **Dipendenze circolari tra progetti**: bloccano architettura e build.
- **Usare references in progetti piccoli**: aggiunge complessita non necessaria.

## Checklist

- Usare project references solo quando la codebase e abbastanza grande.
- Definire confini di progetto chiari.
- Abilitare `composite` nei progetti referenziati.
- Usare `tsc --build` per compilazioni incrementali.
- Evitare dipendenze circolari tra package.

## Collegamenti

- [[tsconfig]]
- [[Path aliases]]
- [[TypeScript monorepo]]
