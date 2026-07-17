---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, github-actions, environments, deploy]
aliases: [Environments GitHub Actions, GitHub Actions environments]
prerequisites: [Deploy con GitHub Actions]
related: [Deployment approvals GitHub Actions, Variabili e secrets GitHub Actions]
---

# Environments GitHub Actions

## Sintesi

Gli **environments** di GitHub Actions rappresentano ambienti di deploy come `staging`, `production` o `preview`. Possono avere secret, variabili, approvazioni e regole di protezione dedicate.

Sono il modo corretto per distinguere deploy tecnici da deploy verso ambienti reali con rischio diverso.

## Quando usarlo

Usali quando:

- hai staging e produzione;
- vuoi secret separati per ambiente;
- vuoi approvazione prima del deploy;
- vuoi tracciare deployment history;
- vuoi limitare chi puo pubblicare;
- vuoi usare regole diverse per ambienti diversi.

## Come funziona

Nel job dichiari:

```yaml
environment: production
```

GitHub associa quel job all'environment. Se l'environment ha protection rules, il job puo restare in attesa prima di eseguire step sensibili.

Gli environment possono contenere:

- secrets;
- variables;
- reviewers richiesti;
- wait timer;
- branch o tag consentiti;
- history dei deployment.

## API / Sintassi

Job con environment:

```yaml
jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: production
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh
```

Environment con URL:

```yaml
environment:
  name: production
  url: https://example.com
```

## Esempio pratico

Separazione comune:

```text
staging:
  deploy automatico da main
  secret di staging

production:
  deploy manuale o da tag
  approval obbligatoria
  secret di produzione
```

Questo impedisce di usare credenziali di produzione in workflow di staging.

## Varianti

- **staging**: test realistico prima della produzione.
- **production**: ambiente utente finale.
- **preview**: ambiente temporaneo per PR.
- **environment con approval**: richiede revisori.
- **environment con branch restriction**: accetta deploy solo da branch o tag specifici.

## Errori comuni

- Usare gli stessi secret per tutti gli ambienti.
- Fare deploy produzione senza environment.
- Lasciare approval solo come convenzione manuale esterna.
- Non limitare branch o tag per produzione.
- Usare nomi environment incoerenti.
- Non controllare deployment history.

## Checklist

- Gli ambienti principali sono modellati?
- I secret sono separati per ambiente?
- Production richiede protezioni adeguate?
- Il workflow dichiara `environment`?
- Branch o tag ammessi sono limitati?
- La history dei deploy e consultabile?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Deploy con GitHub Actions]]
- [[Deployment approvals GitHub Actions]]
- [[Variabili e secrets GitHub Actions]]
- [[OIDC GitHub Actions]]

## Fonti

- [GitHub Docs - Managing environments](https://docs.github.com/en/actions/how-tos/deploy/configure-and-manage-deployments/manage-environments)
