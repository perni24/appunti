---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - clean-code
  - documentazione
  - readme
aliases:
  - README e documentazione tecnica
  - Documentazione tecnica
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Organizzazione dei file]]"
  - "[[Programmazione/Clean Code/Pagine/Convenzioni di progetto]]"
  - "[[Programmazione/Clean Code/Pagine/Commenti temporanei e TODO]]"
title: README e documentazione tecnica
---

# README e documentazione tecnica

## Sintesi

Un README deve permettere a chi arriva nel repository di compiere una **prima operazione verificabile**: sapere da dove partire, quale comando eseguire e come riconoscere il successo. Un elenco di comandi senza directory, prerequisiti o risultato atteso non è ancora una guida.

## Esempio: verificare questo vault in locale

Questo è un esempio di sezione operativa del README, con comandi reali. **Punto di partenza:** la radice del repository, quella che contiene `Home.md` e `site/`. **Prerequisiti:** Node.js 24, npm, dipendenze del progetto e plugin Quartz già installati come descritto nella sezione *Verifica Locale* del README di radice. Non occorrono credenziali di deploy.

**1. Controlla le note.** Il rapporto distingue errori strutturali e avvisi editoriali. L'opzione `--report` aggiorna il rapporto Markdown locale; non riscrive gli appunti.

```powershell
npm --prefix site run content:check -- --report
```

**2. Verifica la trasformazione.** Questo comando esegue i test del passaggio dal vault al sito. L'esito atteso è zero test falliti; non vengono eseguiti tutti gli esempi presenti nelle note.

```powershell
npm --prefix site run content:test
```

**3. Genera il sito.** La build rigenera `site/public/` e verifica i riferimenti nell'HTML. L'esito atteso è un riepilogo senza errori. Non modificare quella cartella a mano: è output generato. Questa operazione non pubblica nulla su GitHub Pages.

```powershell
npm --prefix site run site:build
```

## Cosa tenere nel README

| Domanda del lettore | Dove rispondere |
| --- | --- |
| Cosa fa il progetto e qual è il percorso minimo per provarlo? | Nel README, con prerequisiti, configurazione minima, comandi ed esito atteso. |
| Quali sono tutte le opzioni di configurazione? | In un riferimento collegato; nel README basta l'esempio necessario per partire, senza segreti reali. |
| Perché è stata scelta questa architettura? | In una nota di decisione (*ADR*) che conservi contesto, alternative e conseguenze. |
| Come pubblico o recupero una release fallita? | In una procedura operativa distinta dalla prova locale: specifica permessi, destinazione e impatto. |

## Come accorgersi che è invecchiato

Ripeti il percorso da una copia pulita o in CI. Verifica directory iniziale, script dichiarati, artefatto prodotto e risultato osservabile. Un README che promette `npm run lint` quando lo script non esiste inganna anche se il paragrafo sul lint è tecnicamente corretto. La documentazione indica dove guardare; non sostituisce né un test né una procedura di rilascio.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Organizzazione dei file|Organizzazione dei file]]
- [[Programmazione/Clean Code/Pagine/Convenzioni di progetto|Convenzioni di progetto]]
- [[Programmazione/Clean Code/Pagine/Commenti temporanei e TODO|Commenti temporanei e TODO]]
- [[Programmazione/Clean Code/Pagine/Leggibilita del codice|Leggibilita del codice]]
- [[Programmazione/GitHub/Pagine/README LICENSE e gitignore|README, licenza e gitignore in un repository]]

## Fonti

- GitHub Docs, [About the repository README file](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-readmes)
- [Diátaxis: forme della documentazione tecnica](https://diataxis.fr/)
