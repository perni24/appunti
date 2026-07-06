---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, dependency-graph, dependencies, supply-chain]
aliases: [Dependency graph, GitHub dependency graph]
prerequisites: [Repository GitHub]
related: [Dependabot, SBOM e attestazioni su GitHub]
---

# Dependency graph

## Sintesi

Il **dependency graph** di GitHub rappresenta le dipendenze dichiarate da un repository. Serve come base per Dependabot alerts, dependency review, analisi supply chain e generazione/esportazione di informazioni sulle dipendenze.

La sua utilita dipende dalla qualita dei manifest e lockfile presenti nel repository.

## Quando usarlo

Usalo quando:

- vuoi sapere quali dipendenze usa un progetto;
- vuoi ricevere alert su vulnerabilita;
- vuoi valutare aggiornamenti di dependency;
- vuoi controllare transitive dependencies;
- vuoi preparare audit o SBOM;
- vuoi monitorare rischio supply chain.

## Come funziona

GitHub analizza file di manifest e lockfile supportati, per esempio:

- `package.json` e lockfile JavaScript;
- `requirements.txt`, `pyproject.toml` o file Python equivalenti;
- `Cargo.toml` e `Cargo.lock`;
- manifest Maven, Gradle o altri ecosistemi supportati.

Il grafo mostra relazioni tra package diretti e transitivi. Se una dipendenza risulta vulnerabile e l'advisory e riconosciuto, GitHub puo generare alert.

## API / Sintassi

File che rendono il grafo piu accurato:

```text
package-lock.json
pnpm-lock.yaml
yarn.lock
Cargo.lock
poetry.lock
requirements.txt
pom.xml
```

Per progetti con dipendenze non rilevate automaticamente, GitHub supporta anche submission tramite API o strumenti dedicati.

## Esempio pratico

In un progetto Node.js:

```text
package.json
package-lock.json
```

Il manifest indica dipendenze dichiarate. Il lockfile rende piu precisa la versione effettivamente installata.

## Varianti

- **Dipendenze dirette**: dichiarate dal progetto.
- **Dipendenze transitive**: richieste da altre dipendenze.
- **Dependency submission**: invio esplicito di dipendenze non rilevate automaticamente.
- **Dependency review**: confronto delle dipendenze introdotte da una PR.
- **SBOM export**: esportazione delle dipendenze in formato leggibile da strumenti.

## Errori comuni

- Non versionare lockfile quando servono.
- Usare manifest non aggiornati.
- Ignorare dipendenze di CI, Docker o GitHub Actions.
- Pensare che il grafo trovi codice vendorizzato o dipendenze non dichiarate.
- Non controllare dependency review nelle PR.
- Disattivare alert per ridurre rumore invece di fare triage.

## Checklist

- I manifest sono versionati?
- I lockfile sono presenti quando utili?
- Il dependency graph e abilitato?
- Le dipendenze CI sono considerate?
- Le PR che aggiungono dependency vengono revisionate?
- Gli alert sono collegati a un processo di triage?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Repository GitHub]]
- [[Dependabot]]
- [[SBOM e attestazioni su GitHub]]

## Fonti

- [GitHub Docs - Dependency graph](https://docs.github.com/en/code-security/concepts/supply-chain-security/dependency-graph)
