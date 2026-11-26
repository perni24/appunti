---
date: 2026-07-30
area: Programmazione
topic: Promemoria GitHub
type: operational-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - promemoria
  - tag
  - release
  - pages
  - packages
aliases:
  - Cheatsheet release GitHub
prerequisites: []
related:
  - "[[Programmazione/GitHub/Pagine/Gestione release su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/GitHub Pages con Actions]]"
title: GitHub - Tag, release e pubblicazione
---

# GitHub - Tag, release e pubblicazione

## Creare un tag annotato

Senza uno SHA esplicito il tag locale punta a `HEAD`: controlla prima che sia il commit da distribuire. Un tag Git e una release GitHub sono oggetti distinti.

```powershell
git tag -a v1.2.0 -m "Release v1.2.0"
```

## Pubblicare un tag

Preferisci il primo comando per una singola versione. `--tags` invia **tutti** i tag locali mancanti, anche quelli estranei alla release.

```powershell
git push origin v1.2.0
```

```powershell
git push origin --tags
```

## Elencare e verificare

```powershell
git tag --list
```

```powershell
git show v1.2.0
```

## Eliminare un tag

```powershell
git tag -d v1.2.0
```

```powershell
git push origin --delete refs/tags/v1.2.0
```

Il primo comando elimina solo il tag locale; il secondo lo elimina sul remoto per tutti. Non eliminare o spostare un tag di release già distribuito per correggerla: pubblica una nuova versione.

## Creare una release

Scegli un esempio, dopo il push del tag. `--verify-tag` interrompe l’operazione se il tag non esiste sul remoto; senza il flag, `gh` può crearlo dal branch predefinito. Non è una verifica della firma. Per il secondo esempio servono anche i file indicati.

```powershell
gh release create v1.2.0 --verify-tag --generate-notes
```

```powershell
gh release create v1.2.0 dist/app.zip --verify-tag --title "v1.2.0" --notes-file CHANGELOG.md
```

## Prerelease e draft

```powershell
gh release create v2.0.0-rc.1 --verify-tag --prerelease --generate-notes
```

```powershell
gh release create v1.2.0 --verify-tag --draft --generate-notes
```

## Caricare un asset

```powershell
gh release upload v1.2.0 dist/app.zip
```

## Scaricare

```powershell
gh release download v1.2.0
```

## Trigger di release

Frammenti di workflow: il primo reagisce al **push di un tag** che inizia con `v`, non alla pubblicazione di una release. Concedi `contents: write` solo al job che deve scrivere la release.

```yaml
on:
  push:
    tags:
      - "v*"
```

```yaml
permissions:
  contents: write
```

## GitHub Pages

Per Pages imposta **Settings → Pages → Source → GitHub Actions**. I permessi non pubblicano nulla da soli: il job di build carica l’artefatto del sito, quello di deploy lo pubblica con `pages: write` e `id-token: write`. `contents: read` serve per leggere i sorgenti durante il checkout.

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

## Fonti

- [Git: creare e gestire tag](https://git-scm.com/docs/git-tag)
- [GitHub CLI: creazione release e controllo del tag remoto](https://cli.github.com/manual/gh_release_create)
- [GitHub Docs: workflow personalizzati per Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## Approfondimento

- [[Programmazione/GitHub/Pagine/Tag, versioni e changelog|Tag, versioni e changelog]]
- [[Programmazione/GitHub/Pagine/Gestione release su GitHub|Gestione release su GitHub]]
- [[Programmazione/GitHub/Pagine/Checklist release GitHub|Checklist release GitHub]]
- [[Programmazione/GitHub/Pagine/Release automation GitHub Actions|Release automation GitHub Actions]]
- [[Programmazione/GitHub/Pagine/GitHub Pages con Actions|GitHub Pages con Actions]]
- [[Programmazione/GitHub/Pagine/GitHub Packages con Actions|GitHub Packages con Actions]]
- [[Programmazione/GitHub/Pagine/Protected tags|Protected tags]]


## Navigazione

- [[Programmazione/GitHub/Promemoria/Indice Promemoria GitHub|Indice Promemoria GitHub]]
