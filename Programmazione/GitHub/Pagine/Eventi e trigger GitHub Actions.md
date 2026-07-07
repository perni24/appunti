---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, events, triggers]
aliases: [Eventi e trigger GitHub Actions, Trigger GitHub Actions]
prerequisites: [Workflow GitHub Actions]
related: [Sintassi YAML GitHub Actions]
---

# Eventi e trigger GitHub Actions

## Sintesi

Gli **eventi** definiscono quando un workflow GitHub Actions parte. Il campo `on` puo ascoltare eventi come `push`, `pull_request`, `release`, `workflow_dispatch`, `schedule` e molti altri.

Scegliere il trigger giusto e importante per sicurezza, costi e tempi di feedback.

## Quando usarlo

Studia i trigger quando:

- una CI parte troppo spesso o troppo poco;
- vuoi eseguire controlli su pull request;
- vuoi pubblicare solo su tag;
- vuoi workflow manuali;
- vuoi job schedulati;
- vuoi evitare rischi con fork e secret.

## Come funziona

Il campo `on` puo essere:

- una singola stringa;
- una lista di eventi;
- una mappa con filtri per branch, tag o path.

Esempi:

```yaml
on: push
```

```yaml
on:
  push:
    branches: [main]
  pull_request:
```

## API / Sintassi

Esecuzione manuale:

```yaml
on:
  workflow_dispatch:
```

Schedulazione:

```yaml
on:
  schedule:
    - cron: "0 6 * * 1"
```

Filtro path:

```yaml
on:
  pull_request:
    paths:
      - "src/**"
      - "package.json"
```

## Esempio pratico

CI normale:

```yaml
on:
  pull_request:
  push:
    branches: [main]
```

Release su tag:

```yaml
on:
  push:
    tags:
      - "v*"
```

## Varianti

- **push**: parte su commit inviati.
- **pull_request**: parte su eventi della PR.
- **workflow_dispatch**: avvio manuale.
- **schedule**: avvio programmato.
- **release**: eventi di release.
- **workflow_run**: parte dopo un altro workflow.

## Errori comuni

- Usare `push` su tutti i branch senza bisogno.
- Usare `pull_request_target` senza capirne i rischi.
- Far partire deploy su PR da fork.
- Non filtrare path in monorepo.
- Usare schedule per job che devono essere deterministici al minuto esatto.
- Dimenticare che un tag puo avviare release se il workflow lo ascolta.

## Checklist

- Il trigger rispecchia lo scopo del workflow?
- Branch, tag o path sono filtrati?
- I secret sono disponibili solo in contesti sicuri?
- Le PR da fork sono gestite con cautela?
- I workflow manuali sono documentati?
- Il costo di esecuzione e proporzionato?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Workflow GitHub Actions]]
- [[Sintassi YAML GitHub Actions]]

## Fonti

- [GitHub Docs - Events that trigger workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
