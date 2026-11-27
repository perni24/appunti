---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - github
  - token
  - fine-grained-token
  - autenticazione
aliases:
  - Fine-grained token GitHub
  - Fine-grained personal access token
prerequisites:
  - "[[Programmazione/GitHub/Pagine/Personal access token GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Personal access token GitHub]]"
  - "[[Programmazione/GitHub/Pagine/GitHub REST API]]"
  - "[[Programmazione/GitHub/Pagine/GitHub Apps]]"
  - "[[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub]]"
title: Fine-grained token GitHub
---

# Fine-grained token GitHub

## Sintesi

Un **fine-grained personal access token** limita un’attività personale a un *resource owner*, ai repository selezionati e ai permessi necessari per l’endpoint. Non assegna all’utente un nuovo ruolo. Per progettare il token parti da un verbo concreto, per esempio «leggere le issue» oppure «aprire una segnalazione»: richiedono permessi diversi.

## Dal compito al permesso

Caso: script personale per **un solo repository privato**, con Issues abilitate, su cui la persona possiede già l’accesso necessario.

| Operazione | Endpoint | Permessi repository nel caso descritto |
| --- | --- | --- |
| Report delle issue | `GET /repos/OWNER/REPO/issues` | `Issues: read`. Non occorre scrivere file né PR. |
| Aprire una segnalazione | `POST /repos/OWNER/REPO/issues` | `Issues: write`. Non occorre `Contents: write`. |

Scegli il proprietario corretto, *Only select repositories* e quel repository. Il permesso di lettura dei metadati di base è previsto per i token fine-grained con accesso al repository: non equivale a leggere il contenuto dei file. Aggiungere altri owner, invitare membri o amministrare un’organizzazione sono esigenze differenti; non tradurle automaticamente in permessi repository più ampi.

## Esempio pratico: aprire una issue di prova

Solo in un **repository di prova** e con `gh` configurata per usare il PAT da verificare. Sostituisci `OWNER/REPO`. Questo comando esegue una scrittura reale e ne mostra l’URL, non è un test innocuo dei permessi:

```bash
gh api --method POST repos/OWNER/REPO/issues -f title='Verifica triage' -f body='Segnalazione di prova' --jq '.html_url'
```

Per un report fermati al `GET`: non fare upgrade a `write` per eseguire l’esempio. Un token sufficiente per creare la issue non garantisce che l’utente possa amministrare il repository.

## Diagnosi di un rifiuto

1. Verifica che l’endpoint supporti i PAT fine-grained e leggi la sua sezione sui permessi: non tutti i tipi di token sono supportati ovunque.
2. Controlla proprietario, repository selezionato e accesso attuale dell’utente. Un `404` su un privato non dimostra da solo che il nome sia sbagliato.
3. Controlla scadenza e policy organizzative. Se serve approvazione e il token è `pending`, prima dell’approvazione può leggere soltanto risorse pubbliche; non allargare i permessi per aggirare l’attesa.
4. Se l’integrazione deve operare stabilmente su più proprietari o per un team, rivaluta una GitHub App anziché accumulare PAT personali.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/Personal access token GitHub|Personal access token GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub REST API|GitHub REST API]]
- [[Programmazione/GitHub/Pagine/GitHub GraphQL API|GitHub GraphQL API]]
- [[Programmazione/GitHub/Pagine/GitHub Apps|GitHub Apps]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Resource owner, repository e approvazione](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub REST - Permessi dei PAT fine-grained](https://docs.github.com/en/rest/authentication/permissions-required-for-fine-grained-personal-access-tokens)
- [GitHub REST - Lettura e creazione delle issue](https://docs.github.com/en/rest/issues/issues)
