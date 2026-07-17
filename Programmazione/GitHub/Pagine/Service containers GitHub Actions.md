---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, github-actions, service-containers, docker, ci]
aliases: [Service containers GitHub Actions, Docker service containers]
prerequisites: [Pipeline CI GitHub Actions, Jobs steps e runners]
related: [Workflow per test, lint e build]
---

# Service containers GitHub Actions

## Sintesi

I **service containers** permettono a un job GitHub Actions di avviare servizi Docker di supporto, per esempio PostgreSQL, Redis, MySQL o altri componenti necessari ai test.

Sono utili per test di integrazione realistici senza mantenere un ambiente esterno permanente.

## Quando usarlo

Usali quando:

- i test richiedono un database;
- vuoi avviare Redis, PostgreSQL o servizi simili;
- vuoi testare integrazione tra applicazione e servizio;
- vuoi evitare dipendenze esterne condivise;
- vuoi workflow riproducibili;
- vuoi isolare ogni run.

## Come funziona

Nel job definisci `services`. Ogni servizio:

- usa una image Docker;
- puo esporre porte;
- puo avere variabili ambiente;
- puo avere health check;
- vive per la durata del job.

Il modo di connettersi cambia se il job gira direttamente sul runner o dentro un container.

## API / Sintassi

PostgreSQL come service container:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: postgres
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - run: npm test
        env:
          DATABASE_URL: postgres://postgres:postgres@localhost:5432/postgres
```

## Esempio pratico

Test backend con Redis:

```yaml
services:
  redis:
    image: redis:7
    ports:
      - 6379:6379
```

Poi il test usa:

```text
redis://localhost:6379
```

## Varianti

- **Database service**: PostgreSQL, MySQL, MariaDB.
- **Cache service**: Redis, Memcached.
- **Search service**: Elasticsearch o OpenSearch, con attenzione a risorse.
- **Job container + services**: rete Docker interna.
- **Runner host + services**: accesso via `localhost` e porte esposte.

## Errori comuni

- Non configurare health check.
- Avviare servizi troppo pesanti per ogni PR.
- Usare credenziali reali invece di credenziali test.
- Confondere hostname quando il job gira in container.
- Non resettare database tra test.
- Non considerare tempi di startup.

## Checklist

- Il servizio e necessario per quei test?
- Usa image e versione esplicita?
- Ha health check?
- Le credenziali sono solo di test?
- Il job aspetta che il servizio sia pronto?
- I test sono isolati e ripetibili?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Pipeline CI GitHub Actions]]
- [[Jobs steps e runners]]
- [[Workflow per test, lint e build]]

## Fonti

- [GitHub Docs - Docker service containers](https://docs.github.com/en/actions/tutorials/use-containerized-services/use-docker-service-containers)
