---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: avanzato
tags:
  - github
  - github-actions
  - concurrency
  - ci-cd
aliases:
  - Concurrency e cancel-in-progress
  - Concurrency GitHub Actions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
related:
  - "[[Programmazione/GitHub/Pagine/Deploy con GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Workflow GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/Debug GitHub Actions]]"
title: Concurrency e cancel-in-progress
---

# Concurrency e cancel-in-progress

## Sintesi

`concurrency.group` dà un nome a una risorsa condivisa. Nel repository, due run o job con lo stesso gruppo non possono usarla contemporaneamente. Per la CI la risorsa può essere «la verifica di questa PR»; per il deploy è spesso «il sito pubblico». **Annullare il lavoro in corso** e **conservare tutti quelli in attesa** sono due decisioni distinte.

## Caso reale: tre push al sito Quartz

In `.github/workflows/deploy-pages.yml` il gruppo è definito a livello di workflow. Coordina quindi **l’intero run**, non solo l’ultimo step di pubblicazione:

```yaml
concurrency:
  group: pages
  cancel-in-progress: false
```

Supponi che A stia ancora girando. Arriva B e resta in attesa. Se arriva C **prima che B inizi**, C prende il posto di B: A continua, B viene annullato, C resta in attesa. Il motivo è la coda predefinita `single`. `false` protegge il run attivo: **non** promette un deploy per ogni push. Per un sito interessa spesso il contenuto più recente; non usare alla cieca questa impostazione per migrazioni che devono essere applicate tutte.

## Due configurazioni, due obiettivi

**CI su pull request:** frammento a livello di workflow dedicato all’evento `pull_request`. Due aggiornamenti della stessa PR condividono il gruppo, due PR diverse no. Il run ormai superato può essere cancellato.

```yaml
concurrency:
  group: ci-note-pr-${{ github.event.pull_request.number }}
  cancel-in-progress: true
```

**Deploy distinti che devono aspettare:** frammento da mettere sul job di deploy se vuoi lasciare le build indipendenti. Su GitHub.com `queue: max` permette fino a 100 elementi in attesa; oltre il limite quelli aggiuntivi vengono annullati. Non si combina con `cancel-in-progress: true`.

```yaml
concurrency:
  group: produzione
  queue: max
```

La coda segue l’arrivo **al gruppo**, non necessariamente l’ordine dei commit: due build di durata diversa possono arrivare al deploy in ordine inverso. Serializzare non rende atomiche le operazioni esterne e annullare un job non disfa i suoi effetti.

## Errori comuni

I nomi dei gruppi non distinguono maiuscole e minuscole e possono collidere tra workflow dello stesso repository. Per isolare CI diverse usa un prefisso univoco o `github.workflow`; per proteggere la stessa destinazione usa invece intenzionalmente la **stessa** chiave. Non basare la chiave su un campo della PR se il workflow ascolta anche eventi che non hanno una PR.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Workflow GitHub Actions|Workflow GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Deploy con GitHub Actions|Deploy con GitHub Actions]]
- [[Programmazione/GitHub/Pagine/Debug GitHub Actions|Debug GitHub Actions]]

## Fonti

- [GitHub Docs - Gruppi, coda e cancellazione](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/control-workflow-concurrency)
- [GitHub Docs - Concurrency a livello di job e workflow](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax)
