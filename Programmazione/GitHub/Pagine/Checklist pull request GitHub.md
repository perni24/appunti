---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - github
  - pull-request
  - checklist
  - review
aliases:
  - Checklist pull request GitHub
  - Checklist PR GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Aprire una pull request corretta]]"
related:
  - "[[Programmazione/GitHub/Pagine/Review code su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Required status checks]]"
  - "[[Programmazione/GitHub/Pagine/CODEOWNERS]]"
title: Checklist pull request GitHub
---

# Checklist pull request GitHub

## Obiettivo

Prendere due decisioni diverse: **posso chiedere una review?** e **possiamo fare merge di questa revisione?** La prima richiede una proposta comprensibile; la seconda richiede anche che le condizioni del branch base siano soddisfatte.

## Prima della review

- [ ] Il branch base è quello che deve ricevere la modifica. In *Files changed* il diff contiene soltanto il lavoro dichiarato: niente file locali, modifiche generate per errore o cambiamenti estranei.
- [ ] Il titolo descrive l'effetto. La descrizione spiega perché serve, quale issue risolve, quali test sono stati davvero eseguiti e cosa resta da provare. Per una modifica visibile allegare, se utile, un prima/dopo senza dati privati.
- [ ] Se cambiano un'API o un formato dati, indicare utenti coinvolti, migrazione e recupero. Se la PR è ampia, suggerire un ordine di lettura o separare gli interventi indipendenti.
- [ ] Se si cerca solo feedback preliminare, mantenere la PR in bozza e dire su cosa serve il parere. Una richiesta di review assegnata **non** equivale a un'approvazione.

## Prima del merge

Esempi di sola lettura: sostituire `42` e `OWNER/REPO` con PR e repository reali; serve GitHub CLI con accesso alla PR. Identificare base, revisione proposta e stato della review:

```bash
gh pr view 42 --repo OWNER/REPO --json baseRefName,headRefName,headRefOid,isDraft,reviewDecision
```

Leggere i check richiesti per la PR, non il risultato di un vecchio push:

```bash
gh pr checks 42 --repo OWNER/REPO --required
```

- [ ] La PR non è draft. In caso di nuovi commit dopo la review, rileggere il diff aggiornato e verificare se le regole richiedono una nuova approvazione, anche dai code owner.
- [ ] I check attesi hanno un risultato valido per la revisione valutata da GitHub: può essere il commit di prova del merge, non solo lo SHA del branch sorgente. `gh pr checks` restituisce codice `8` per controlli in attesa; nessun check richiesto non significa «test passati».
- [ ] Richieste di modifica, conversazioni bloccanti e conflitti sono risolti. Metodo di merge e aggiornamento rispetto alla base seguono le regole del progetto. Per una PR da fork non mettere credenziali a disposizione del codice proposto per far passare i test.

**Esempio di decisione:** la CI ha passato tutti i test, ma `reviewDecision` vale `CHANGES_REQUESTED`. Si può discutere la correzione col reviewer; la spunta verde da sola non autorizza il merge.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Aprire una pull request corretta|Aprire una pull request corretta]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub|Review code su GitHub]]
- [[Programmazione/GitHub/Pagine/Required status checks|Required status checks]]
- [[Programmazione/GitHub/Pagine/CODEOWNERS|CODEOWNERS]]
- [[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub|Merge squash e rebase su GitHub]]

## Fonti

- [GitHub CLI: stato della pull request](https://cli.github.com/manual/gh_pr_view)
- [GitHub CLI: check obbligatori e codici di uscita](https://cli.github.com/manual/gh_pr_checks)
- [GitHub Docs: quale commit deve superare i check](https://docs.github.com/en/pull-requests/how-tos/merge-and-close-pull-requests/troubleshooting-required-status-checks)
