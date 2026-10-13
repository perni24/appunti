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

Diagnosticare perche una pull request non si apre, non viene revisionata, non passa i controlli o non puo essere mergiata.

La regola pratica e separare il problema in categorie: branch, permessi, conflitti, CI, review, branch protection o descrizione insufficiente.

## Quando usarlo

- La PR non puo essere creata.
- La PR punta al branch sbagliato.
- La PR non mostra le modifiche attese.
- La PR e bloccata da review o status check.
- Il pulsante di merge e disabilitato.
- I reviewer non capiscono cosa devono controllare.

## Procedura

1. Controlla branch base e branch head.
2. Verifica che i branch siano diversi.
3. Controlla se la PR arriva da fork o dallo stesso repository.
4. Verifica permessi dell'utente.
5. Controlla conflitti e branch protection.
6. Controlla status check e CI.
7. Controlla review richieste, CODEOWNERS e conversazioni aperte.
8. Rileggi titolo, descrizione e file modificati.

## Snippet

Controllo branch locale:

```bash
git status
git branch --show-current
git remote -v
git log --oneline --decorate -5
```

Aggiornare il branch con `main`:

```bash
git fetch origin
git rebase origin/main
git push --force-with-lease
```

Alternativa con merge:

```bash
git fetch origin
git merge origin/main
git push
```

## Adattamenti comuni

- **PR da fork**: controlla base repository, head repository e permessi sui workflow.
- **PR draft**: non e pronta per merge finche resta draft.
- **PR con CODEOWNERS**: richiede reviewer specifici se configurato.
- **PR con required checks**: non puo fare merge finche i check richiesti non passano.
- **PR troppo grande**: dividila o aggiungi una guida alla review.

## Debug rapido

- Se la PR non mostra modifiche, controlla se il branch e gia allineato alla base.
- Se la PR punta al branch sbagliato, cambia base branch dalla UI.
- Se la PR e bloccata, leggi il messaggio vicino al pulsante merge.
- Se mancano reviewer, controlla CODEOWNERS e branch protection.
- Se la CI non parte, controlla trigger, fork e path del workflow.
- Se la PR e incomprensibile, migliora descrizione, screenshot e test dichiarati.

## Checklist finale

- Branch base corretto.
- Branch head corretto.
- Diff coerente.
- Permessi sufficienti.
- Conflitti assenti o gestiti.
- CI e required checks verificati.
- Review richieste completate.
- Conversazioni risolte.
- Descrizione aggiornata.

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

- [GitHub Docs - Creating a pull request](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request)
