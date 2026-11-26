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
  - convenzioni
  - team
aliases:
  - Convenzioni di progetto
  - Project conventions
prerequisites:
  - "[[Programmazione/Clean Code/Pagine/Clean Code]]"
related:
  - "[[Programmazione/Clean Code/Pagine/Organizzazione dei file]]"
  - "[[Programmazione/Clean Code/Pagine/README e documentazione tecnica]]"
  - "[[Programmazione/Clean Code/Pagine/Struttura delle cartelle]]"
title: Convenzioni di progetto
---

# Convenzioni di progetto

## Sintesi

Una convenzione evita di ridiscutere una scelta a ogni modifica. Perché sia utile, specifica **dove si applica, chi la verifica e che cosa fare se non è adatta**. «Usiamo uno stile coerente» non basta per decidere se accettare una modifica.

## Esempio: rendere ripetibile il controllo dello stile

In un piccolo pacchetto Node si è scelto Prettier per un file `rates.mjs`. Il team registra Prettier tra le dipendenze di sviluppo e versiona il lockfile. Esempio di `.prettierrc.json`:

```json
{
  "singleQuote": true,
  "semi": true
}
```

Nel `package.json` del pacchetto, integra questi script con quelli esistenti; non sostituire l'intero manifest:

```json
{
  "scripts": {
    "format:check": "prettier --check rates.mjs",
    "format:write": "prettier --write rates.mjs"
  }
}
```

Dalla radice del pacchetto, con le dipendenze installate, il comando per la CI è di sola lettura: codice di uscita 0 se il file è conforme, 1 se differisce. Un errore dello strumento non va interpretato come semplice differenza di stile.

```sh
npm run format:check
```

Per applicare la convenzione **in locale**, il comando seguente riscrive il file: controlla il diff prima del commit. I due script coprono soltanto `rates.mjs`, non tutto il repository.

```sh
npm run format:write
```

## Quale controllo scegliere?

| Convenzione | Controllo adeguato |
| --- | --- |
| Spaziatura e virgolette coerenti | Formatter con la stessa configurazione in locale e in CI; un hook locale è un aiuto, non l'unico controllo. |
| Vietare dipendenze da percorsi interni di altre feature | Regola sugli import o test di architettura; il formatter non controlla il grafo. |
| Nomi booleani positivi, errori di dominio comprensibili | Esempi nel documento per i contributori e review sul significato nel contesto. |
| Non riformattare codice generato o di terzi | Definire i percorsi esclusi e motivarli; non disabilitare la regola per tutto il progetto. |

## Limiti ed errori comuni

Su codice esistente separa una riformattazione meccanica da un cambiamento di comportamento. Documenta le eccezioni vicino alla regola e indica quando rivalutarle. Un controllo verde dimostra soltanto la proprietà verificata: un prezzo sbagliato può essere formattato perfettamente.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code|Indice Clean Code]]
- [[Programmazione/Clean Code/Pagine/Organizzazione dei file|Organizzazione dei file]]
- [[Programmazione/Clean Code/Pagine/README e documentazione tecnica|README e documentazione tecnica]]
- [[Programmazione/Clean Code/Pagine/Struttura delle cartelle|Struttura delle cartelle]]
- [[Programmazione/Clean Code/Pagine/Naming di variabili e funzioni|Naming di variabili e funzioni]]
- [[Programmazione/Clean Code/Pagine/Pre-commit hooks|Pre-commit hooks]]

## Fonti

- Prettier, [CLI: controllo e scrittura](https://prettier.io/docs/cli)
- Steve McConnell, *Code Complete*; Google Engineering Practices, *Code Review Developer Guide*
