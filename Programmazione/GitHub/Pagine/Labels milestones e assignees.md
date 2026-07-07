---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, issues, labels, milestones, project-management]
aliases: [Labels milestones e assignees, Label GitHub, Milestone GitHub]
prerequisites: [Issues GitHub]
related: [Issues GitHub, Pull request]
---

# Labels milestones e assignees

## Sintesi

**Labels**, **milestones** e **assignees** aiutano a organizzare issue e pull request su GitHub.

- **Label**: classificano tipo, priorita, area o stato.
- **Milestone**: raggruppano lavoro verso una scadenza o versione.
- **Assignee**: indica chi e responsabile di portare avanti il lavoro.

Questi campi rendono il backlog leggibile e permettono di filtrare rapidamente cio che conta.

## Quando usarlo

Usali quando:

- il repository ha molte issue;
- piu persone collaborano;
- devi distinguere bug, feature e task;
- vuoi pianificare release;
- vuoi sapere chi sta lavorando su cosa;
- vuoi costruire viste in GitHub Projects.

## Come funziona

Le label sono flessibili. Una tassonomia minima puo includere:

- `bug`;
- `feature`;
- `documentation`;
- `security`;
- `good first issue`;
- `priority: high`;
- `status: blocked`.

Le milestone raccolgono issue e pull request verso un obiettivo, per esempio `v1.2.0`.

Gli assignee indicano responsabilita operativa, non per forza autore unico del codice.

## API / Sintassi

Elencare issue filtrate per label:

```bash
gh issue list --label bug
```

Assegnare una issue:

```bash
gh issue edit 12 --add-assignee username
```

Aggiungere label:

```bash
gh issue edit 12 --add-label bug
```

Filtrare in GitHub search:

```text
is:issue is:open label:bug assignee:@me
```

## Esempio pratico

Bug critico per una release:

```text
Issue: Login bloccato con token scaduto
Labels: bug, priority: high, area: auth
Milestone: v1.4.0
Assignee: luca
```

Questa combinazione comunica tipo di lavoro, urgenza, area tecnica, obiettivo e responsabilita.

## Varianti

- **Label per tipo**: `bug`, `feature`, `docs`.
- **Label per area**: `area: frontend`, `area: backend`.
- **Label per priorita**: `priority: high`.
- **Label per stato**: `status: blocked`, `status: needs review`.
- **Milestone di release**: raggruppa lavoro di versione.
- **Milestone di progetto**: raggruppa lavoro non legato a release.

## Errori comuni

- Creare troppe label quasi identiche.
- Usare colori senza convenzione.
- Confondere assignee con reviewer.
- Lasciare issue assegnate a persone che non ci lavorano piu.
- Usare milestone come categorie permanenti.
- Non aggiornare label e stato dopo cambiamenti.

## Checklist

- Le label sono poche e comprensibili?
- Esiste una convenzione per tipo, area, priorita e stato?
- Le milestone hanno obiettivo chiaro?
- Gli assignee riflettono responsabilita reale?
- Le issue bloccate sono marcate?
- I filtri principali funzionano senza ambiguita?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Issues GitHub]]
- [[Pull request]]

## Fonti

- [GitHub Docs - Managing labels](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/managing-labels)
- [GitHub Docs - About milestones](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/about-milestones)
