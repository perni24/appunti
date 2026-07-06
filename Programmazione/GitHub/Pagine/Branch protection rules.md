---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, branch-protection, repository, sicurezza]
aliases: [Branch protection rules, Protezione branch GitHub]
prerequisites: [Branch su GitHub, Pull request]
related: [Required status checks, Repository rulesets]
---

# Branch protection rules

## Sintesi

Le **branch protection rules** proteggono branch importanti, come `main`, impedendo modifiche non controllate. Servono a obbligare pull request, review, controlli automatici e altre condizioni prima del merge.

Sono una delle impostazioni piu importanti per evitare che codice instabile, non revisionato o non testato entri nel ramo principale.

## Quando usarlo

Usale quando:

- `main` deve restare stabile;
- lavori con piu persone;
- vuoi impedire push diretti;
- vuoi richiedere review prima del merge;
- vuoi obbligare test e lint;
- vuoi applicare regole diverse a branch di release.

## Come funziona

Una regola di protezione si applica a un pattern di branch, per esempio:

```text
main
release/*
```

Puoi configurare condizioni come:

- pull request obbligatoria;
- numero minimo di review;
- review da code owner;
- status check richiesti;
- branch aggiornato prima del merge;
- divieto di force push;
- divieto di deletion.

## API / Sintassi

Esempio di policy concettuale:

```text
Branch: main
Require pull request: yes
Required approvals: 1
Require status checks: test, lint, build
Allow force pushes: no
Allow deletions: no
```

Da GitHub CLI puoi aprire direttamente le impostazioni del repository:

```bash
gh repo view --web
```

## Esempio pratico

Per un progetto applicativo:

1. proteggi `main`;
2. richiedi pull request;
3. richiedi almeno una review;
4. richiedi CI verde;
5. blocca force push;
6. elimina i branch dopo merge.

Questa configurazione rende difficile rompere il branch principale per errore.

## Varianti

- **Protezione minima**: PR obbligatoria e niente force push.
- **Protezione team**: PR, review e status check.
- **Protezione code owner**: review obbligatoria dalle aree competenti.
- **Protezione release**: regole piu rigide su `release/*`.
- **Protezione amministratori**: applica regole anche agli admin, quando necessario.

## Errori comuni

- Proteggere `main` ma lasciare force push abilitato.
- Richiedere status check con nomi instabili.
- Non proteggere branch di release.
- Rendere la regola cosi rigida da bloccare hotfix senza procedura.
- Non aggiornare regole quando cambia la CI.
- Dare eccezioni permanenti invece di risolvere il workflow.

## Checklist

- `main` e protetto?
- Le pull request sono obbligatorie?
- Le review richieste sono proporzionate al rischio?
- I controlli CI principali sono richiesti?
- Force push e deletion sono disabilitati?
- Le regole sono documentate per il team?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Branch su GitHub]]
- [[Pull request]]
- [[Review code su GitHub]]
- [[Required status checks]]
- [[Repository rulesets]]
