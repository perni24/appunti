---
date: 2026-07-09
area: Programmazione
topic: Clean Code
type: theory-note
status: "non revisionato"
publish: true
difficulty: base
tags: [clean-code, convenzioni, team]
aliases: [Convenzioni di progetto, Project conventions]
prerequisites: [Clean Code]
related: [Organizzazione dei file, README e documentazione tecnica, Struttura delle cartelle]
---

# Convenzioni di progetto

## Sintesi

Le **convenzioni di progetto** sono regole condivise su naming, struttura, formattazione, test, commit, error handling e organizzazione del codice.

Servono a ridurre decisioni ripetitive e rendere il codice piu uniforme.

## Problema che risolve

Senza convenzioni, ogni file puo usare uno stile diverso. Il lettore deve adattarsi continuamente e il team discute su dettagli invece che su comportamento e design.

Le convenzioni spostano molte scelte da preferenze individuali a regole condivise.

## Concetto chiave

Una buona convenzione e:

- esplicita;
- semplice da applicare;
- automatizzabile quando possibile;
- motivata;
- coerente con linguaggio e framework;
- modificabile quando non serve piu.

Le convenzioni dovrebbero ridurre attrito, non diventare burocrazia.

## Dettagli importanti

- Formatter e linter automatizzano parte delle convenzioni.
- Le convenzioni non automatizzabili devono stare in documentazione.
- Le eccezioni devono essere rare e spiegate.
- Le convenzioni vanno introdotte gradualmente in codebase legacy.
- Una convenzione locale non deve contraddire idiomi forti del linguaggio.

## Esempio

Convenzioni utili:

```text
- nomi booleani con is/has/can/should
- test accanto al modulo testato
- errori di dominio in domain/errors
- nessun import da cartelle internal di altri moduli
- formatter obbligatorio via pre-commit
```

Queste regole aiutano il team a prendere decisioni coerenti.

## Limiti

- Troppe convenzioni possono rallentare.
- Convenzioni non spiegate sembrano arbitrarie.
- Alcune regole diventano obsolete con il progetto.
- Le convenzioni non sostituiscono il giudizio tecnico.

## Errori comuni

- Documentare convenzioni che nessuno applica.
- Non automatizzare cio che puo essere automatizzato.
- Cambiare stile a ogni PR.
- Importare convenzioni da altri progetti senza adattarle.
- Usare convenzioni per evitare discussioni architetturali reali.

## Collegamenti

- [[Programmazione/Clean Code/Indice Clean Code]]
- [[Organizzazione dei file]]
- [[README e documentazione tecnica]]
- [[Struttura delle cartelle]]
- [[Naming di variabili e funzioni]]

## Fonti

- Steve McConnell, *Code Complete*
- Google Engineering Practices, *Code Review Developer Guide*
