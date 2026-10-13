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

```powershell
git tag -a v1.2.0 -m "Release v1.2.0"
```

## Pubblicare un tag

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
git push origin --delete v1.2.0
```

Non spostare un tag di release gia distribuito.

## Creare una release

```powershell
gh release create v1.2.0 --generate-notes
```

```powershell
gh release create v1.2.0 dist/app.zip --title "v1.2.0" --notes-file CHANGELOG.md
```

## Prerelease e draft

```powershell
gh release create v2.0.0-rc.1 --prerelease --generate-notes
```

```powershell
gh release create v1.2.0 --draft --generate-notes
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

Per un deploy Actions servono normalmente:

```yaml
permissions:
  contents: read
  pages: write
  id-token: write
```

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
