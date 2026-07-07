---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: operational-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, troubleshooting, ci-cd]
aliases: [Troubleshooting GitHub Actions, Troubleshooting workflow GitHub Actions]
prerequisites: [GitHub Actions, Debug GitHub Actions]
related: [Troubleshooting permissions GitHub Actions, Troubleshooting secrets GitHub Actions, Checklist GitHub Actions]
---

# Troubleshooting GitHub Actions

## Obiettivo

Diagnosticare perche un workflow GitHub Actions non parte, fallisce, resta in coda, salta step o produce risultati diversi dall'ambiente locale.

Il metodo piu efficace e seguire la run dall'alto verso il basso: evento, workflow, job, step, comando, permessi, ambiente e dati disponibili.

## Quando usarlo

- Il workflow non parte.
- Un job fallisce.
- Uno step viene saltato.
- Il runner resta in coda.
- Un comando funziona in locale ma non in CI.
- Artifact, cache o secrets non si comportano come previsto.
- Serve aumentare il dettaglio dei log.

## Procedura

1. Verifica se il workflow e nella cartella `.github/workflows`.
2. Controlla l'evento che dovrebbe avviarlo.
3. Apri la run e identifica job e step fallito.
4. Leggi comando, working directory ed exit code.
5. Controlla runner e versione dei tool.
6. Verifica `permissions`, secrets e variables.
7. Controlla condizioni `if`, matrix e path filter.
8. Abilita debug logging solo se i log normali non bastano.
9. Riduci il problema a uno step minimo riproducibile.

## Snippet

Debug contestuale sicuro:

```yaml
- name: Debug context
  run: |
    echo "event=${GITHUB_EVENT_NAME}"
    echo "ref=${GITHUB_REF}"
    echo "sha=${GITHUB_SHA}"
    pwd
    ls
```

Debug logging:

```text
ACTIONS_STEP_DEBUG=true
ACTIONS_RUNNER_DEBUG=true
```

Timeout esplicito:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
```

## Adattamenti comuni

- **Workflow non parte**: controlla trigger, branch, path e workflow disabilitati.
- **Job skipped**: controlla condizioni `if` e dipendenze `needs`.
- **Runner in coda**: controlla disponibilita runner, self-hosted runner e limiti.
- **Errore su fork**: controlla disponibilita secrets e permessi ridotti.
- **Errore intermittente**: aggiungi retry mirati, log e artifact di debug.

## Debug rapido

- Se il workflow non appare, controlla path e sintassi YAML.
- Se lo step usa file mancanti, controlla checkout e working directory.
- Se una action esterna fallisce, controlla versione, input e permessi.
- Se la cache non viene usata, controlla key e lockfile.
- Se i log non bastano, abilita `ACTIONS_STEP_DEBUG`.
- Se il problema riguarda token o secrets, passa alle note dedicate.

## Checklist finale

- Evento corretto.
- Workflow valido.
- Job e step fallito identificati.
- Comando ed exit code letti.
- Runner e tool verificati.
- Permessi controllati.
- Secrets e variables controllati.
- Log sufficienti o debug logging attivo.
- Fix testato con una nuova run.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Workflow GitHub Actions]]
- [[Eventi e trigger GitHub Actions]]
- [[Debug GitHub Actions]]
- [[Checklist GitHub Actions]]
- [[Troubleshooting permissions GitHub Actions]]
- [[Troubleshooting secrets GitHub Actions]]

## Fonti

- [GitHub Docs - Enabling debug logging](https://docs.github.com/en/actions/how-tos/monitor-workflows/enable-debug-logging)
