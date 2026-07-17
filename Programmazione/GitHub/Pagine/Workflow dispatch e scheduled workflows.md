---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, github-actions, workflow-dispatch, schedule]
aliases: [Workflow dispatch e scheduled workflows, Workflow manuali e schedulati GitHub Actions]
prerequisites: [GitHub Actions, Eventi e trigger GitHub Actions]
related: [Workflow GitHub Actions, Deploy con GitHub Actions, Debug GitHub Actions]
---

# Workflow dispatch e scheduled workflows

## Sintesi

`workflow_dispatch` permette di avviare un workflow manualmente. `schedule` permette di avviarlo a orari definiti con sintassi cron.

Sono trigger utili per operazioni non legate direttamente a una push: manutenzione, release manuali, pulizie, report, backup, controlli periodici.

## Quando usarlo

Usa `workflow_dispatch` quando:

- serve un bottone manuale;
- vuoi scegliere branch o input;
- vuoi avviare deploy controllati;
- vuoi eseguire manutenzioni su richiesta.

Usa `schedule` quando:

- vuoi controlli periodici;
- vuoi job di pulizia;
- vuoi report automatici;
- vuoi verifiche di sicurezza ricorrenti;
- vuoi workflow non dipendenti da commit recenti.

## Come funziona

Un workflow manuale deve dichiarare:

```yaml
on:
  workflow_dispatch:
```

Puo ricevere input. Si puo avviare da interfaccia GitHub, GitHub CLI o API.

Un workflow schedulato usa:

```yaml
on:
  schedule:
    - cron: "15 4 * * *"
```

I workflow schedulati girano sulla default branch. Vanno progettati come job non critici al minuto esatto, perche possono subire ritardi.

## API / Sintassi

Workflow manuale con input:

```yaml
on:
  workflow_dispatch:
    inputs:
      environment:
        description: "Ambiente"
        required: true
        type: choice
        options:
          - staging
          - production
```

Workflow schedulato:

```yaml
on:
  schedule:
    - cron: "30 5 * * 1-5"
```

## Esempio pratico

Deploy manuale verso staging o produzione:

```yaml
name: Manual deploy

on:
  workflow_dispatch:
    inputs:
      environment:
        type: choice
        required: true
        options:
          - staging
          - production

jobs:
  deploy:
    runs-on: ubuntu-latest
    environment: ${{ inputs.environment }}
    steps:
      - uses: actions/checkout@v4
      - run: ./deploy.sh ${{ inputs.environment }}
```

## Varianti

- **Workflow manuale senza input**: bottone semplice.
- **Workflow manuale con input**: adatto a deploy e manutenzione.
- **Workflow schedulato giornaliero**: controlli periodici.
- **Workflow schedulato settimanale**: manutenzione o report.
- **Workflow con piu schedule**: logica diversa in base a `github.event.schedule`.

## Errori comuni

- Usare `schedule` per operazioni che devono partire al minuto esatto.
- Dimenticare che i workflow schedulati girano sulla default branch.
- Non validare input usati dentro comandi shell.
- Dare a un workflow manuale permessi troppo ampi.
- Creare workflow manuali pericolosi senza environment approval.
- Usare cron in timezone sbagliato senza documentarlo.

## Checklist

- Il trigger manuale e necessario?
- Gli input sono chiari e limitati?
- Il workflow ha permessi minimi?
- Per produzione esiste un environment con approval?
- La schedule evita orari troppo congestionati?
- La timezone e documentata?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Eventi e trigger GitHub Actions]]
- [[Deploy con GitHub Actions]]
- [[Environments GitHub Actions]]

## Fonti

- [GitHub Docs - Manually running a workflow](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/manually-run-a-workflow)
- [GitHub Docs - Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
