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
  - pull-request
  - review
  - collaborazione
aliases:
  - Pull request
  - PR
  - Merge request
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Branch su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Review code su GitHub]]"
  - "[[Programmazione/GitHub/Pagine/Issues GitHub]]"
title: Pull request
---

# Pull request

## Sintesi

Una pull request (PR) propone di integrare il branch **head** (sorgente) nel branch **base** (destinazione). Raccoglie il motivo della modifica, i commit, il diff, le discussioni e gli eventuali check. Non è né un `git pull` né un merge già eseguito.

## Esempio: dal branch alla PR

L’issue `#12` segnala che manca l’intestazione nei report CSV vuoti. Hai già pubblicato `fix/export-vuoto`. Prima di aprire la PR, nel clone con `origin/main` aggiornato e sul branch della correzione, controlla quali file stai proponendo di cambiare:

```bash
git diff origin/main...HEAD
```

I **tre punti** confrontano la base comune con `HEAD`, come il diff normalmente presentato nella PR. Non è un confronto diretto tra le due punte: un file cambiato solo su `main` dopo la biforcazione non entra per questo nel diff della proposta.

Dal repository corretto, con `gh` autenticato, puoi aprire una bozza. Qui i branch sono nello stesso repository; per una PR da fork verifica anche i rispettivi proprietari:

```bash
gh pr create --base main --head fix/export-vuoto --draft
```

Esempio di descrizione, **da adattare ai test davvero eseguiti**:

```md
## Problema
Un report senza righe produce un CSV senza intestazione.

## Modifica
L'esportatore scrive l'intestazione anche con zero righe.

## Verifica
Con zero righe resta la sola intestazione; con una riga i dati restano invariati.

Closes #12
```

La bozza consente di discutere il lavoro ma non può essere unita finché non è pronta per la review. Un altro push sullo **stesso head** aggiorna la PR: non aprirne una nuova per rispondere a un commento.

## Cosa controllare prima del merge

- **Files changed:** il diff è limitato al problema? In una serie di PR dipendenti (stacked), verifica la base di ciascuna: scegliere sempre `main` può mostrare anche il lavoro precedente.
- **Review:** il revisore richiesto ha risposto? Una conversazione risolta non è un’approvazione.
- **Checks:** partono solo i controlli configurati. Verdi non significa che tutti gli scenari siano stati provati. Se la PR di esempio è la `34`, consulta i suoi check con:

```bash
gh pr checks 34
```

`gh pr status` mostra invece una panoramica delle PR rilevanti per te. Nell’esempio `main` è il branch predefinito: `Closes #12` può chiudere l’issue quando la PR viene integrata, non quando il testo viene scritto.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Branch su GitHub|Branch su GitHub]]
- [[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub|Commit e cronologia su GitHub]]
- [[Programmazione/GitHub/Pagine/Review code su GitHub|Review code su GitHub]]
- [[Programmazione/GitHub/Pagine/Issues GitHub|Issues GitHub]]

## Fonti

- [GitHub Docs - About pull requests](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests)
- [GitHub Docs: scrivere codice e confrontare i branch](https://docs.github.com/en/pull-requests/concepts/writing-code-for-a-project)
- [GitHub CLI: creare una pull request](https://cli.github.com/manual/gh_pr_create)
