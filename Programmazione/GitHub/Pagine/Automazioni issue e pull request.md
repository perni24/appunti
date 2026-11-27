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
  - automazione
  - issues
  - pull-request
aliases:
  - Automazioni issue e pull request
  - Automazioni GitHub issue PR
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/GitHub REST API]]"
related:
  - "[[Programmazione/GitHub/Pagine/GitHub Actions]]"
  - "[[Programmazione/GitHub/Pagine/GitHub Apps]]"
  - "[[Programmazione/GitHub/Pagine/Webhooks GitHub]]"
  - "[[Programmazione/GitHub/Pagine/GitHub REST API]]"
title: Automazioni issue e pull request
---

# Automazioni issue e pull request

## Sintesi

Decidi prima **l’effetto** dell’automazione: applicare una label modifica i metadati, scrivere un commento notifica persone, un check richiesto può bloccare il merge. Per il semplice triage di un repository bastano un evento Actions e il token del job. Una GitHub App con webhook è più adatta se lo stesso servizio deve mantenere stato e policy per più installazioni.

## Esempio pratico: una sola label sulle nuove issue

Workflow didattico per un repository di prova con Issues abilitate e label `triage` già esistente. **Se installato, modifica davvero le nuove issue.** Non richiede checkout, non esegue codice della segnalazione e non usa token personali.

```yaml
name: Triage delle nuove issue
on:
  issues:
    types: [opened]
permissions: {}
jobs:
  etichetta:
    runs-on: ubuntu-latest
    permissions:
      issues: write
    steps:
      - name: Aggiungi triage senza sostituire le altre label
        shell: bash
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          REPO: ${{ github.repository }}
          NUMBER: ${{ github.event.issue.number }}
        run: gh api --method POST "repos/$REPO/issues/$NUMBER/labels" -f 'labels[]=triage' --silent
```

Qui `POST` **aggiunge** la label. Se una issue ha già `bug`, il risultato atteso è `bug` più `triage`; ripetere l’aggiunta non duplica l’etichetta. `PUT` sullo stesso endpoint imposta invece l’intero insieme e potrebbe eliminare `bug`. La stessa garanzia non vale per un commento: se il report deve essere aggiornato, identifica il commento del bot e aggiorna quello invece di crearne uno a ogni run.

## Variante: classificare una PR senza eseguirne il codice

Per distinguere le aree del vault, leggi con la REST API **tutte** le pagine dei file modificati della PR. Su GitHub.com questo endpoint restituisce al massimo 3.000 file per PR, anche con paginazione. Questo esempio calcola una proposta di label dai metadati; non scrive nulla e non richiede checkout. In una rinomina tra due aree conta sia il percorso precedente sia quello attuale.

```js
export function etichetteProposte(files) {
  const aree = [
    ['Programmazione/', 'programmazione'],
    ['Stampante 3D/', 'stampa-3d'],
    ['Programmi open source/', 'open-source']
  ];
  const percorsi = files.flatMap(f => [f.filename, f.previous_filename].filter(Boolean));
  return aree.filter(([prefisso]) => percorsi.some(p => p.startsWith(prefisso)))
    .map(([, label]) => label);
}
```

Un elenco incompleto non giustifica la rimozione di label esistenti. Nelle PR da fork separa la **classificazione in lettura** dalla eventuale scrittura autorizzata. Non passare a `pull_request_target` per eseguire codice della PR con privilegi maggiori. Per richieste di review valuta CODEOWNERS; per stale issue prevedi un avviso e un criterio di esclusione prima di chiudere lavoro ancora attivo. Una label informativa non rende il controllo obbligatorio per il merge.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Labels milestones e assignees|Labels milestones e assignees]]
- [[Programmazione/GitHub/Pagine/GitHub Actions|GitHub Actions]]
- [[Programmazione/GitHub/Pagine/GitHub REST API|GitHub REST API]]
- [[Programmazione/GitHub/Pagine/GitHub Apps|GitHub Apps]]
- [[Programmazione/GitHub/Pagine/Webhooks GitHub|Webhooks GitHub]]

## Fonti

- [GitHub Docs - Workflow di labeling](https://docs.github.com/en/actions/tutorials/manage-your-work/add-labels-to-issues)
- [GitHub REST - Aggiungere o sostituire label](https://docs.github.com/en/rest/issues/labels)
- [GitHub REST - File modificati di una pull request](https://docs.github.com/en/rest/pulls/pulls#list-pull-requests-files)
- [GitHub Docs - Eventi di issue e pull request](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows)
