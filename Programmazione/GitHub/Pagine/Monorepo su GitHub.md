---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, monorepo, repository, architettura]
aliases: [Monorepo su GitHub, Monorepo GitHub]
prerequisites: [Repository GitHub, Branch su GitHub]
related: [Repository GitHub, CODEOWNERS, GitHub Projects]
---

# Monorepo su GitHub

## Sintesi

Un **monorepo** e un repository che contiene piu progetti, package o servizi collegati. Su GitHub puo semplificare condivisione di codice, issue, pull request e automazioni, ma richiede disciplina su struttura, ownership e CI.

Il monorepo non e automaticamente migliore di piu repository: funziona bene quando i progetti hanno forte relazione tecnica o di rilascio.

## Quando usarlo

Valuta un monorepo quando:

- piu package condividono codice;
- frontend e backend cambiano spesso insieme;
- vuoi pull request atomiche su piu componenti;
- vuoi standard unificati di tooling;
- vuoi gestione centralizzata di issue e CI;
- hai dipendenze interne frequenti.

Evitalo se i progetti sono indipendenti, hanno team e release completamente separati o richiedono permessi molto diversi.

## Come funziona

Una struttura tipica:

```text
repo/
  apps/
    web/
    api/
  packages/
    ui/
    config/
  docs/
  .github/
    workflows/
```

GitHub gestisce il repository come un'unica entita. Devi quindi progettare:

- naming delle cartelle;
- CODEOWNERS per aree;
- workflow che girano solo dove serve;
- issue label per componente;
- policy di review;
- strategia di release.

## API / Sintassi

Esempio label per monorepo:

```text
area: web
area: api
area: ui
area: docs
```

Esempio CODEOWNERS:

```text
/apps/web/ @frontend-team
/apps/api/ @backend-team
/packages/ui/ @design-system-team
```

## Esempio pratico

Una pull request puo modificare insieme:

```text
packages/ui/Button.tsx
apps/web/ProfilePage.tsx
```

Questo e utile se la modifica al componente UI e necessaria per aggiornare una pagina. In un multi-repo avresti bisogno di coordinare due PR e due release.

## Varianti

- **Monorepo applicativo**: app e backend nello stesso repository.
- **Monorepo package**: piu librerie correlate.
- **Monorepo documentale**: docs e esempi insieme al codice.
- **Polyrepo**: repository separati per ogni progetto.
- **Hybrid**: monorepo per componenti collegati e repo separati per sistemi indipendenti.

## Errori comuni

- Mettere progetti non correlati nello stesso repository.
- Far girare tutta la CI per ogni piccola modifica.
- Non definire ownership per cartelle.
- Non distinguere release indipendenti e release coordinate.
- Usare label troppo generiche.
- Sottovalutare permessi e visibilita.

## Checklist

- I progetti sono davvero collegati?
- La struttura cartelle e leggibile?
- CODEOWNERS copre le aree principali?
- La CI e filtrata per path quando possibile?
- Le label indicano componente o area?
- La strategia di release e chiara?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Repository GitHub]]
- [[Branch su GitHub]]
- [[CODEOWNERS]]
- [[GitHub Projects]]

## Fonti

- [GitHub Docs - About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)
