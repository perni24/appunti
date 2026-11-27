---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - issue-template
  - pull-request-template
  - collaborazione
aliases:
  - Issue templates
  - Pull request templates
  - Template GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
related:
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
title: Issue templates e pull request templates
---

# Issue templates e pull request templates

## Sintesi

Per ricevere una segnalazione utile puoi offrire **testo libero guidato** (template Markdown) oppure **campi da compilare** (issue form YAML). Una pull request usa invece un template di testo: chiede all’autore cosa cambia e come l’ha verificato, ma non impone che i test passino.

## Quale file vede chi contribuisce?

| File, dalla radice del repository | Effetto |
| --- | --- |
| `.github/ISSUE_TEMPLATE/bug_report.md` | Il selettore delle issue propone un testo modificabile. Inserisci frontmatter YAML con `name` e `about`, seguito dalle sezioni da compilare. |
| `.github/ISSUE_TEMPLATE/bug_report.yml` | Il selettore presenta un modulo con `name`, `description` e `body`. All’invio le risposte diventano il corpo Markdown modificabile dell’issue. |
| `.github/ISSUE_TEMPLATE/config.yml` | Configura il selettore, per esempio link al supporto o disponibilità delle issue vuote. Non è un modulo. |
| `.github/pull_request_template.md` | Precompila la descrizione di una nuova PR; sono supportati anche la radice e `docs/`. Non richiede frontmatter né accetta issue forms. |

I template devono essere sul **branch predefinito** per essere proposti ai collaboratori. Una PR che li introduce permette di rivederne il testo, ma da sola non li attiva. Se mantieni più template per PR, usa una directory `PULL_REQUEST_TEMPLATE/` e seleziona il file con il parametro `template`: non aspettarti lo stesso selettore delle issue.

## Esempio: un modulo per segnalare un difetto

Contenuto di `.github/ISSUE_TEMPLATE/bug_report.yml`. I due campi separano ciò che permette di ripetere il caso da ciò che dovrebbe succedere:

```yaml
name: Segnalazione difetto
description: Descrivi un caso riproducibile e il risultato previsto.
body:
  - type: textarea
    id: riproduzione
    attributes:
      label: Passi e risultato osservato
      placeholder: Esporta un report con zero righe. Il file ottenuto è vuoto.
    validations:
      required: true
  - type: input
    id: atteso
    attributes:
      label: Risultato atteso
      placeholder: Il file deve contenere la riga di intestazione.
    validations:
      required: true
```

`placeholder` è un suggerimento, non una risposta precompilata. Secondo lo schema GitHub la validazione `required` per questi campi blocca l’invio nei repository pubblici; non affidarle la qualità del contenuto. Per una proposta di funzionalità chiedi invece problema, alternativa attuale e risultato desiderato. Non chiedere segreti o segnalazioni riservate in un modulo pubblico: indica il canale privato previsto dal progetto.

## Esempio: un template per la PR di correzione

Contenuto di `.github/pull_request_template.md`:

```md
## Problema e modifica
<!-- Collega l'issue e indica cosa cambia per chi usa l'esportatore. -->

## Come verificare
<!-- Indica dati di ingresso, comando o procedura e risultato atteso. -->

## Compatibilità
<!-- Il formato cambia per chi legge il CSV? Se no, spiegalo in una riga. -->
```

Una descrizione compilata dovrebbe permettere al revisore di rifare la prova. Se il passaggio dei test è obbligatorio, configuralo come **required status check**: né un commento HTML né una casella Markdown bloccano il merge. Per controllare l’installazione apri la schermata di una nuova issue o PR dopo il merge dei template; non occorre pubblicarla.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub|Review code su GitHub]]
- [[Programmazione/GitHub/Pagine/Markdown su GitHub|Markdown su GitHub]]

## Fonti

- [GitHub Docs - Configuring issue templates](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/configuring-issue-templates-for-your-repository)
- [GitHub Docs - Creating a pull request template](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository)
- [GitHub Docs: differenze tra template e form](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/about-issue-and-pull-request-templates)
- [GitHub Docs: schema di input, textarea e validazioni](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema)
