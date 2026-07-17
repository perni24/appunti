---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, git, tag, versioning, changelog]
aliases: [Tag versioni e changelog, Tag, versioni e changelog]
prerequisites: [Git e GitHub, Commit e cronologia su GitHub]
related: [Gestione release su GitHub, Protected tags, Conventional commits su GitHub]
---

# Tag, versioni e changelog

## Sintesi

**Tag, versioni e changelog** sono il modo con cui un progetto comunica la propria evoluzione. Il tag identifica un punto preciso nella storia Git, la versione assegna un nome leggibile a quel punto, il changelog spiega cosa e cambiato.

Su GitHub questi elementi diventano ancora piu importanti per release, automazioni, deploy e lettura storica del progetto.

## Quando usarlo

Usali quando:

- pubblichi versioni installabili;
- vuoi indicare una versione stabile;
- vuoi fare rollback o confronti;
- vuoi generare release notes;
- vuoi automatizzare deploy su tag;
- vuoi comunicare breaking change.

## Come funziona

Un tag Git punta a un commit. GitHub mostra tag e release nella sezione Releases. Una release puo usare un tag esistente o crearne uno nuovo.

Schema consigliato:

```text
commit -> tag vX.Y.Z -> release GitHub -> changelog -> deploy/package
```

Il changelog puo essere manuale, generato da conventional commits o generato da GitHub release notes, ma deve restare leggibile per una persona.

## API / Sintassi

Creare un tag annotato:

```bash
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin v1.2.0
```

Vedere tag:

```bash
git tag --list
```

Eliminare un tag remoto, solo se davvero necessario:

```bash
git push origin --delete v1.2.0
```

## Esempio pratico

Changelog minimo:

```md
# Changelog

## v1.2.0 - 2026-07-07

### Added
- Nuova pagina impostazioni.

### Fixed
- Corretto errore nella pipeline CI.

### Breaking changes
- Rimossa variabile `OLD_API_URL`.
```

## Varianti

- **Tag leggero**: riferimento semplice a un commit.
- **Tag annotato**: include messaggio, autore e metadati.
- **Protected tag**: impedisce modifiche non autorizzate.
- **Semantic Versioning**: `MAJOR.MINOR.PATCH`.
- **Calendar Versioning**: versione basata su data.
- **Changelog manuale**: piu curato, ma richiede disciplina.
- **Changelog automatico**: utile, ma va revisionato.

## Errori comuni

- Riutilizzare lo stesso tag per commit diversi.
- Non proteggere tag di release.
- Usare versioni senza criterio.
- Pubblicare release senza changelog.
- Nascondere breaking change tra note generiche.
- Generare changelog automatici senza revisione.

## Checklist

- La strategia di versioning e chiara?
- Il tag punta al commit corretto?
- Il tag e protetto se e critico?
- Il changelog distingue aggiunte, modifiche e fix?
- Le breaking change sono evidenti?
- Release e tag sono allineati?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Git e GitHub]]
- [[Commit e cronologia su GitHub]]
- [[Protected tags]]
- [[Conventional commits su GitHub]]
- [[Gestione release su GitHub]]

## Fonti

- [GitHub Docs - Viewing releases and tags](https://docs.github.com/en/repositories/releasing-projects-on-github/viewing-your-repositorys-releases-and-tags)
- [GitHub Docs - Searching releases](https://docs.github.com/en/repositories/releasing-projects-on-github/searching-a-repositorys-releases)
