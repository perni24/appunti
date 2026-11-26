---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: base
tags:
  - git
  - github
  - promemoria
  - fetch
  - pull
  - push
aliases:
  - Cheatsheet sincronizzazione Git
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Remote origin e upstream]]"
title: GitHub - Fetch, pull e push
---

# GitHub - Fetch, pull e push

## Scaricare riferimenti

Negli esempi `origin` è il tuo remoto e `main` il branch principale. `origin/main` è il riferimento nel clone, non una lettura in tempo reale del server.

```powershell
git fetch origin
```

```powershell
git fetch --all --prune
```

`fetch` aggiorna i riferimenti remoti senza modificare il branch corrente.

## Vedere commit in arrivo

```powershell
git log HEAD..origin/main --oneline
```

## Pull con fast-forward

Senza argomenti usa l’upstream configurato del branch corrente. Se le due cronologie sono divergenti, `--ff-only` si ferma senza creare un merge.

```powershell
git pull --ff-only
```

## Pull con rebase

È un’alternativa al comando precedente per riapplicare i commit locali sopra l’upstream, non il passo automatico da eseguire quando `--ff-only` fallisce. Controlla prima quali commit sono divergenti.

```powershell
git pull --rebase
```

## Pubblicare un nuovo branch

```powershell
git push --set-upstream origin feature/user-search
```

## Push successivi

```powershell
git push
```

## Push dopo rebase

```powershell
git push --force-with-lease origin feature/user-search
```

Solo per un branch di cui hai concordato la riscrittura: il lease implicito verifica che il remoto coincida con il riferimento locale noto. Un fetch automatico può aggiornare quel riferimento senza che tu abbia esaminato i nuovi commit. Se il push è respinto, confronta le cronologie prima di riprovare.

## Aggiornare un fork

Qui `upstream` punta al progetto originale e `origin` al tuo fork; controllali con `git remote -v`. Se il merge fast-forward fallisce, fermati prima del push.

```powershell
git fetch upstream
```

```powershell
git switch main
```

```powershell
git merge --ff-only upstream/main
```

```powershell
git push origin main
```

## Pruning locale

Con la normale configurazione dei branch, rimuove dal clone i riferimenti `origin/*` ormai assenti sul server; non cancella i tuoi branch di lavoro né quelli sul remoto.

```powershell
git remote prune origin
```

## Fonti

- [Git: fetch e pruning](https://git-scm.com/docs/git-fetch)
- [Git: strategie di pull](https://git-scm.com/docs/git-pull)
- [Git: push e limiti di force-with-lease](https://git-scm.com/docs/git-push)

## Approfondimento

- [[Programmazione/GitHub/Pagine/Remote origin e upstream|Remote origin e upstream]]
- [[Programmazione/GitHub/Pagine/Clone fork e template repository|Clone fork e template repository]]
- [[Programmazione/GitHub/Pagine/Branch su GitHub|Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/Troubleshooting merge conflict|Troubleshooting merge conflict]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
