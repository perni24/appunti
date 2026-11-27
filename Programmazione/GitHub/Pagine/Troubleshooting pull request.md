---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - pull-request
  - troubleshooting
  - review
aliases:
  - Troubleshooting pull request
  - Troubleshooting PR GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Aprire una pull request corretta]]"
related:
  - "[[Programmazione/GitHub/Pagine/Review code su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Checklist pull request GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Troubleshooting merge conflict]]"
title: Troubleshooting pull request
---

# Troubleshooting pull request

## Obiettivo

Capire se manca **qualcosa da proporre**, se Git non riesce a combinare i branch oppure se GitHub attende un requisito di merge. Aggiornare o riscrivere il branch non risolve una review mancante.

## La PR non si apre o mostra i file sbagliati

Prima di cambiare il branch, controllare nella schermata di confronto le due coppie **repository + branch**: la base riceve la modifica, la head la propone. Nei fork i nomi dei branch possono coincidere ma gli owner differire. Verificare anche se esiste già una PR per lo stesso confronto.

In un clone sul branch della modifica, con i riferimenti remoti aggiornati, confrontare l'esempio con la propria situazione. Qui `origin/main` rappresenta la base: se la base è nel progetto originale e `origin` è il proprio fork, usare invece il riferimento del remoto corretto. Elencare i commit locali non raggiungibili dalla base:

```bash
git log --oneline origin/main..HEAD
```

Vedere quali file sono cambiati rispetto all'antenato comune:

```bash
git diff --name-status origin/main...HEAD
```

I due comandi rispondono a domande diverse: anche con commit propri, modifiche introdotte e poi annullate possono produrre un diff vuoto. Se il diff locale è corretto ma GitHub ne mostra un altro, confrontare lo SHA di `git rev-parse HEAD` con la punta **pubblicata** del branch proposto. I file non committati e i commit non inviati non entrano nella PR. Cambiare base soltanto se il destinatario è errato e ricontrollare il diff dopo il cambio.

## La PR esiste ma il merge è bloccato

Con GitHub CLI autenticata, sostituire `42` e `OWNER/REPO`. Lettura dello stato, senza modifiche alla PR:

```bash
gh pr view 42 --repo OWNER/REPO --json baseRefName,headRefName,headRefOid,isDraft,mergeable,reviewDecision
```

| Segnale | Controllo successivo |
| --- | --- |
| `mergeable: CONFLICTING` | Aprire i file segnalati e seguire [[Programmazione/GitHub/Pagine/Troubleshooting merge conflict\|la procedura per i conflitti]]. `UNKNOWN` non significa conflitto: il calcolo può non essere terminato. |
| Nessun conflitto, ma pulsante disabilitato | Leggere il requisito vicino al pulsante: bozza, approvazione richiesta, conversazioni irrisolte, regola sulla base aggiornata o permesso di merge. Git può unire i file anche quando la policy non lo consente. |
| Check atteso, fallito o apparentemente verde | Controllare i check richiesti sulla revisione corrente, non il deploy di un vecchio push. Un workflow saltato per filtro di percorso può lasciare il check in attesa. |
| Review ferma | Controllare revisori richiesti e regole CODEOWNERS sulla base. Se manca contesto, indicare perché serve la modifica, ordine di lettura e test eseguiti. Cambiare la cronologia non fornisce un'approvazione. |

Per isolare i check obbligatori:

```bash
gh pr checks 42 --repo OWNER/REPO --required
```

Un codice di uscita `8` indica check in attesa. La diagnosi è conclusa quando si sa **quale requisito manca, su quale revisione e chi può soddisfarlo**; non è necessario eseguire il merge per verificarlo.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Aprire una pull request corretta|Aprire una pull request corretta]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub|Review code su GitHub]]
- [[Programmazione/GitHub/Pagine/Checklist pull request GitHub|Checklist pull request GitHub]]
- [[Programmazione/GitHub/Pagine/Required status checks|Required status checks]]
- [[Programmazione/GitHub/Pagine/CODEOWNERS|CODEOWNERS]]
- [[Programmazione/GitHub/Pagine/Troubleshooting merge conflict|Troubleshooting merge conflict]]

## Fonti

- [GitHub CLI: leggere una PR](https://cli.github.com/manual/gh_pr_view)
- [GitHub CLI: controllare i check](https://cli.github.com/manual/gh_pr_checks)
- [GitHub Docs: check obbligatori in attesa](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
- [Git: confronto dall'antenato comune](https://git-scm.com/docs/git-diff)
