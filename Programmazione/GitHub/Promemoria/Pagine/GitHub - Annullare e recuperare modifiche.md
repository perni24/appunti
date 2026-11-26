---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - git
  - github
  - promemoria
  - restore
  - revert
  - reset
  - reflog
aliases:
  - Cheatsheet annullare modifiche Git
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub]]"
title: GitHub - Annullare e recuperare modifiche
---

# GitHub - Annullare e recuperare modifiche

## Rimuovere dallo staging

Controlla prima `git status --short`. In un repository con commit, `--staged` riprende la versione da `HEAD` per il solo indice: il file sul disco resta com’è. Sostituisci i percorsi e gli SHA di esempio.

```powershell
git restore --staged path/to/file
```

## Scartare modifiche locali

```powershell
git restore path/to/file
```

Attenzione: il comando sovrascrive il file tracciato sul disco con la versione **nello staging**, non necessariamente con quella di `HEAD`. Le modifiche non preparate possono andare perse.

## Ripristinare da un commit

Senza `--staged` scrive la versione scelta solo nel working tree: non la prepara per il commit.

```powershell
git restore --source commit-sha path/to/file
```

## Revert di un commit condiviso

```powershell
git revert commit-sha
```

```powershell
git revert --no-commit 'first-sha..last-sha'
```

Il primo comando crea un commit inverso. Il secondo, per una sequenza lineare, esclude `first-sha` e include `last-sha`: controlla prima l’intervallo con `git log --oneline first-sha..last-sha`. `--no-commit` prepara le inversioni senza registrarle; controlla `git diff --staged` prima del commit.

## Reset soft

```powershell
git reset --soft HEAD~1
```

Sposta il branch al commit precedente senza cambiare indice né file sul disco. Usa i reset che spostano il branch solo per cronologia locale non condivisa.

## Reset mixed

```powershell
git reset HEAD~1
```

Riallinea lo staging al commit scelto e lascia i file sul disco invariati. Le differenze rispetto al nuovo `HEAD` non sono preparate.

## Reset hard

```powershell
git reset --hard commit-sha
```

Distruttivo: riallinea indice e file tracciati al commit scelto; può sovrascrivere anche file non tracciati che ostacolano il ripristino. Controlla SHA, `git diff` e `git diff --staged` e metti al sicuro il lavoro da conservare prima di usarlo.

## Recuperare con reflog

Il reflog è locale e le sue voci possono scadere. Può ritrovare commit prima raggiungibili, non è un backup delle modifiche mai registrate. Ispeziona lo SHA e crea un branch per mantenerlo raggiungibile.

```powershell
git reflog
```

```powershell
git switch --detach commit-sha
```

```powershell
git branch recovery commit-sha
```

## Recuperare un branch eliminato

```powershell
git reflog
```

```powershell
git branch restored-branch commit-sha
```

## Fonti

- [Git: sorgente di restore e destinazioni](https://git-scm.com/docs/git-restore)
- [Git: revert con o senza nuovo commit](https://git-scm.com/docs/git-revert)
- [Git: effetti di reset](https://git-scm.com/docs/git-reset)
- [Git: registro locale dei riferimenti](https://git-scm.com/docs/git-reflog)

## Approfondimento

- [[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub|Commit e cronologia su GitHub]]
- [[Programmazione/GitHub/Pagine/Troubleshooting merge conflict|Troubleshooting merge conflict]]
- [[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub|Merge squash e rebase su GitHub]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
