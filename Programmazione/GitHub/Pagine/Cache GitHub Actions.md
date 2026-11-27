---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - github-actions
  - cache
  - ci
aliases:
  - Cache GitHub Actions
  - Dependency caching GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Artifacts GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]"
title: Cache GitHub Actions
---

# Cache GitHub Actions

## Sintesi

Una cache è una **scorciatoia facoltativa**. La domanda giusta è «Se sparisce oggi, il job darà lo stesso risultato, anche se più lentamente?». Se la risposta è no, stai probabilmente usando la cache al posto di un input versionato o di un artifact.

## Esempio pratico: la cache npm del vault

Questi step presuppongono il checkout del repository. Corrispondono alla scelta fatta nel deploy Quartz: il lockfile è sotto `site/` e il package manager è npm.

```yaml
- uses: actions/setup-node@v6
  with:
    node-version: '24'
    cache: npm
    cache-dependency-path: site/package-lock.json
- run: npm ci
  working-directory: site
```

`setup-node` conserva i dati di download di npm, **non `node_modules`**. `cache-dependency-path` serve alla chiave di cache; `working-directory` dice invece a npm dove installare. Anche dopo un hit esatto si esegue `npm ci`: l’installazione deve corrispondere al lockfile corrente.

## Quando serve una chiave esplicita

Alternativa su **Ubuntu**, dopo checkout e setup di Node **senza** la cache integrata (ometti `cache: npm` e imposta `package-manager-cache: false` su `setup-node@v6`). L’esempio assume la cache npm predefinita `~/.npm`: se il runner è personalizzato, verifica il percorso con `npm config get cache`.

```yaml
- uses: actions/cache@v6
  with:
    path: ~/.npm
    key: npm-${{ runner.os }}-${{ hashFiles('site/package-lock.json') }}
    restore-keys: |
      npm-${{ runner.os }}-
- run: npm ci
  working-directory: site
```

| Cosa cambia | Effetto atteso |
| --- | --- |
| Stesso lockfile, cache esatta disponibile per questo run | Si ripristinano i download salvati. |
| Lockfile diverso, disponibile solo una chiave con lo stesso prefisso | Si possono riusare download precedenti; `npm ci` installa comunque le versioni richieste. |
| Cache assente o scaduta | npm deve scaricare le dipendenze. Il job deve funzionare anche così. |

Le chiavi sono soggette anche all’ambito del branch e alla versione della cache. Un fallback **non** è un hit esatto; non usarlo per saltare la generazione di un binario. Una cache esistente non si aggiorna sul posto: per contenuti incompatibili cambia la chiave. Per moduli compilati possono contare anche architettura e ABI del runtime.

## Errori comuni

Non salvare credenziali, `.npmrc` con token o l’intero workspace. Non presumere che una cache sia privata o che il suo contenuto provi la provenienza del codice. Per consegnare il sito esatto prodotto da un run, usa l’artifact di quella build.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions|Pipeline CI GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]
- [[Programmazione/GitHub/Pagine/Artifacts GitHub Actions|Artifacts GitHub Actions]]

## Fonti

- [GitHub Docs - Chiavi, ricerca e ambito della cache](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching)
- [actions/setup-node - Cache dei package manager](https://github.com/actions/setup-node/tree/v6)
- [actions/cache - Input e output della versione mostrata](https://github.com/actions/cache/tree/v6)
