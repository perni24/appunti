---
date: 2026-07-06
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
difficulty: base
tags: [github, code-review, pull-request, collaborazione]
aliases: [Code review GitHub, Review su GitHub]
prerequisites: [Pull request]
related: [Pull request, CODEOWNERS]
---

# Review code su GitHub

## Sintesi

La **code review su GitHub** e il processo con cui una o piu persone controllano una pull request prima del merge. Serve a intercettare bug, regressioni, rischi di sicurezza, problemi di manutenzione e mancanza di test.

Una buona review non cerca solo stile: valuta comportamento, compatibilita, chiarezza e impatto operativo.

## Quando usarlo

Usa review quando:

- la modifica tocca codice condiviso;
- cambia comportamento utente o API;
- introduce automazioni, permessi o deploy;
- modifica database, sicurezza o configurazioni;
- un errore avrebbe impatto alto;
- vuoi mantenere standard di team.

## Come funziona

GitHub permette di:

- commentare righe specifiche;
- aprire conversazioni;
- richiedere modifiche;
- approvare;
- lasciare commenti generali;
- confrontare commit successivi;
- bloccare merge finche mancano review richieste.

Gli stati principali sono:

- **Comment**: osservazione senza bloccare.
- **Approve**: modifica accettata.
- **Request changes**: modifica da correggere prima del merge.

## API / Sintassi

Comandi utili con GitHub CLI:

```bash
gh pr view
gh pr diff
gh pr checkout 123
gh pr review --approve
gh pr review --request-changes
```

Controllare localmente una PR:

```bash
gh pr checkout 123
npm test
npm run lint
```

## Esempio pratico

Commento poco utile:

```text
Non mi piace.
```

Commento utile:

```text
Questa validazione accetta stringhe vuote. Possiamo aggiungere un test per il caso `""` e restituire errore esplicito?
```

Il secondo indica problema, impatto e azione verificabile.

## Varianti

- **Review funzionale**: verifica comportamento e casi limite.
- **Review architetturale**: valuta struttura, dipendenze e confini.
- **Review di sicurezza**: cerca input non validati, segreti, permessi e supply chain.
- **Review di test**: controlla copertura dei casi importanti.
- **Review documentale**: controlla README, changelog o docs.

## Errori comuni

- Limitarsi alla formattazione.
- Fare review senza leggere descrizione e issue collegata.
- Approvare PR con test falliti senza motivo.
- Chiedere cambiamenti soggettivi senza spiegare il tradeoff.
- Non distinguere blocchi reali da suggerimenti.
- Lasciare commenti non risolti e fare merge comunque.

## Checklist

- La modifica risolve il problema dichiarato?
- Ci sono test per i casi importanti?
- Ci sono regressioni possibili?
- La soluzione e coerente con il progetto?
- I controlli automatici passano?
- I commenti bloccanti sono stati risolti?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[Pull request]]
- [[Commit e cronologia su GitHub]]
- [[Merge squash e rebase su GitHub]]

## Fonti

- [GitHub Docs - About pull request reviews](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/reviewing-changes-in-pull-requests/about-pull-request-reviews)
