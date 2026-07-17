---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [github, projects, project-management, issues]
aliases: [GitHub Projects, Projects GitHub]
prerequisites: [Issues GitHub, Labels milestones e assignees]
related: [Issues GitHub, Pull request]
---

# GitHub Projects

## Sintesi

**GitHub Projects** serve a organizzare issue, pull request e lavoro di progetto in viste strutturate. E utile quando una semplice lista di issue non basta piu e vuoi vedere stato, priorita, roadmap, assegnazioni e avanzamento.

Non sostituisce issue e pull request: le usa come elementi di lavoro e aggiunge viste, campi e filtri.

## Quando usarlo

Usa GitHub Projects quando:

- il repository ha molte issue aperte;
- vuoi distinguere backlog, in corso, review e completato;
- devi pianificare una release o milestone;
- vuoi coordinare lavoro tra piu persone;
- vuoi avere viste diverse per priorita, area o stato;
- vuoi collegare pianificazione e codice nello stesso posto.

## Come funziona

Un project raccoglie elementi come:

- issue;
- pull request;
- draft item;
- campi personalizzati;
- viste tabellari o board;
- filtri e ordinamenti.

La vista board e utile per flussi tipo Kanban. La vista tabellare e utile per pianificazione, priorita e triage.

## API / Sintassi

Esempio di stati utili:

```text
Backlog
Ready
In progress
In review
Blocked
Done
```

Filtri tipici:

```text
assignee:@me
label:bug
status:"In review"
```

## Esempio pratico

Per un progetto applicativo puoi usare:

- `Status`: backlog, in progress, review, done;
- `Priority`: high, medium, low;
- `Area`: frontend, backend, database, docs;
- `Milestone`: versione o obiettivo;
- `Assignee`: responsabile operativo.

Le issue descrivono il lavoro. Le pull request chiudono o implementano quel lavoro. Il project mostra lo stato complessivo.

## Varianti

- **Board Kanban**: utile per flusso operativo.
- **Tabella backlog**: utile per triage e priorita.
- **Roadmap**: utile per pianificazione temporale.
- **Project repository-level**: legato a un repository.
- **Project organization-level**: utile per piu repository.

## Errori comuni

- Usare Projects come duplicato manuale delle issue.
- Creare troppi stati.
- Non aggiornare stato e priorita.
- Usare assignee senza responsabilita reale.
- Pianificare in Projects ma discutere tutto altrove.
- Aggiungere campi che nessuno mantiene.

## Checklist

- Gli stati sono pochi e chiari?
- Ogni item importante e collegato a issue o PR?
- I campi sono davvero usati dal team?
- Le viste rispondono a domande pratiche?
- Il project mostra cosa e bloccato?
- Il lavoro completato viene chiuso anche nelle issue?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Issues GitHub]]
- [[Pull request]]
- [[Labels milestones e assignees]]

## Fonti

- [GitHub Docs - About Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)
