---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, github-packages, packages, registry]
aliases: [GitHub Packages con Actions, Packages con Actions]
prerequisites: [GitHub Actions, Permissions GitHub Actions]
related: [Release automation GitHub Actions, OIDC GitHub Actions]
---

# GitHub Packages con Actions

## Sintesi

**GitHub Packages con Actions** permette di pubblicare e installare package tramite workflow GitHub Actions. Puo gestire container image, package npm, Maven, Gradle, NuGet, RubyGems e altri registri supportati.

Il tema centrale e l'autenticazione: quando possibile, usa `GITHUB_TOKEN` con permessi minimi invece di token personali.

## Quando usarlo

Usalo quando:

- vuoi pubblicare package dopo test e build;
- vuoi pubblicare immagini container su GitHub Container Registry;
- vuoi distribuire librerie interne;
- vuoi collegare package a release e repository;
- vuoi automatizzare versioni;
- vuoi evitare pubblicazione manuale.

## Come funziona

Un workflow package tipico:

1. parte da tag, release o branch controllato;
2. esegue CI;
3. costruisce package;
4. autentica al registry;
5. pubblica;
6. eventualmente genera attestazioni o release.

Il workflow deve dichiarare permessi adeguati, spesso:

```yaml
permissions:
  contents: read
  packages: write
```

## API / Sintassi

Esempio container registry:

```yaml
permissions:
  contents: read
  packages: write

steps:
  - uses: actions/checkout@v4
  - name: Login to GHCR
    run: echo "${{ secrets.GITHUB_TOKEN }}" | docker login ghcr.io -u "${{ github.actor }}" --password-stdin
  - run: docker build -t ghcr.io/${{ github.repository }}:latest .
  - run: docker push ghcr.io/${{ github.repository }}:latest
```

## Esempio pratico

Package su tag:

```text
tag v1.2.0
workflow package
test
build package
publish to GitHub Packages
create release
```

In questo schema il package deriva da codice testato e versionato.

## Varianti

- **Container image**: pubblicata su `ghcr.io`.
- **npm package**: pacchetto JavaScript/TypeScript.
- **Maven/Gradle package**: ecosistema Java.
- **NuGet package**: ecosistema .NET.
- **Package privato**: accessibile solo a repository o utenti autorizzati.
- **Package pubblico**: distribuibile esternamente.

## Errori comuni

- Usare PAT quando basta `GITHUB_TOKEN`.
- Non dichiarare `packages: write`.
- Pubblicare da branch non protetti.
- Pubblicare package senza test.
- Non gestire versioni duplicate.
- Non collegare package e repository.

## Checklist

- Il workflow parte da branch o tag controllato?
- La CI passa prima della pubblicazione?
- I permessi includono solo cio che serve?
- Il package ha versione coerente?
- Il registry e quello corretto?
- L'accesso al package e configurato correttamente?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Permissions GitHub Actions]]
- [[Release automation GitHub Actions]]
- [[Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Publishing and installing a package with GitHub Actions](https://docs.github.com/en/packages/managing-github-packages-using-github-actions-workflows/publishing-and-installing-a-package-with-github-actions)
