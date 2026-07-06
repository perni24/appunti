---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, issues, project-management, collaborazione]
aliases: [Issues GitHub, GitHub Issues]
prerequisites: [Repository GitHub]
related: [Labels milestones e assignees, Pull request]
---

# Issues GitHub

## Sintesi

Le **Issues GitHub** servono a tracciare bug, richieste, task, discussioni operative e lavoro da pianificare. Sono diverse dalle pull request: una issue descrive un problema o obiettivo; una pull request propone una modifica concreta al codice.

Una buona issue rende chiaro cosa va fatto, perche conta e come verificare la soluzione.

## Quando usarlo

Usa issue per:

- segnalare bug;
- pianificare feature;
- raccogliere decisioni tecniche;
- spezzare lavoro grande in task;
- collegare pull request a obiettivi tracciati;
- dare contesto a chi contribuira in futuro.

## Come funziona

Un'issue puo contenere:

- titolo;
- descrizione;
- label;
- assignee;
- milestone;
- commenti;
- checklist;
- riferimenti a commit e pull request.

Una pull request puo chiudere automaticamente una issue usando parole chiave come:

```text
Closes #12
Fixes #12
Resolves #12
```

## API / Sintassi

Creare issue con GitHub CLI:

```bash
gh issue create
```

Elencare issue:

```bash
gh issue list
```

Vedere una issue:

```bash
gh issue view 12
```

Chiudere una issue:

```bash
gh issue close 12
```

## Esempio pratico

Issue bug:

```md
## Problema

Il login fallisce quando il token e scaduto.

## Come riprodurre

1. Effettua login.
2. Attendi scadenza token.
3. Ricarica la pagina.

## Risultato atteso

L'utente viene riportato alla schermata di login.

## Risultato attuale

La pagina resta bloccata in loading.
```

## Varianti

- **Bug report**: comportamento errato riproducibile.
- **Feature request**: nuova capacita richiesta.
- **Task tecnico**: lavoro interno non visibile all'utente.
- **Discussion-like issue**: decisione aperta, se non si usa GitHub Discussions.
- **Epic leggera**: issue grande con checklist di sotto-task.

## Errori comuni

- Titoli vaghi come "non funziona".
- Mancanza di passi per riprodurre un bug.
- Mescolare troppi problemi nella stessa issue.
- Non chiudere issue risolte.
- Non collegare pull request e issue.
- Usare issue come chat disordinata senza decisioni finali.

## Checklist

- Il titolo e specifico?
- La descrizione spiega contesto e impatto?
- I passi di riproduzione sono chiari?
- Ci sono criteri di accettazione?
- Label, assignee e milestone sono corretti?
- La pull request collegata chiude l'issue?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Repository GitHub]]
- [[Pull request]]
- [[Labels milestones e assignees]]
