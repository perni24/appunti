---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: base
tags:
  - github
  - issues
  - labels
  - milestones
  - project-management
aliases:
  - Labels milestones e assignees
  - Label GitHub
  - Milestone GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
title: Labels milestones e assignees
---

# Labels milestones e assignees

## Sintesi

Su GitHub, label, milestone e assignee rispondono a **tre domande diverse**. Per l’issue «Il CSV perde l’intestazione quando il report è vuoto»:

| Campo | Domanda | Esempio |
| --- | --- | --- |
| Label | Che lavoro è? In quale area e con quale priorità? | `bug`, `area: export` |
| Milestone | Per quale obiettivo del repository vogliamo finirlo? | `v1.4.0` |
| Assignee | Chi prende in carico il prossimo passo? | La persona incaricata di correggere l’esportatore |

Le label sono proprie del repository. Un’issue o una PR può avere più label, ma una sola milestone alla volta. La milestone può avere una scadenza: la percentuale di completamento riflette gli elementi chiusi, non le ore lavorate né l’avvenuto rilascio. L’assignee non è necessariamente l’autore della futura PR e non diventa automaticamente il suo **reviewer**.

## Esempio: dal triage alla release

Gli esempi modificano un’issue **esistente**. Nel repository giusto, con `gh` autenticato e i permessi necessari, sostituisci `12` con il numero reale. Le label e la milestone da applicare devono già esistere.

Verifica quali label sono disponibili, senza crearne di quasi identiche:

```bash
gh label list
```

Aggiungi le due classificazioni, mantenendo quelle già presenti:

```bash
gh issue edit 12 --add-label bug --add-label "area: export"
```

Quando il team concorda l’obiettivo, imposta la milestone:

```bash
gh issue edit 12 --milestone "v1.4.0"
```

Se sei tu a prendere in carico il lavoro, aggiungiti come assegnatario:

```bash
gh issue edit 12 --add-assignee "@me"
```

Per verificare il risultato leggi i campi dell’issue, non soltanto il successo del comando:

```bash
gh issue view 12 --json labels,milestone,assignees
```

## Trovare e mantenere il lavoro

In GitHub cerca le issue aperte con bug assegnate a te:

```text
is:issue is:open label:bug assignee:@me
```

Per la lista generale dei bug aperti dalla CLI basta `gh issue list --label bug`. Usa poche label con significato condiviso (tipo, area, priorità o stato), non solo colori. Aggiorna l’assegnazione al passaggio di responsabilità. Una milestone può rappresentare un obiettivo anche senza una release; per viste trasversali fra repository considera invece GitHub Projects.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]

## Fonti

- [GitHub Docs - Managing labels](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels)
- [GitHub Docs - About milestones](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/about-milestones)
- [GitHub Docs: assegnare issue e PR](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/assigning-issues-and-pull-requests-to-other-github-users)
- [GitHub CLI: modificare label, milestone e assegnatari](https://cli.github.com/manual/gh_issue_edit)
