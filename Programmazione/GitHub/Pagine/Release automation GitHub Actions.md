---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, github-actions, release, automation]
aliases: [Release automation GitHub Actions, Automazione release GitHub Actions]
prerequisites: [GitHub Actions, Protected tags]
related: [Artifacts GitHub Actions, Protected tags, GitHub Packages con Actions]
---

# Release automation GitHub Actions

## Sintesi

La **release automation** con GitHub Actions automatizza creazione di release, generazione di artefatti, changelog, pubblicazione asset e, quando serve, deploy o pubblicazione package.

Una release GitHub e diversa da un artifact di workflow: la release e un oggetto pubblico o privato collegato a tag, note e asset scaricabili.

## Quando usarlo

Usala quando:

- pubblichi versioni scaricabili;
- vuoi collegare release a tag;
- vuoi generare asset automaticamente;
- vuoi evitare upload manuali;
- vuoi produrre changelog coerenti;
- vuoi pubblicare package dopo test.

## Come funziona

Flusso tipico:

1. viene creato un tag, per esempio `v1.2.0`;
2. parte workflow di release;
3. esegue test o verifica artifact;
4. compila asset;
5. crea release GitHub;
6. carica asset;
7. opzionalmente pubblica package o deploy.

I tag di release dovrebbero essere protetti.

## API / Sintassi

Trigger su tag:

```yaml
on:
  push:
    tags:
      - "v*"
```

Permessi tipici per creare release:

```yaml
permissions:
  contents: write
```

Esempio con GitHub CLI:

```yaml
- run: gh release create "$GITHUB_REF_NAME" dist/*
  env:
    GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Esempio pratico

Release flow:

```text
main stabile
tag v1.4.0
workflow release
build artifact
create GitHub release
upload asset
publish package
```

Questo rende riproducibile il rilascio e lascia traccia nel repository.

## Varianti

- **Release manuale**: creata da UI o CLI.
- **Release su tag**: workflow parte da `v*`.
- **Draft release**: preparata prima della pubblicazione.
- **Prerelease**: versioni beta, rc o preview.
- **Release con artifact attestations**: migliora provenienza degli asset.
- **Release con changelog automatico**: basata su PR o commit.

## Errori comuni

- Confondere workflow artifact e release asset.
- Usare tag non protetti.
- Pubblicare release senza test.
- Sovrascrivere asset gia pubblicati.
- Usare token personali invece di `GITHUB_TOKEN` quando basta.
- Non collegare release a changelog e versionamento.

## Checklist

- La release parte da tag protetto?
- Gli artifact vengono generati dalla pipeline ufficiale?
- La release contiene note chiare?
- Gli asset sono quelli attesi?
- I permessi sono limitati al job release?
- Il processo e ripetibile?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Artifacts GitHub Actions]]
- [[Protected tags]]
- [[GitHub Packages con Actions]]
- [[SBOM e attestazioni su GitHub]]

## Fonti

- [GitHub Docs - About releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases)
