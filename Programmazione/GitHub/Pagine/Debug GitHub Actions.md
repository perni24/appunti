---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, debug, troubleshooting]
aliases: [Debug GitHub Actions, Debug workflow GitHub Actions]
prerequisites: [GitHub Actions, Workflow GitHub Actions]
related: [Workflow GitHub Actions, Artifacts GitHub Actions, Permissions GitHub Actions, Troubleshooting GitHub Actions]
---

# Debug GitHub Actions

## Sintesi

Il **debug di GitHub Actions** consiste nel capire perche un workflow fallisce, resta in coda, salta step, non trova secret o produce risultati diversi dall'ambiente locale.

Un buon debug parte dai log, poi controlla trigger, contesti, permessi, ambiente del runner e differenze tra branch.

## Quando usarlo

Serve quando:

- un job fallisce senza messaggio chiaro;
- uno step viene saltato;
- un secret risulta vuoto;
- un workflow non parte;
- una cache non viene usata;
- un artifact non viene generato;
- un deploy funziona a mano ma fallisce in CI.

## Come funziona

Il debug pratico segue questo ordine:

1. apri la run fallita;
2. controlla quale job e quale step fallisce;
3. leggi comando, exit code e log;
4. verifica evento, branch e input;
5. controlla `permissions`, secrets e environment;
6. isola il comando fallito;
7. aggiungi log temporanei senza stampare segreti.

GitHub supporta anche log di debug piu verbosi tramite variabili o secret dedicati.

## API / Sintassi

Abilitare step debug logging:

```text
ACTIONS_STEP_DEBUG=true
```

Esempio di log sicuro:

```yaml
- name: Debug context minimale
  run: |
    echo "ref=${GITHUB_REF}"
    echo "event=${GITHUB_EVENT_NAME}"
    node --version
```

## Esempio pratico

Se una action fallisce solo su pull request:

```yaml
- name: Check event
  run: |
    echo "event=${GITHUB_EVENT_NAME}"
    echo "ref=${GITHUB_REF}"
    echo "sha=${GITHUB_SHA}"
```

Poi controlla se il workflow usa `pull_request`, `pull_request_target`, fork esterni o permessi ridotti del `GITHUB_TOKEN`.

## Varianti

- **Debug log GitHub**: abilita log piu verbosi.
- **Log applicativi**: aggiungi output nei comandi.
- **Artifact di debug**: carica file generati, report o snapshot.
- **Rerun failed jobs**: riesegue solo job falliti.
- **Rerun with debug logging**: utile per errori non riproducibili.
- **Debug locale**: replica il comando fuori da Actions quando possibile.

## Errori comuni

- Stampare secret nei log.
- Debuggare il comando sbagliato invece dello step fallito.
- Ignorare differenze tra `push` e `pull_request`.
- Non controllare `permissions`.
- Non verificare la working directory.
- Confondere cache mancata con dipendenze non installate.

## Checklist

- Il workflow e partito dall'evento previsto?
- Branch e commit sono quelli attesi?
- Lo step fallito mostra exit code e comando?
- I secret sono disponibili nel contesto giusto?
- I permessi del job sono sufficienti ma non eccessivi?
- Il runner ha tool e versioni attese?
- I file di debug sono caricati come artifact se servono?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Workflow GitHub Actions]]
- [[Artifacts GitHub Actions]]
- [[Permissions GitHub Actions]]
- [[Troubleshooting GitHub Actions]]

## Fonti

- [GitHub Docs - Enable debug logging](https://docs.github.com/en/actions/how-tos/monitor-workflows/enable-debug-logging)
