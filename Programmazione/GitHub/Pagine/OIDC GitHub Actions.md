---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [github, github-actions, oidc, security, deploy]
aliases: [OIDC GitHub Actions, OpenID Connect GitHub Actions]
prerequisites: [Permissions GitHub Actions, Deploy con GitHub Actions]
related: [Sicurezza dei token GitHub, Environments GitHub Actions]
---

# OIDC GitHub Actions

## Sintesi

**OIDC in GitHub Actions** permette a un workflow di ottenere credenziali temporanee da un provider esterno, come un cloud provider, senza salvare secret statici a lunga durata in GitHub.

E una pratica importante per deploy sicuri: il workflow dimostra la propria identita tramite token OIDC e il provider decide se fidarsi in base a repository, branch, tag, environment o altri claim.

## Quando usarlo

Usalo quando:

- fai deploy verso cloud provider;
- vuoi evitare access key statiche;
- vuoi credenziali temporanee;
- vuoi policy basate su branch, tag o environment;
- vuoi ridurre impatto di secret leak;
- il provider supporta federated identity.

## Come funziona

Il workflow richiede permesso:

```yaml
permissions:
  id-token: write
  contents: read
```

Poi usa una action o comando del provider per scambiare il token OIDC GitHub con credenziali temporanee.

Il provider valida claim come:

- repository;
- owner;
- branch o tag;
- environment;
- workflow;
- actor.

## API / Sintassi

Schema generico:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    permissions:
      contents: read
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - name: Authenticate with cloud provider
        run: ./auth-with-oidc.sh
      - run: ./deploy.sh
```

La configurazione concreta dipende dal provider.

## Esempio pratico

Policy concettuale lato cloud:

```text
Consenti deploy solo se:
- repository = owner/app
- branch = main oppure tag = v*
- environment = production
- workflow = deploy.yml
```

In questo modo una pull request non autorizzata non puo ottenere credenziali production.

## Varianti

- **OIDC verso AWS**: assume role con trust policy.
- **OIDC verso Azure**: federated credentials.
- **OIDC verso Google Cloud**: workload identity federation.
- **OIDC verso registry o package provider**: quando supportato.
- **OIDC con environment**: restringe ulteriormente deploy production.

## Errori comuni

- Aggiungere `id-token: write` a tutti i workflow.
- Policy cloud troppo permissiva.
- Non vincolare repository, branch, tag o environment.
- Usare OIDC ma lasciare secret statici attivi.
- Non separare staging e production.
- Fidarsi di trigger non sicuri come PR da fork.

## Checklist

- Il provider supporta OIDC?
- Il workflow usa `id-token: write` solo dove serve?
- La policy limita repository e ref?
- Production usa environment protetto?
- Le vecchie credenziali statiche sono rimosse?
- I log non espongono token o credenziali temporanee?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Deploy con GitHub Actions]]
- [[Permissions GitHub Actions]]
- [[Sicurezza dei token GitHub]]
- [[Environments GitHub Actions]]

## Fonti

- [GitHub Docs - OpenID Connect](https://docs.github.com/en/actions/concepts/security/openid-connect)
- [GitHub Docs - OIDC security hardening](https://docs.github.com/en/actions/how-tos/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
