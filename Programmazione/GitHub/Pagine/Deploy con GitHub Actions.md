---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, github-actions, deploy, cd]
aliases: [Deploy con GitHub Actions, Deployment GitHub Actions]
prerequisites: [GitHub Actions, Pipeline CI GitHub Actions]
related: [Environments GitHub Actions, OIDC GitHub Actions]
---

# Deploy con GitHub Actions

## Sintesi

Il **deploy con GitHub Actions** automatizza la pubblicazione di applicazioni, siti, package o artefatti verso un ambiente esterno. E la parte CD del flusso CI/CD.

Un deploy non dovrebbe essere solo uno script che copia file: deve avere trigger controllati, permessi minimi, segreti protetti, tracciabilita e possibilita di blocco o approvazione.

## Quando usarlo

Usalo quando:

- vuoi pubblicare dopo test e build;
- vuoi deploy ripetibili;
- vuoi legare deploy a branch, tag o release;
- vuoi approvazioni per produzione;
- vuoi evitare credenziali manuali;
- vuoi audit trail dei rilasci.

## Come funziona

Un workflow di deploy tipico:

1. parte da un evento controllato;
2. esegue checkout;
3. prepara runtime;
4. esegue build o scarica artifact;
5. autentica verso provider;
6. pubblica;
7. registra stato del deployment.

Per produzione e preferibile usare environments, approval e OIDC quando il provider lo supporta.

## API / Sintassi

Deploy manuale semplificato:

```yaml
name: Deploy

on:
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh
```

## Esempio pratico

Pattern sicuro:

```text
pull request -> CI
main -> build artifact
tag v* -> release
manual approval -> production deploy
```

In questo modo il deploy di produzione non dipende da una modifica casuale o da una pull request non approvata.

## Varianti

- **Deploy su push**: semplice, utile per staging.
- **Deploy manuale**: usa `workflow_dispatch`.
- **Deploy su tag**: utile per release versionate.
- **Deploy con environment**: abilita approvazioni e secrets dedicati.
- **Deploy con OIDC**: evita secret statici verso cloud provider.
- **Deploy via provider action**: usa action ufficiali o verificate.

## Errori comuni

- Deploy automatico da branch non protetti.
- Usare token statici a lunga durata.
- Dare permessi di scrittura a job che devono solo buildare.
- Mischiare test, release e deploy senza separazione.
- Non distinguere staging e produzione.
- Non conservare artifact o log utili al debug.

## Checklist

- Il trigger del deploy e controllato?
- La CI passa prima del deploy?
- L'ambiente di produzione richiede approvazione?
- I segreti sono limitati all'environment corretto?
- I permessi del workflow sono minimi?
- Esiste rollback o procedura di recupero?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Pipeline CI GitHub Actions]]
- [[Environments GitHub Actions]]
- [[Deployment approvals GitHub Actions]]
- [[OIDC GitHub Actions]]

## Fonti

- [GitHub Docs - Deploying with GitHub Actions](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/control-deployments)
- [GitHub Docs - Deploying to third-party platforms](https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms)
