---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, markdown, documentazione, readme]
aliases: [Markdown su GitHub, GitHub Flavored Markdown, GFM]
prerequisites: [README LICENSE e gitignore]
related: [Repository GitHub, Pull request, Issues GitHub]
---

# Markdown su GitHub

## Sintesi

GitHub usa una variante di Markdown chiamata spesso **GitHub Flavored Markdown**. Serve per `README.md`, issue, pull request, commenti, wiki, discussioni e documentazione.

Scrivere bene Markdown su GitHub rende repository, issue e pull request piu leggibili e facili da mantenere.

## Quando usarlo

Usalo quando:

- scrivi un `README.md`;
- documenti installazione o API;
- apri issue o pull request;
- lasci commenti di review;
- crei checklist operative;
- vuoi includere blocchi codice, tabelle o link.

## Come funziona

GitHub renderizza Markdown in HTML. Supporta:

- titoli;
- liste;
- link;
- immagini;
- blocchi di codice con evidenziazione;
- tabelle;
- checklist;
- quote;
- mention;
- riferimenti a issue e pull request.

Nei repository GitHub, i file Markdown sono spesso il primo punto di lettura per persone e modelli LLM.

## API / Sintassi

Esempi principali:

````md
# Titolo

## Sezione

- Elemento
- Altro elemento

```bash
npm test
```

- [ ] Task aperto
- [x] Task completato

| Campo | Significato |
| --- | --- |
| `main` | Branch principale |

Vedi #12
````

Quando devi mostrare blocchi Markdown dentro altro Markdown, fai attenzione a non rompere le code fence.

## Esempio pratico

Template di pull request:

```md
## Cosa cambia

- 

## Verifica

- [ ] Test eseguiti
- [ ] Lint eseguito
- [ ] Documentazione aggiornata

## Note

-
```

Questo formato aiuta autore e reviewer a controllare sempre gli stessi punti.

## Varianti

- **README**: documentazione stabile del progetto.
- **Issue body**: descrizione di bug, feature o task.
- **Pull request body**: contesto della modifica.
- **Commenti review**: osservazioni su righe specifiche.
- **Checklist**: tracciamento di sotto-task.
- **Tabelle**: confronto di opzioni o configurazioni.

## Errori comuni

- Scrivere README troppo lunghi senza struttura.
- Non specificare il linguaggio nei blocchi codice.
- Usare titoli incoerenti.
- Inserire checklist senza aggiornarle.
- Linkare risorse esterne senza contesto.
- Dimenticare che Markdown GitHub non e identico a Obsidian.

## Checklist

- Il documento ha titoli chiari?
- I blocchi codice indicano il linguaggio?
- Le checklist sono aggiornabili?
- I link hanno testo descrittivo?
- Tabelle e liste sono leggibili anche su mobile?
- Il Markdown resta comprensibile anche in plain text?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[README LICENSE e gitignore]]
- [[Repository GitHub]]
- [[Pull request]]
- [[Issues GitHub]]
