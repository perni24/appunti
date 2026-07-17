---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: base
tags: [github, ricerca, code-search, repository]
aliases: [Cercare codice su GitHub, GitHub code search]
prerequisites: [GitHub Web UI]
related: [Repository GitHub]
---

# Cercare codice su GitHub

## Sintesi

La ricerca codice su GitHub permette di trovare file, simboli, stringhe, configurazioni, esempi d'uso e pattern dentro repository pubblici o privati a cui hai accesso.

E uno strumento importante per studiare codebase grandi, trovare implementazioni reali e capire come una libreria viene usata in progetti esistenti.

## Quando usarlo

Usala quando:

- cerchi una funzione o una classe in un repository;
- vuoi trovare dove viene usata una API;
- devi capire configurazioni simili in altri progetti;
- cerchi esempi reali di GitHub Actions, Dockerfile o librerie;
- vuoi analizzare una codebase senza clonarla;
- devi individuare file per estensione o path.

## Come funziona

GitHub indicizza repository e permette ricerche con filtri. Puoi cercare:

- in un repository specifico;
- in una organizzazione;
- per linguaggio;
- per path;
- per nome file;
- per stringa esatta;
- per simboli quando supportato.

La ricerca e piu utile quando combini query e filtri invece di scrivere una parola generica.

## API / Sintassi

Esempi di query:

```text
repo:owner/repository useEffect
org:openai extension:yml workflow_dispatch
language:TypeScript "createContext("
path:.github/workflows "actions/checkout"
filename:package.json "eslint"
```

Ricerca dentro repository dalla Web UI:

```text
t
```

Il tasto `t` apre la ricerca file rapida nel repository.

## Esempio pratico

Trovare workflow GitHub Actions che usano cache Node.js:

```text
path:.github/workflows "actions/setup-node" "cache:"
```

Trovare esempi di una API in TypeScript:

```text
language:TypeScript "satisfies"
```

Per risultati migliori, limita per repository, organizzazione o path.

## Varianti

- **Ricerca file rapida**: utile dentro un repository.
- **Ricerca globale**: utile per esempi pubblici.
- **Ricerca per path**: utile per config e workflow.
- **Ricerca per linguaggio**: utile per esempi di codice.
- **Ricerca per stringa esatta**: utile con virgolette.
- **Ricerca simboli**: utile per funzioni, classi e tipi.

## Errori comuni

- Usare query troppo generiche.
- Copiare codice trovato senza controllare contesto e licenza.
- Fidarsi di esempi vecchi o non mantenuti.
- Cercare segreti o token invece di usare strumenti di security scanning.
- Non filtrare per linguaggio, path o repository.

## Checklist

- Hai limitato la ricerca al contesto corretto?
- Hai controllato data e manutenzione del repository?
- Il codice trovato e compatibile con il tuo stack?
- Hai verificato licenza e contesto?
- Hai cercato anche esempi ufficiali o documentazione?
- La query e abbastanza specifica?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub Web UI]]
- [[Repository GitHub]]
- [[GitHub]]

## Fonti

- [GitHub Docs - Searching code](https://docs.github.com/en/search-github/searching-on-github/searching-code)
