---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, variables, secrets, security]
aliases: [Variabili e secrets GitHub Actions, Secrets GitHub Actions]
prerequisites: [GitHub Actions, Sicurezza dei token GitHub]
related: [Secret scanning, Sintassi YAML GitHub Actions]
---

# Variabili e secrets GitHub Actions

## Sintesi

In GitHub Actions, **variables** e **secrets** servono a passare configurazione ai workflow. Le variabili sono per valori non sensibili. I secrets sono per credenziali e valori riservati.

Usarli correttamente evita hardcoding, riduce rischio di leak e rende i workflow riutilizzabili tra ambienti.

## Quando usarlo

Usa variabili quando:

- il valore non e sensibile;
- vuoi cambiare configurazione senza modificare YAML;
- vuoi differenziare ambiente o progetto.

Usa secrets quando:

- il valore e una credenziale;
- serve un token API;
- serve una chiave privata;
- il valore non deve comparire nei log.

## Come funziona

Le variabili possono essere disponibili a livello di repository, organizzazione o ambiente, a seconda della configurazione.

I secrets vengono referenziati tramite contesto `secrets`. Non devono essere stampati nei log. Alcuni eventi, soprattutto da fork, possono avere accesso limitato ai secrets per motivi di sicurezza.

## API / Sintassi

Variabile:

```yaml
env:
  NODE_ENV: test
```

Secret:

```yaml
steps:
  - name: Deploy
    env:
      API_TOKEN: ${{ secrets.API_TOKEN }}
    run: ./deploy.sh
```

Variable configuration:

```yaml
env:
  APP_ENV: ${{ vars.APP_ENV }}
```

## Esempio pratico

Deploy controllato:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh
        env:
          DEPLOY_TOKEN: ${{ secrets.DEPLOY_TOKEN }}
          APP_ENV: ${{ vars.APP_ENV }}
```

Qui `DEPLOY_TOKEN` e segreto. `APP_ENV` e configurazione non sensibile.

## Varianti

- **Repository secrets**: validi per un repository.
- **Organization secrets**: condivisi tra repository autorizzati.
- **Environment secrets**: legati a un ambiente come staging o production.
- **Repository variables**: configurazione non sensibile.
- **Environment variables**: valori disponibili durante il job.
- **OIDC**: alternativa a secret statici per cloud provider compatibili.

## Errori comuni

- Usare secrets per valori non sensibili e rendere tutto opaco.
- Usare variables per credenziali.
- Stampare secret nei log.
- Passare secret ad action terze non fidate.
- Dare secrets a workflow attivati da contesti non sicuri.
- Non ruotare secret dopo un leak.

## Checklist

- I valori sensibili sono secrets, non variables?
- I secret sono disponibili solo dove servono?
- I workflow da fork non ricevono credenziali rischiose?
- Le action che ricevono secret sono fidate?
- I secret hanno nomi chiari?
- Esiste rotazione o revoca per secret critici?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Sintassi YAML GitHub Actions]]
- [[Sicurezza dei token GitHub]]
- [[Secret scanning]]

## Fonti

- [GitHub Docs - Variables](https://docs.github.com/en/actions/concepts/workflows-and-actions/variables)
- [GitHub Docs - Use secrets](https://docs.github.com/en/actions/how-tos/write-workflows/choose-what-workflows-do/use-secrets)
