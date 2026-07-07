---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [github, github-actions, costi, limiti]
aliases: [Costi e limiti GitHub Actions, Limiti GitHub Actions]
prerequisites: [GitHub Actions, Jobs steps e runners]
related: [Cache GitHub Actions, Artifacts GitHub Actions, Self-hosted runners]
---

# Costi e limiti GitHub Actions

## Sintesi

GitHub Actions ha limiti tecnici e, in base al piano e al tipo di runner, puo consumare minuti e storage. Conoscere costi e limiti evita workflow lenti, code inattese, job terminati e sprechi.

Le soglie precise possono cambiare: per valori aggiornati va sempre controllata la documentazione ufficiale GitHub.

## Quando usarlo

Studia costi e limiti quando:

- una pipeline diventa lenta o costosa;
- usi matrix strategy ampia;
- carichi artifact pesanti;
- usi cache molto grandi;
- fai build su macOS o runner piu costosi;
- hai job lunghi;
- valuti self-hosted runners.

## Come funziona

Il consumo dipende da:

- durata dei job;
- sistema operativo del runner;
- numero di job in parallelo;
- storage per artifact e cache;
- tipo di account e piano;
- eventuali runner self-hosted o larger runners.

I limiti includono anche timeout, concorrenza, dimensione dei file, retention e code.

## API / Sintassi

Limitare durata di un job:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 20
    steps:
      - uses: actions/checkout@v4
      - run: npm test
```

Limitare retention degli artifact:

```yaml
- uses: actions/upload-artifact@v4
  with:
    name: reports
    path: reports/
    retention-days: 7
```

## Esempio pratico

Una matrix troppo ampia puo moltiplicare i costi:

```yaml
strategy:
  matrix:
    node: [18, 20, 22]
    os: [ubuntu-latest, windows-latest, macos-latest]
```

Questa configurazione genera 9 job. Se serve solo compatibilita principale, puoi tenere la matrix completa su schedule e una matrix ridotta su pull request.

## Varianti

- **Ottimizzazione CI**: cache, job paralleli e matrix ridotta.
- **Ottimizzazione artifact**: retention bassa e upload mirati.
- **Self-hosted runners**: riducono consumo di minuti GitHub, ma spostano costi e manutenzione su di te.
- **Runner macOS**: spesso piu costosi o piu limitati rispetto a Linux.
- **Timeout espliciti**: impediscono job bloccati troppo a lungo.

## Errori comuni

- Salvare artifact enormi senza retention.
- Eseguire matrix complete su ogni push.
- Non impostare `timeout-minutes`.
- Usare runner costosi per task che girano su Linux.
- Non cancellare cache o artifact obsoleti.
- Ignorare i limiti di job lunghi e code.

## Checklist

- I job hanno `timeout-minutes`?
- La matrix e proporzionata al rischio?
- Gli artifact sono necessari?
- La retention e limitata?
- La cache riduce davvero il tempo?
- I runner scelti sono adeguati al task?
- I limiti aggiornati sono stati verificati sulla documentazione GitHub?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Matrix strategy GitHub Actions]]
- [[Cache GitHub Actions]]
- [[Artifacts GitHub Actions]]
- [[Self-hosted runners]]

## Fonti

- [GitHub Docs - GitHub Actions limits](https://docs.github.com/en/actions/reference/limits)
