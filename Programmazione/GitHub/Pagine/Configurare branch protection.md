---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
difficulty: intermedio
tags: [github, branch-protection, repository, procedura]
aliases: [Configurare branch protection, Configurare protezione branch GitHub]
prerequisites: [Branch protection rules, Required status checks]
related: [Repository rulesets, CODEOWNERS, Configurare una pipeline CI con GitHub Actions]
---

# Configurare branch protection

## Obiettivo

Configurare regole che impediscono modifiche rischiose sul branch principale, richiedendo review, status check e policy di merge prima di accettare codice.

Branch protection serve a trasformare convenzioni di team in vincoli effettivi.

## Quando usarlo

Usalo quando:

- il repository e condiviso;
- `main` o `master` rappresentano codice stabile;
- esiste una pipeline CI;
- vuoi richiedere review;
- vuoi impedire push diretti;
- vuoi proteggere release branch.

## Procedura

1. Apri repository settings.
2. Vai nella sezione branch protection o rulesets.
3. Crea una regola per il branch principale.
4. Richiedi pull request prima del merge.
5. Richiedi almeno una review.
6. Richiedi status checks aggiornati.
7. Se usi CODEOWNERS, richiedi review dai code owner.
8. Blocca force push e deletion.
9. Valuta se applicare le regole anche agli admin.
10. Salva e prova una PR reale.

## Snippet

Configurazione minima consigliata:

```text
Branch pattern: main
Require pull request before merging: yes
Required approvals: 1
Require status checks: yes
Require branches to be up to date: yes
Require conversation resolution: yes
Allow force pushes: no
Allow deletions: no
```

## Adattamenti comuni

- **Repository personale**: regole leggere, almeno CI prima del merge.
- **Team piccolo**: una review e CI obbligatoria.
- **Repository critico**: code owners, signed commits, required status checks e regole applicate agli admin.
- **Monorepo**: combina branch protection con CODEOWNERS.
- **Organizzazione**: valuta repository rulesets per standardizzare piu repository.

## Debug rapido

- Se uno status check non appare, prima deve esistere almeno una run del workflow.
- Se la PR non puo fare merge, leggi quale requirement manca.
- Se CODEOWNERS non viene richiesto, controlla path e sintassi del file.
- Se gli admin possono bypassare, controlla l'opzione relativa.
- Se la regola non si applica, verifica pattern del branch.

## Checklist finale

- Il branch principale e coperto.
- Le PR sono obbligatorie.
- Le review sono obbligatorie.
- I required status checks sono corretti.
- Force push e deletion sono bloccati.
- CODEOWNERS e configurato se serve.
- Il comportamento e stato testato con una PR.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Branch protection rules]]
- [[Required status checks]]
- [[Repository rulesets]]
- [[CODEOWNERS]]
- [[Repository settings]]
- [[Configurare una pipeline CI con GitHub Actions]]

## Fonti

- [GitHub Docs - About protected branches](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches/about-protected-branches)
