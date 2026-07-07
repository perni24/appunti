---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, release, versioning, manutenzione]
aliases: [Gestione release su GitHub, Release GitHub]
prerequisites: [Repository GitHub, Tag, versioni e changelog]
related: [Release automation GitHub Actions, Tag, versioni e changelog, GitHub REST API]
---

# Gestione release su GitHub

## Sintesi

La **gestione release su GitHub** organizza versioni pubblicabili di un progetto. Una release e collegata a un tag Git e puo includere note, asset, binari, changelog, pre-release e indicazioni per utenti o sistemi di deploy.

Una release ben fatta risponde a tre domande: cosa cambia, quale versione e, come si usa o si aggiorna.

## Quando usarlo

Usa release GitHub quando:

- pubblichi versioni installabili;
- vuoi allegare asset o binari;
- vuoi comunicare cambiamenti agli utenti;
- vuoi collegare release a tag semantici;
- vuoi automatizzare changelog e deploy;
- vuoi distinguere versioni stabili e pre-release.

## Come funziona

Una release contiene:

- tag;
- titolo;
- descrizione o release notes;
- eventuali asset;
- stato draft, pre-release o published;
- autore e data;
- collegamento a commit o branch.

GitHub puo generare release notes automaticamente, ma devi comunque controllare ordine, chiarezza e impatto delle modifiche.

## API / Sintassi

Creare una release con GitHub CLI:

```bash
gh release create v1.2.0 \
  --title "v1.2.0" \
  --notes "Correzioni e miglioramenti della versione 1.2.0"
```

Creare una pre-release:

```bash
gh release create v2.0.0-beta.1 --prerelease --generate-notes
```

## Esempio pratico

Struttura release:

```md
## v1.4.0

### Aggiunto
- Nuova pipeline CI.

### Modificato
- Aggiornata configurazione deploy.

### Corretto
- Risolto errore nel caricamento asset.

### Note di aggiornamento
- Eseguire la migrazione del database prima del deploy.
```

## Varianti

- **Draft release**: preparazione prima della pubblicazione.
- **Pre-release**: beta, alpha o release candidate.
- **Latest release**: versione consigliata.
- **Release automatizzata**: creata da GitHub Actions.
- **Release con asset**: allega binari, archivi o report.
- **Release notes generate**: base automatica da rivedere.

## Errori comuni

- Creare release senza tag coerente.
- Pubblicare note troppo generiche.
- Non distinguere pre-release e stable.
- Non allegare asset necessari.
- Non indicare breaking change o migrazioni.
- Usare release come changelog confuso e non versionato.

## Checklist

- Il tag e corretto?
- Le note spiegano impatto e compatibilita?
- Asset e checksum sono presenti se servono?
- La release e stable o pre-release?
- Il changelog e aggiornato?
- Il workflow di deploy usa la release giusta?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Tag, versioni e changelog]]
- [[Release automation GitHub Actions]]
- [[GitHub REST API]]
- [[GitHub CLI]]
- [[Protected tags]]

## Fonti

- [GitHub Docs - About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
- [GitHub Docs - Managing releases](https://docs.github.com/en/repositories/releasing-projects-on-github/managing-releases-in-a-repository)
- [GitHub Docs - Automatically generated release notes](https://docs.github.com/en/repositories/releasing-projects-on-github/automatically-generated-release-notes)
