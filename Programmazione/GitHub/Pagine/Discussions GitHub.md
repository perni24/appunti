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
  - discussions
  - community
  - collaborazione
aliases:
  - Discussions GitHub
  - GitHub Discussions
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
title: Discussions GitHub
---

# Discussions GitHub

## Sintesi

Una **Discussion** conserva una conversazione: può essere utile anche quando non c’è nulla da implementare. Un’**issue** registra invece un problema o un’attività che vuoi assegnare e verificare. Una risposta utile a una domanda e la correzione di un difetto possono quindi vivere in due posti diversi, collegati tra loro.

## Scegli il formato in base alla risposta che cerchi

| Situazione | Dove aprirla | Cosa resta alla fine |
| --- | --- | --- |
| «Come configuro PostgreSQL al posto di SQLite?» | Categoria Q&A | Una risposta che puoi contrassegnare per renderla visibile a chi arriva dopo. |
| «Quali colonne dovremmo esportare?» | Discussione aperta, per esempio Ideas | Alternative, vincoli e decisione motivata; nessun obbligo di scegliere una risposta. |
| «È disponibile il nuovo esportatore» | Categoria Announcements | Comunicazione dei manutentori con spazio per le risposte. |
| «Con questi dati manca l’intestazione prevista» | Issue, se puoi descrivere caso osservato e risultato atteso | Un difetto da riprodurre, assegnare e verificare. |

Il nome della categoria è personalizzabile; è il **formato** a consentire azioni come **Mark as answer**. Prima di aprire un’altra discussione, cerca se esiste già una risposta e indica versione e contesto se la tua situazione è diversa.

## Esempio: dalla domanda al lavoro tracciato

1. Una persona chiede in Q&A se sia normale ottenere un CSV senza intestazione quando non ci sono righe. Il manutentore risponde che la specifica dell’esportatore prevede l’intestazione anche in quel caso.
2. La risposta chiarisce il comportamento atteso: contrassegnala nella Discussion. Non dimostra che il difetto sia stato corretto.
3. Con permessi **triage** o superiori sul repository, usa **Create issue from discussion**. GitHub crea una **nuova issue** con il contenuto del post iniziale e conserva le label. La Discussion e le sue risposte rimangono disponibili; non aspettarti che tutti i commenti diventino commenti dell’issue.
4. Nell’issue lascia un esempio minimo e un criterio osservabile: «Con zero righe il CSV contiene la sola intestazione». Collega la conversazione per il contesto. Se l’issue esiste già, basta linkarla nella risposta: non aprire un duplicato.

## Non confondere le due direzioni

**Convert issue to discussion** serve nel verso opposto, per esempio se una proposta ancora aperta è stata registrata come bug. Prima di convertire verifica che non si perda un’attività da seguire. Per una richiesta di supporto risolta non occorre aprire un’issue; per una decisione duratura aggiorna anche la guida o la specifica, non lasciare la risposta soltanto nel thread.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]

## Fonti

- [GitHub Docs - About discussions](https://docs.github.com/en/discussions/collaborating-with-your-community-using-discussions/about-discussions)
- [GitHub Docs: categorie e formati](https://docs.github.com/en/discussions/managing-discussions-for-your-community/managing-categories-for-discussions)
- [GitHub Docs: creare una issue da una Discussion](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/creating-an-issue#creating-an-issue-from-discussion)
- [GitHub Docs: risposte e conversione nel verso inverso](https://docs.github.com/en/discussions/managing-discussions-for-your-community/moderating-discussions)
