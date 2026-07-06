---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, status-checks, ci, pull-request]
aliases: [Required status checks, Status checks GitHub]
prerequisites: [Pull request, Branch protection rules]
related: [Branch protection rules, GitHub Actions]
---

# Required status checks

## Sintesi

I **required status checks** sono controlli che devono passare prima di poter unire una pull request. Di solito corrispondono a test, lint, build, analisi statica o controlli di sicurezza eseguiti da CI.

Sono il ponte tra collaborazione e automazione: una review umana non dovrebbe sostituire i controlli automatici ripetibili.

## Quando usarlo

Usali quando:

- vuoi impedire merge con test falliti;
- vuoi richiedere lint o build;
- vuoi garantire che la CI giri su ogni PR;
- vuoi proteggere `main`;
- vuoi bloccare regressioni automatiche;
- vuoi imporre controlli di sicurezza prima del merge.

## Come funziona

Uno status check e un risultato associato a un commit. GitHub lo mostra nella pull request.

Una branch protection rule o un ruleset puo richiedere che specifici check siano verdi prima del merge.

Esempi di check:

- `test`;
- `lint`;
- `build`;
- `typecheck`;
- `security-scan`;
- `e2e`.

## API / Sintassi

Esempio concettuale:

```text
Required checks:
- test
- lint
- build
```

Con GitHub CLI puoi vedere i check di una PR:

```bash
gh pr checks
```

Oppure una PR specifica:

```bash
gh pr checks 123
```

## Esempio pratico

Policy per progetto TypeScript:

```text
Required status checks:
- npm test
- npm run lint
- npm run typecheck
- npm run build
```

Se `typecheck` fallisce, GitHub blocca il merge finche la pull request non viene corretta.

## Varianti

- **Check CI**: test, build, lint.
- **Check sicurezza**: secret scanning, dependency scanning, SAST.
- **Check di deploy preview**: verifica ambiente temporaneo.
- **Check matrix**: piu versioni di runtime o sistemi operativi.
- **Check esterni**: servizi integrati oltre GitHub Actions.

## Errori comuni

- Richiedere check con nomi che cambiano tra workflow.
- Rendere obbligatori check lenti o instabili senza motivo.
- Non richiedere test essenziali.
- Consentire merge quando la CI e skipped.
- Non aggiornare required checks dopo rinomina workflow.
- Confondere review approvata con codice verificato.

## Checklist

- I check obbligatori sono quelli davvero critici?
- I nomi dei check sono stabili?
- I check girano su pull request?
- La CI fallisce se test o lint falliscono?
- I check non sono inutilmente lenti?
- Le regole sono aggiornate quando cambia la pipeline?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Pull request]]
- [[Branch protection rules]]
- [[Repository rulesets]]
