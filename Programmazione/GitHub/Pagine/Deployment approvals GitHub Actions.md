---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, deployment, approvals]
aliases: [Deployment approvals GitHub Actions, Review deployments]
prerequisites: [Environments GitHub Actions]
related: [Deploy con GitHub Actions, Environments GitHub Actions]
---

# Deployment approvals GitHub Actions

## Sintesi

Le **deployment approvals** permettono di mettere in pausa un job di deploy finche una persona autorizzata non approva l'esecuzione. Sono collegate agli environments e sono particolarmente utili per produzione.

L'approvazione non sostituisce CI e review: aggiunge un controllo finale sul momento del rilascio.

## Quando usarlo

Usale quando:

- il deploy e verso produzione;
- il deploy ha impatto utente;
- serve separazione tra merge e rilascio;
- vuoi evitare deploy accidentali;
- vuoi controllo umano su finestre operative;
- devi rispettare processi di change management.

## Come funziona

Configuri reviewer richiesti sull'environment. Quando un job usa quell'environment, GitHub sospende il job prima di accedere ai secret e prima di eseguire gli step protetti.

Una persona autorizzata puo:

- approvare;
- rifiutare;
- lasciare commento;
- controllare quale workflow e commit stanno per essere rilasciati.

## API / Sintassi

Workflow:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - run: ./deploy.sh
```

La richiesta di review si configura nelle impostazioni dell'environment, non direttamente nello YAML.

## Esempio pratico

Flusso produzione:

```text
tag v1.2.0 creato
workflow release parte
build e test passano
job deploy production resta in attesa
release manager approva
deploy procede
```

Questo separa automazione e controllo operativo.

## Varianti

- **Required reviewers**: persone o team che approvano.
- **Wait timer**: ritardo prima del deploy.
- **Branch/tag restriction**: limita sorgenti ammesse.
- **Custom protection rules**: controlli esterni, se disponibili.
- **Self-approval limit**: evita che autore approvi il proprio deploy, quando configurato.

## Errori comuni

- Approvare senza leggere commit e workflow.
- Usare approval al posto di test automatici.
- Mettere troppi approvatori obbligatori e bloccare release.
- Non definire chi approva fuori orario.
- Non distinguere staging e production.
- Lasciare secret produzione accessibili senza approval.

## Checklist

- Production richiede review?
- I reviewer sono persone o team adatti?
- L'approvatore vede commit, tag e artifact?
- La CI passa prima dell'approvazione?
- I secret production sono legati all'environment?
- Esiste procedura per rifiutare o annullare deploy?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Deploy con GitHub Actions]]
- [[Environments GitHub Actions]]
- [[Release automation GitHub Actions]]

## Fonti

- [GitHub Docs - Reviewing deployments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/review-deployments)
