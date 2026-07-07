---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [github, github-actions, runners, self-hosted]
aliases: [Self-hosted runners, Runner self-hosted GitHub Actions]
prerequisites: [GitHub Actions, Jobs steps e runners]
related: [Permissions GitHub Actions, OIDC GitHub Actions, Costi e limiti GitHub Actions]
---

# Self-hosted runners

## Sintesi

I **self-hosted runners** sono macchine gestite da te che eseguono job GitHub Actions. A differenza dei runner GitHub-hosted, ti danno controllo su hardware, sistema operativo, rete e software installato.

Sono potenti, ma aumentano responsabilita operative e rischi di sicurezza.

## Quando usarlo

Usali quando:

- servono strumenti non presenti nei runner GitHub-hosted;
- servono hardware specifici, GPU o architetture particolari;
- devi accedere a una rete privata;
- vuoi riusare infrastruttura aziendale;
- i job sono troppo pesanti o lunghi;
- hai requisiti di compliance o isolamento.

## Come funziona

Un self-hosted runner viene registrato su GitHub a livello di:

- repository;
- organizzazione;
- enterprise.

Nel workflow lo selezioni con `runs-on` usando label come:

```yaml
runs-on: self-hosted
```

oppure label piu specifiche:

```yaml
runs-on: [self-hosted, linux, x64, gpu]
```

La macchina esegue i job e comunica con GitHub. Devi gestire patch, isolamento, credenziali, pulizia workspace e disponibilita.

## API / Sintassi

Job su runner self-hosted:

```yaml
jobs:
  build:
    runs-on: [self-hosted, linux, x64]
    steps:
      - uses: actions/checkout@v4
      - run: ./build.sh
```

## Esempio pratico

Un progetto embedded potrebbe avere bisogno di compilatori, toolchain e dispositivi collegati fisicamente:

```yaml
jobs:
  firmware:
    runs-on: [self-hosted, linux, arm-toolchain]
    steps:
      - uses: actions/checkout@v4
      - run: make test
      - run: make firmware
```

Qui il runner self-hosted evita di riconfigurare ogni volta un ambiente molto specifico.

## Varianti

- **Repository runner**: limitato a un repository.
- **Organization runner**: condiviso tra piu repository.
- **Enterprise runner**: gestito a livello enterprise.
- **Runner fisico**: utile per hardware specifico.
- **Runner cloud**: utile per scalare o isolare ambienti.
- **Runner containerizzato**: utile per ambienti piu riproducibili.

## Errori comuni

- Eseguire codice non fidato su runner con accesso alla rete interna.
- Non pulire workspace e credenziali tra job.
- Usare runner condivisi senza policy di accesso.
- Non aggiornare sistema operativo e tool installati.
- Dare label troppo generiche.
- Non monitorare runner offline o bloccati.

## Checklist

- Il runner esegue solo repository fidati?
- Le label sono specifiche?
- Esiste pulizia tra job?
- Le credenziali sono temporanee quando possibile?
- Il sistema operativo viene aggiornato?
- I log e la disponibilita sono monitorati?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Actions]]
- [[Jobs steps e runners]]
- [[Permissions GitHub Actions]]
- [[OIDC GitHub Actions]]
- [[Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Self-hosted runners](https://docs.github.com/en/actions/concepts/runners/self-hosted-runners)
