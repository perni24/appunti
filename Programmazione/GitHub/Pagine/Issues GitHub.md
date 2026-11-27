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
  - issues
  - project-management
  - collaborazione
aliases:
  - Issues GitHub
  - GitHub Issues
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Repository GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Labels milestones e assignees]]"
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
title: Issues GitHub
---

# Issues GitHub

## Sintesi

Un’**issue** descrive un problema, un obiettivo o una decisione da seguire. Una **pull request** propone invece una modifica concreta. L’issue può esistere prima del codice e restare aperta anche dopo più PR, se nessuna completa il lavoro.

## Esempio: una segnalazione verificabile

Scrivi una segnalazione con dati di prova riproducibili, non solo «l’export non funziona»:

```md
Titolo: Il CSV perde l'intestazione quando il report è vuoto

Passi: aprire un report di prova con zero righe ed esportarlo in CSV.
Atteso: il file contiene l'intestazione, senza righe di dati.
Osservato: il file è vuoto.
Criterio di accettazione: il caso vuoto conserva l'intestazione;
un report con una riga continua a esportare anche quella riga.
```

Aggiungi versione e ambiente se aiutano a riprodurre il problema. Non allegare token o dati reali dei clienti. Per una feature descrivi il bisogno e il risultato verificabile; per un lavoro ampio suddividi i sotto-obiettivi, invece di mescolare bug indipendenti. Se si tratta solo di un confronto aperto, valuta Discussions.

## Collegare il lavoro senza chiuderlo troppo presto

- `#12` in una PR richiama l’issue di quel repository; **menzionare** non significa **chiudere**.
- Se la PR risolve l’intera issue, inserisci **nella descrizione della PR** una parola chiave. `Fixes` e `Resolves` sono alternative a `Closes`:

```text
Closes #12
```

- Le parole chiave nella descrizione si applicano quando la PR ha come destinazione il **branch predefinito**. L’issue aperta viene chiusa al merge, non alla creazione della PR, al push o quando i test diventano verdi. Per un altro repository usa, per esempio, `Closes OWNER/REPO#12`.
- Se la PR aggiunge solo il test e la correzione arriverà dopo, usa un semplice riferimento. Prima di chiudere manualmente, verifica i criteri di accettazione e lascia traccia dell’esito.

## Operazioni essenziali

Con `gh` autenticato, nel clone giusto e con Issues abilitato, crea una segnalazione interattiva:

```bash
gh issue create
```

`gh issue list` elenca normalmente le issue aperte. Per rileggere anche i commenti della segnalazione di esempio:

```bash
gh issue view 12 --comments
```

La chiusura manuale è un’azione distinta: `gh issue close 12 --reason completed` registra che il lavoro è concluso; non integra codice né pubblica una release. Label, milestone e assegnatario aiutano a trovare la segnalazione in seguito.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Repository GitHub|Repository GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Labels milestones e assignees|Labels milestones e assignees]]

## Fonti

- [GitHub Docs - About issues](https://docs.github.com/en/issues/tracking-your-work-with-issues/learning-about-issues/about-issues)
- [GitHub Docs: collegare issue e pull request](https://docs.github.com/en/issues/tracking-your-work-with-issues/using-issues/linking-a-pull-request-to-an-issue)
