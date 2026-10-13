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
  - release
  - checklist
  - versioning
aliases:
  - Checklist release GitHub
  - Checklist rilascio GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Gestione release su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Tag, versioni e changelog]]"
  - "[[Programmazione/GitHub/Pagine/Tag, versioni e changelog]]"
related:
  - "[[Programmazione/GitHub/Pagine/Release automation GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Protected tags]]"
  - "[[Programmazione/GitHub/Pagine/Deploy con GitHub Actions]]"
title: Checklist release GitHub
---

# Checklist release GitHub

## Obiettivo

Verificare che una release GitHub sia pronta da pubblicare: versione corretta, tag coerente, note leggibili, asset presenti, controlli passati e rischi documentati.

Una release deve essere ripetibile e comprensibile anche dopo mesi.

## Quando usarlo

- Prima di pubblicare una release stabile.
- Prima di pubblicare una pre-release.
- Prima di collegare una release a deploy o package.
- Dopo una release fallita o incompleta.
- Durante una revisione del processo di rilascio.

## Procedura

1. Verifica stato del branch di release.
2. Controlla CI e test.
3. Decidi versione e tag.
4. Aggiorna changelog.
5. Prepara release notes.
6. Genera asset o package.
7. Verifica checksum o firme se servono.
8. Pubblica come draft, pre-release o stable.
9. Controlla URL, asset e automazioni collegate.
10. Comunica eventuali breaking change o migrazioni.

## Snippet

Checklist sintetica:

```text
[ ] CI passata
[ ] Versione decisa
[ ] Tag corretto
[ ] Changelog aggiornato
[ ] Breaking change evidenziate
[ ] Asset generati
[ ] Release notes revisionate
[ ] Pre-release marcata se non stabile
[ ] Deploy/package collegati verificati
[ ] Rollback o recupero noto
```

Creazione release con GitHub CLI:

```bash
gh release create v1.2.0 --title "v1.2.0" --notes-file CHANGELOG.md
```

## Adattamenti comuni

- **Patch release**: concentrati su bug fix e regressioni.
- **Minor release**: evidenzia nuove feature e compatibilita.
- **Major release**: documenta breaking change e migrazioni.
- **Pre-release**: marca esplicitamente beta, alpha o release candidate.
- **Release automatizzata**: controlla comunque note, asset e permessi.

## Debug rapido

- Se la release punta al commit sbagliato, controlla tag e branch.
- Se mancano asset, verifica workflow di build e upload.
- Se `latest` non e quello atteso, controlla pre-release e ordinamento versioni.
- Se il deploy non parte, controlla trigger su tag o release.
- Se il changelog e rumoroso, migliora convenzioni commit e label.

## Checklist finale

- Versione coerente.
- Tag corretto e protetto se critico.
- CI completata.
- Release notes chiare.
- Changelog aggiornato.
- Asset presenti e verificati.
- Stato stable/pre-release corretto.
- Deploy o package controllati.
- Breaking change e migrazioni documentate.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Gestione release su GitHub|Gestione release su GitHub]]
- [[Programmazione/GitHub/Pagine/Tag, versioni e changelog|Tag, versioni e changelog]]
- [[Programmazione/GitHub/Pagine/Release automation GitHub Actions|Release automation GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Protected tags|Protected tags]]
- [[Programmazione/GitHub/Pagine/Deploy con GitHub Actions|Deploy con GitHub Actions]]
- [[Programmazione/GitHub/Pagine/GitHub Packages con Actions|GitHub Packages con Actions]]

## Fonti

- [GitHub Docs - Managing releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
