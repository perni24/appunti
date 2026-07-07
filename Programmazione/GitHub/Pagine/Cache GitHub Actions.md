---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, cache, ci]
aliases: [Cache GitHub Actions, Dependency caching GitHub Actions]
prerequisites: [Pipeline CI GitHub Actions]
related: [Artifacts GitHub Actions, Workflow per test, lint e build]
---

# Cache GitHub Actions

## Sintesi

La **cache GitHub Actions** conserva file riutilizzabili tra workflow run, soprattutto dipendenze scaricate o output intermedi costosi da rigenerare. Serve ad accelerare la CI.

Non va confusa con gli artifact: la cache e per velocizzare run futuri, gli artifact sono output da conservare o scaricare dopo un run.

## Quando usarlo

Usa cache quando:

- installare dipendenze e lento;
- il package manager supporta cache;
- la CI gira spesso;
- vuoi ridurre tempi e costi;
- hai lockfile stabili;
- puoi rigenerare il contenuto se la cache manca.

## Come funziona

Una cache usa:

- `path`: file o cartelle da salvare;
- `key`: chiave principale;
- `restore-keys`: fallback opzionali.

Una buona key dipende da sistema operativo, runtime e lockfile. Se cambia il lockfile, la cache dovrebbe essere invalidata.

## API / Sintassi

Con `actions/setup-node`:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
```

Con `actions/cache`:

```yaml
- uses: actions/cache@v4
  with:
    path: ~/.npm
    key: npm-${{ runner.os }}-${{ hashFiles('package-lock.json') }}
    restore-keys: |
      npm-${{ runner.os }}-
```

## Esempio pratico

Per Node.js, spesso basta:

```yaml
- uses: actions/setup-node@v4
  with:
    node-version: 22
    cache: npm
- run: npm ci
```

Questo conserva la cache del package manager, non `node_modules`.

## Varianti

- **Cache integrata setup action**: piu semplice per Node, Python, Java, ecc.
- **actions/cache**: controllo esplicito su path e key.
- **Cache per lockfile**: invalida quando cambiano dipendenze.
- **Cache per OS**: evita riuso tra ambienti incompatibili.
- **Cache monorepo**: richiede key per package o workspace.

## Errori comuni

- Salvare secret o file sensibili in cache.
- Cacheare output non deterministici.
- Usare key troppo generica e riutilizzare contenuto vecchio.
- Cacheare `node_modules` senza motivo.
- Confondere cache e artifact.
- Non considerare cache poisoning da contesti poco fidati.

## Checklist

- La cache accelera davvero la CI?
- La key include OS e lockfile?
- La cache non contiene segreti?
- Il job funziona anche senza cache?
- Usi cache integrata quando disponibile?
- Hai distinto cache e artifact?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Pipeline CI GitHub Actions]]
- [[Workflow per test, lint e build]]
- [[Artifacts GitHub Actions]]

## Fonti

- [GitHub Docs - Dependency caching](https://docs.github.com/en/actions/concepts/workflows-and-actions/dependency-caching)
