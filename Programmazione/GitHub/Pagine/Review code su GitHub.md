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
  - code-review
  - pull-request
  - collaborazione
aliases:
  - Code review GitHub
  - Review su GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
related:
  - "[[Programmazione/GitHub/Pagine/Pull request]]"
  - "[[Programmazione/GitHub/Pagine/CODEOWNERS]]"
title: Review code su GitHub
---

# Review code su GitHub

## Sintesi

La review verifica se una PR risolve il problema senza introdurre regressioni. Non equivale al lint: un codice ben formattato può generare un CSV sbagliato. Controlla comportamento, test, compatibilità, manutenzione e, quando rilevanti, permessi, migrazioni e documentazione.

## Esempio: rivedere la PR 34

Sostituisci `34` con il numero reale. Leggi prima descrizione e issue collegata, poi il diff:

```bash
gh pr view 34
```

```bash
gh pr diff 34
```

Nel caso dell’export, controlla **sia zero righe sia un report non vuoto**. Un commento utile collega osservazione, impatto e verifica: «Il ritorno anticipato salta anche l’intestazione. Possiamo aggiungere un test con zero righe che si aspetti la sola intestazione?». Per un dettaglio stilistico non richiesto dal progetto, segnala invece che il suggerimento è facoltativo.

Se serve una prova locale, `gh pr checkout 34` cambia il branch nel clone. Salva il lavoro in corso; prima di installare dipendenze o eseguire script di una PR esterna, ispezionali e usa un ambiente isolato senza credenziali. Scegli test e lint previsti dal progetto.

## Commento, approvazione o richiesta di modifiche?

| Esito | Quando sceglierlo | Cosa succede |
| --- | --- | --- |
| Comment | Domanda o miglioramento facoltativo | Registra il feedback, senza esprimere approvazione. |
| Request changes | C’è un difetto concreto da correggere | Registra la richiesta; l’effettivo blocco del merge dipende dalle regole della base e dai permessi del revisore. |
| Approve | La revisione del diff corrente è favorevole | Non esegue il merge e non sostituisce i check obbligatori. |

Per inviare una richiesta motivata, da un account revisore e sul repository corretto:

```bash
gh pr review 34 --request-changes --body "Aggiungere un test per il CSV senza righe: manca l'intestazione."
```

Dopo la correzione leggi il nuovo diff e verifica il test prima di approvare. Chiudere un thread non ritira da solo una review negativa. Se la base invalida le approvazioni obsolete, nuovi commit possono rendere necessaria un’altra approvazione. L’autore non può approvare la propria PR.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Pull request|Pull request]]
- [[Programmazione/GitHub/Pagine/Commit e cronologia su GitHub|Commit e cronologia su GitHub]]
- [[Programmazione/GitHub/Pagine/Merge squash e rebase su GitHub|Merge squash e rebase su GitHub]]

## Fonti

- [GitHub Docs - About pull request reviews](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews)
- [GitHub Docs: inviare una review e condizioni di blocco](https://docs.github.com/en/pull-requests/how-tos/review-pull-requests/reviewing-proposed-changes-in-a-pull-request)
- [GitHub CLI: inviare una review](https://cli.github.com/manual/gh_pr_review)
