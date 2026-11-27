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
  - projects
  - project-management
  - issues
aliases:
  - GitHub Projects
  - Projects GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Labels milestones e assignees]]"
related:
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
title: GitHub Projects
---

# GitHub Projects

## Sintesi

Un **Project** raccoglie issue, pull request e bozze, anche di repository diversi. La stessa attività può comparire in una tabella, in una board per stato e in una roadmap per data: sono viste degli stessi elementi, non tre copie da aggiornare. Il Project appartiene a un **utente o a un’organizzazione**. La scheda Projects del repository può elencare un Project dello stesso proprietario, ma il collegamento non concede automaticamente l’accesso né importa tutte le issue.

## Che cosa stai modificando?

| Elemento | Esempio | Dove ha effetto |
| --- | --- | --- |
| Issue o PR esistente | Titolo, assignee, label, milestone | Sono dati dell’elemento nel repository: non sono una copia privata della board. |
| Campo del Project | Priorità, iterazione, data obiettivo | Serve alla pianificazione del Project. La priorità non deve essere anche una label, a meno che serva fuori dal Project. |
| Bozza (*draft issue*) | «Valutare l’export PDF» | Rimane nel Project finché non la converti in una issue scegliendo il repository. |
| Vista | Board raggruppata per `Status` | Cambiare ordinamento o filtro cambia ciò che vedi, non chiude le issue escluse. |

## Esempio: seguire una correzione fino alla consegna

1. Nel Project aggiungi **l’issue esistente** «Il CSV vuoto perde l’intestazione», incollandone l’URL in una nuova riga. Non creare una bozza con lo stesso titolo: sarebbe un elemento diverso.
2. Nella tabella aggiungi un campo a scelta singola `Priority` e assegna una priorità. Per registrare chi farà il lavoro usa `Assignees` sull’issue. Se l’obiettivo è una release del repository usa la milestone; se è un intervallo di pianificazione del team usa un campo iterazione.
3. Salva una board raggruppata per `Status`. Per vedere solo il tuo lavoro in corso, usa il filtro seguente nella **vista del Project**; il valore deve esistere tra le opzioni del campo:

```text
assignee:@me status:"In progress"
```

4. Se l’elemento sembra sparito, torna alla tabella senza filtri. Per una roadmap, imposta i campi data o iterazione usati dalla vista: una riga senza collocazione temporale non dice quando il lavoro sarà consegnato.

## Prima di spostare una scheda in Done

Non dedurre lo stato dell’issue dal solo nome della colonna. Nei Projects dello stesso proprietario del repository, GitHub documenta una sincronizzazione fra opzioni `Status` corrispondenti e stati delle issue (funzione in anteprima): se è attiva, uno spostamento può anche chiudere o riaprire l’issue. Controlla **Workflows** nel Project: anche a sincronizzazione disattivata, un’automazione configurata può chiudere l’issue al cambio di stato o impostare `Done` alla chiusura. Verifica l’esito aprendo l’issue.

Per popolare il Project, il workflow **Auto-add** può aggiungere elementi che corrispondono al filtro quando vengono creati o aggiornati. Abilitarlo non importa retroattivamente tutto il backlog: aggiungi a parte gli elementi già esistenti che non hanno ricevuto aggiornamenti.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Labels milestones e assignees|Labels milestones e assignees]]
- [[Programmazione/GitHub/Promemoria/Pagine/GitHub - Issue label e progetti|Promemoria: issue, label e progetti]]

## Fonti

- [GitHub Docs - About Projects](https://docs.github.com/en/issues/planning-and-tracking-with-projects/learning-about-projects/about-projects)
- [GitHub Docs: collegare un Project al repository](https://docs.github.com/en/issues/planning-and-tracking-with-projects/managing-your-project/adding-your-project-to-a-repository)
- [GitHub Docs: filtri delle viste](https://docs.github.com/en/issues/planning-and-tracking-with-projects/customizing-views-in-your-project/filtering-projects)
- [GitHub Docs: sincronizzazione con gli stati delle issue](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issue-statuses)
- [GitHub Docs: automazioni integrate e disattivazione della sincronizzazione](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/using-the-built-in-automations)
- [GitHub Docs: aggiunta automatica e limiti per gli elementi esistenti](https://docs.github.com/en/issues/planning-and-tracking-with-projects/automating-your-project/adding-items-automatically)
