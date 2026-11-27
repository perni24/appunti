---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - monorepo
  - repository
  - architettura
aliases:
  - Monorepo su GitHub
  - Monorepo GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/CODEOWNERS]]"
  - "[[Programmazione/GitHub/Pagine/GitHub Projects]]"
title: Monorepo su GitHub
---

# Monorepo su GitHub

## Sintesi

In un **monorepo** più applicazioni o pacchetti condividono la storia Git. Il vantaggio concreto è poter cambiare un contratto e i suoi consumatori nella **stessa PR**. Questo rende atomica la modifica nel repository, non il deploy: due servizi possono continuare a essere pubblicati in momenti diversi.

## Esempio: chi dipende dall’esportatore?

```text
apps/
  api/              # produce il report
  web/              # offre il download
packages/
  csv/              # intestazioni e serializzazione condivise
  ui/               # componenti usati dal frontend
docs/
.github/
  workflows/
```

Se cambia `packages/csv/`, i test del solo pacchetto possono passare anche se l’API o la web app si aspetta il vecchio nome della colonna. Prima della review identifica i consumatori e verifica il loro comportamento. Se invece cambi solo il testo in `docs/` può bastare la verifica della documentazione. Per vedere dalla base comune i percorsi modificati sul branch della PR, con `origin/main` aggiornato:

```bash
git diff --name-only origin/main...HEAD
```

L’elenco dice **che cosa è stato modificato**, non **che cosa ne dipende**. Per esempio, una PR che tocca solo `packages/csv/header.ts` può richiedere i test di `apps/api/` anche se quella cartella non compare nel diff.

## Ownership, CI e release

| Decisione | Esempio | Errore da evitare |
| --- | --- | --- |
| Chi fa review? | In `.github/CODEOWNERS` assegna le directory ai team competenti. | Gli owner non limitano chi può leggere una sottocartella. Se occorre isolamento di accesso, valuta repository separati. |
| Quali controlli devono partire? | Verifica il componente modificato, i consumatori e gli eventuali file di configurazione condivisi. | Un workflow interamente saltato per `paths` può lasciare un check obbligatorio in `Pending`, bloccando anche una PR solo documentale. |
| Come si pubblica? | Decidi se app e pacchetti hanno versioni indipendenti o coordinate; traccia cosa è già distribuito. | Un solo merge non assicura che produttore e consumatori cambino versione insieme. |

Esempio per un’organizzazione fittizia: usa **team visibili con accesso esplicito di scrittura** e sostituisci i nomi. Per il pacchetto condiviso i due owner sono sulla stessa riga:

```text
/apps/web/      @example-org/frontend
/apps/api/      @example-org/backend
/packages/ui/   @example-org/design-system
/packages/csv/  @example-org/backend @example-org/frontend
```

Le label `area: web` e `area: api` aiutano il triage, non attivano review per directory. Per una CI selettiva conserva un controllo obbligatorio che dia un esito per ogni PR pertinente e che fallisca se un test necessario non passa. Non rendere obbligatorio un workflow che il tuo stesso filtro può impedire di avviare.

## Quando preferire più repository

Se i componenti cambiano spesso insieme e possono condividere accessi e strumenti, la PR unica evita di coordinare aggiornamenti separati. Se devono avere visibilità diversa o cicli di vita davvero indipendenti, il costo di versionare un contratto tra repository può essere preferibile. È possibile anche una scelta mista: tenere insieme UI e web, e separare un servizio con proprietari o permessi diversi.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Branch su GitHub|Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/CODEOWNERS|CODEOWNERS]]
- [[Programmazione/GitHub/Pagine/GitHub Projects|GitHub Projects]]

## Fonti

- [GitHub Docs - About repositories](https://docs.github.com/en/repositories/creating-and-managing-repositories/about-repositories)
- [GitHub Docs: semantica dei percorsi e dei team in CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)
- [GitHub Docs: workflow saltati e check ancora in attesa](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/skip-workflow-runs)
- [Git: confronto dalla base comune con tre punti](https://git-scm.com/docs/git-diff)
