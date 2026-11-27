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
  - ricerca
  - code-search
  - repository
aliases:
  - Cercare codice su GitHub
  - GitHub code search
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub Web UI]]"
related:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
title: Cercare codice su GitHub
---

# Cercare codice su GitHub

## Sintesi

Prima di cercare, distingui **nome del file**, **testo nel file** e **definizione di un simbolo**. Nel repository il tasto `t` trova rapidamente un percorso conosciuto. Per cercare nel contenuto usa il motore **Code** della Web UI: un termine libero può corrispondere anche al percorso, mentre `content:` limita la ricerca al testo.

## Esempio: trovare il workflow del vault

Queste sono **query per GitHub.com**, non comandi della shell. Un termine fra virgolette indica una stringa esatta; più condizioni separate da spazi devono essere soddisfatte nello stesso file.

Trova i workflow YAML alla radice di `.github/workflows/` con estensione `.yml` che dichiarano l’avvio manuale:

```text
repo:perni24/appunti path:/.github/workflows/*.yml content:"workflow_dispatch"
```

Se cerchi la cache di npm, restringi per percorso e contenuto:

```text
repo:perni24/appunti path:.github/workflows content:"actions/setup-node" content:"cache: npm"
```

Apri il risultato e verifica lo **step**: trovare entrambe le stringhe nello stesso file non prova che appartengano alla stessa action. La prima query non include i file `.yaml`; cambia il glob o usa `OR` se vuoi entrambe le estensioni.

## Cambiare il tipo di ricerca

| Obiettivo | Filtro nella ricerca web Code |
| --- | --- |
| Limitare il perimetro | `repo:OWNER/REPO` oppure `org:ORGANIZZAZIONE`, eventualmente con `language:TypeScript` |
| Cercare una definizione | `symbol:parseNote` nei linguaggi supportati; non elenca tutti i punti in cui il simbolo viene chiamato |
| Cercare un uso testuale | `content:"parseNote("`: può trovare chiamate, dichiarazioni o esempi, non solo riferimenti semantici |

Per individuare i manifesti chiamati esattamente `package.json` anche in sottocartelle, usa una regex sul percorso:

```text
repo:perni24/appunti path:/(^|\/)package\.json$/
```

Non confondere la sintassi della ricerca web con quella del motore legacy usato da `gh search code`: i risultati e il supporto alle espressioni regolari possono differire. Nella Web UI usa `path:`, non fare affidamento su `filename:` o `extension:` degli esempi legacy.

## Nessun risultato: che cosa hai escluso?

La ricerca web indicizza il **branch predefinito** e ha limiti di indicizzazione; non vede i file modificati solo sul tuo computer. Non dedurre che il codice non esista. Nel clone, per cercare una stringa letterale nello snapshot dell’attuale `HEAD`:

```bash
git grep -n -F workflow_dispatch HEAD -- .github/workflows
```

Per cercare invece nei file tracciati come si trovano sul disco, ometti `HEAD`:

```bash
git grep -n -F workflow_dispatch -- .github/workflows
```

Verifica revisione e permessi. Prima di riutilizzare codice trovato in altri progetti, controlla contesto, manutenzione e licenza; la ricerca testuale non sostituisce una scansione di sicurezza.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Web UI|GitHub Web UI]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub|GitHub]]

## Fonti

- [GitHub Docs: sintassi di Code Search](https://docs.github.com/en/search-github/github-code-search/understanding-github-code-search-syntax)
- [GitHub Docs: copertura e limiti della ricerca codice](https://docs.github.com/en/search-github/github-code-search/about-github-code-search)
- [GitHub CLI: differenze del motore di ricerca](https://cli.github.com/manual/gh_search_code)
