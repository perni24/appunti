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
  - service-containers
  - docker
  - ci
aliases:
  - Service containers GitHub Actions
  - Docker service containers
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Jobs steps e runners]]"
related:
  - "[[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]"
title: Service containers GitHub Actions
---

# Service containers GitHub Actions

## Sintesi

Un **service container** è una dipendenza temporanea di un job, come PostgreSQL per un test d’integrazione o Redis per un test di cache. GitHub lo avvia prima degli step e lo rimuove quando il job termina. Due job non condividono lo stesso database; due test **nello stesso job** possono invece vedere i dati lasciati l’uno dall’altro.

## Esempio pratico: verificare una connessione PostgreSQL

Workflow manuale di esempio su un runner Linux con Docker. Il **container del job** fornisce il client `psql`; il **service container** è il server. La password nel YAML è un valore fittizio riservato al database effimero, non una credenziale del vault. Non serve checkout: non leggiamo file del repository.

```yaml
name: Verifica database di test
on: workflow_dispatch
permissions: {}
jobs:
  integrazione:
    runs-on: ubuntu-latest
    container: postgres:16
    services:
      db:
        image: postgres:16
        env:
          POSTGRES_DB: app_test
          POSTGRES_USER: app
          POSTGRES_PASSWORD: solo-test
        options: >-
          --health-cmd "pg_isready -U app -d app_test"
          --health-interval 5s
          --health-timeout 3s
          --health-retries 12
    steps:
      - name: Apri una sessione sul servizio
        env:
          PGHOST: db
          PGPORT: '5432'
          PGDATABASE: app_test
          PGUSER: app
          PGPASSWORD: solo-test
        run: psql -X -v ON_ERROR_STOP=1 -c 'SELECT current_database(), current_user;'
```

Il risultato atteso è una riga con `app_test` e `app`. `pg_isready` controlla che il server accetti connessioni; non prova che password, migrazioni o query dell’applicazione siano corrette. La connessione `psql` verifica utente e database effettivi, non lo schema. Per testare l’applicazione aggiungi checkout, installazione del client applicativo, migrazioni e test.

## Quale hostname usare?

| Dove gira il client | Host e porta | Serve `services.<id>.ports`? |
| --- | --- | --- |
| Nel container del job, come sopra | ID del servizio: `db:5432` | No: i container condividono la rete del job. |
| Sul runner Linux, senza `container:` | `127.0.0.1` e la porta **pubblicata sul runner** | Sì. Con `ports: ['5432']` leggi la porta assegnata da `${{ job.services.db.ports[5432] }}`. |

La stessa distinzione vale per Redis: `redis://redis:6379` se il servizio si chiama `redis` e il client sta nel container del job; sul runner useresti `127.0.0.1` e la porta pubblicata. Un `localhost` nel container del client punta al **client stesso**, non al database.

## Diagnosi rapida

**Connessione rifiutata:** controlla topologia, porta e health check prima di aumentare un timeout. **Autenticazione fallita:** confronta le variabili `POSTGRES_*` del server con le `PG*` del client. **Test che passano solo in un certo ordine:** pulisci i dati o isola ogni test con schema o transazione dedicati. Un tag come `postgres:16` fissa la major, non la singola immagine binaria.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Pipeline CI GitHub Actions|Pipeline CI GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Jobs steps e runners|Jobs steps e runners]]
- [[Programmazione/GitHub/Pagine/Workflow per test, lint e build|Workflow per test, lint e build]]

## Fonti

- [GitHub Docs - Rete dei service container](https://docs.github.com/en/actions/tutorials/use-containerized-services/use-docker-service-containers)
- [GitHub Docs - Creare un servizio PostgreSQL](https://docs.github.com/en/actions/tutorials/use-containerized-services/create-postgresql-service-containers)
- [PostgreSQL 16 - Che cosa misura pg_isready](https://www.postgresql.org/docs/16/app-pg-isready.html)
