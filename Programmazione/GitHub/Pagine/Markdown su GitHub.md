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
  - markdown
  - documentazione
  - readme
aliases:
  - Markdown su GitHub
  - GitHub Flavored Markdown
  - GFM
prerequisites:
  - "[[Programmazione/GitHub/Pagine/README LICENSE e gitignore]]"
related:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
title: Markdown su GitHub
---

# Markdown su GitHub

## Sintesi

GitHub rende i file Markdown, i corpi di issue e pull request e i commenti usando una sintassi basata su **GitHub Flavored Markdown** (GFM). Tabelle e liste di attività fanno parte di GFM; riconoscere una menzione, notificare un utente o collegare una PR a un’issue sono **comportamenti di GitHub**, non effetti garantiti da qualunque renderer Markdown.

## Esempio: una guida leggibile anche come file

Supponi che `README.md` sia nella radice e che `docs/avvio.md` esista nello stesso repository. Il link relativo resta utile nel clone, nel browser e sui branch che contengono entrambi i file. Per le immagini vale lo stesso principio: usa un percorso relativo reale, non il percorso assoluto del tuo computer.

````md
# Esportatore CSV

## Primo avvio

Leggi la [guida di avvio](docs/avvio.md).

| Caso | Risultato atteso |
| --- | --- |
| Zero righe | Solo intestazione |
| Una riga | Intestazione e un record |

```bash
npm test
```
````

Il comando è un esempio per un progetto che **definisce** lo script `test`. La lingua del blocco dà l’evidenziazione, non esegue il comando. Per mostrare letteralmente le tre backtick dell’esempio dentro un altro blocco Markdown, usa quattro backtick per il recinto esterno.

## Esempio: descrizione di una pull request

```md
## Cosa cambia

L'esportatore mantiene l'intestazione quando il report non contiene righe.

## Verifica

- [x] Test eseguito sul report vuoto
- [ ] Verificare il caso con una riga

Riferimento: #12
```

- Spunta solo le attività realmente verificate. Una casella selezionata nel testo **non** è uno status check e non sostituisce un test CI.
- Nella descrizione di una PR, `#12` richiama l’issue o la PR numerata nello stesso repository; non la chiude. Per chiudere un’issue tramite merge vedi [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]. Se il link deve funzionare anche nel README o fuori dal sito, usa un normale link Markdown con testo descrittivo e destinazione esplicita.
- Per citare testo usa `>`; per mostrare codice o una menzione **come testo** usa backtick. Prima di inviare un vero `@username` ricorda che può notificare una persona.
- In un repository GitHub usa collegamenti Markdown standard. I wikilink delle note di questo vault sono una convenzione Obsidian che Quartz trasforma per il sito, non una sintassi portabile nei README.

## Controllo prima di pubblicare

Apri **Preview** nel contesto in cui il testo sarà letto. Verifica titoli, link relativi, tabelle strette e chiusura dei blocchi. Un README deve restare consultabile nel tempo; la descrizione di una PR deve spiegare invece cosa è cambiato e come è stato verificato.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/README LICENSE e gitignore|README LICENSE e gitignore]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]

## Fonti

- [GitHub Docs - Basic writing and formatting syntax](https://docs.github.com/en/get-started/writing-on-github/getting-started-with-writing-and-formatting-on-github/basic-writing-and-formatting-syntax)
- [GitHub Docs - GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [GitHub Docs: riferimenti automatici nei contesti di collaborazione](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/autolinked-references-and-urls)
