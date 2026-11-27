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
  - notifiche
  - collaborazione
  - workflow
aliases:
  - Notifiche GitHub
  - GitHub notifications
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
title: Notifiche GitHub
---

# Notifiche GitHub

## Sintesi

Una notifica risponde a «**perché ho ricevuto questo aggiornamento?**», non a «quale lavoro è ancora aperto?». Puoi riceverla perché segui un repository o un thread, hai partecipato, sei stato menzionato, assegnato a un’issue o richiesto come revisore. Leggere la notifica non completa nessuna di queste attività.

## Due domande, due filtri

**Quali richieste di review non ho ancora letto?** Nella inbox delle notifiche usa:

```text
is:unread reason:review-requested
```

Per le menzioni dirette in un solo progetto puoi combinare `reason:mention` e `repo:OWNER/REPO`; `reason:assign` riguarda gli aggiornamenti motivati da un’assegnazione.

**Quali PR aperte richiedono ancora la mia review?** È una ricerca sulle PR, non sulle notifiche. Con `gh` autenticato, sostituendo il repository:

```bash
gh pr list --repo OWNER/REPO --state open --search "review-requested:@me"
```

Per il lavoro assegnato a te nelle issue:

```bash
gh issue list --repo OWNER/REPO --state open --assignee "@me"
```

Puoi aver letto la notifica e comparire ancora come revisore richiesto: è proprio il caso che il filtro dei non letti perderebbe.

## Come trattare una notifica

| Azione nella inbox | Effetto | Cosa non cambia |
| --- | --- | --- |
| Read | Toglie lo stato di non letta | Non approva la PR e non chiude l’issue. |
| Done | Rimuove il thread dalla vista corrente della inbox; resta consultabile tra i completati. | Non completa il lavoro nel repository e non equivale a disiscriversi. |
| Unsubscribe | Interrompe gli aggiornamenti ordinari della conversazione. | Una nuova menzione personale o del team, oppure una nuova richiesta di review, può coinvolgerti di nuovo. |

Per ridurre il rumore, modifica **Watch** sul repository (tutte le attività, eventi selezionati o solo partecipazione e menzioni secondo l’impostazione), oppure la sottoscrizione al singolo thread. Le preferenze di consegna via web, mobile o email sono un’altra scelta: cambiare canale non riassegna il lavoro. Una routine utile è controllare prima le review richieste, poi le menzioni e infine gli aggiornamenti informativi.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub|GitHub]]
- [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub|Review code su GitHub]]

## Fonti

- [GitHub Docs - About notifications](https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/about-notifications)
- [GitHub Docs: filtri supportati dalla inbox](https://docs.github.com/en/subscriptions-and-notifications/reference/inbox-filters)
- [GitHub Docs: gestire i thread nella inbox](https://docs.github.com/en/subscriptions-and-notifications/how-tos/viewing-and-triaging-notifications/managing-notifications-from-your-inbox)
- [GitHub CLI: filtrare le PR con --search](https://cli.github.com/manual/gh_pr_list)
