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
  - pat
  - autenticazione
aliases:
  - Personal access token GitHub
  - PAT GitHub
prerequisites:
  - "[[Programmazione/GitHub/Pagine/GitHub]]"
related:
  - "[[Programmazione/GitHub/Pagine/Fine-grained token GitHub]]"
  - "[[Programmazione/GitHub/Pagine/GitHub REST API]]"
  - "[[Programmazione/GitHub/Pagine/GitHub Apps]]"
  - "[[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub]]"
title: Personal access token GitHub
---

# Personal access token GitHub

## Sintesi

Un **personal access token** (PAT) rappresenta la **persona** che lo ha creato. `Fine-grained` e `classic` sono due tipi di PAT, non due alternative al concetto di token personale. L’accesso non può superare quello della persona, anche se il token richiede permessi più ampi.

## Scegliere la credenziale per il compito

| Situazione | Prima scelta | Perché |
| --- | --- | --- |
| Consultazione interattiva dalla propria macchina | Login di GitHub CLI o Git Credential Manager per Git via HTTPS. | Normalmente non occorre creare o trascrivere manualmente un PAT. |
| Script personale che legge issue private | PAT fine-grained, se supportato, limitato al proprietario, ai repository e all’operazione. | Il caso d’uso è personale e il perimetro è noto. |
| Job Actions nello stesso repository | `GITHUB_TOKEN` con i permessi del job. | La credenziale è temporanea e non dipende dal PAT di un collaboratore. |
| Servizio condiviso che deve sopravvivere al cambio di personale | Installazione di una GitHub App. | Il servizio agisce come installazione, non come il manutentore che l’ha configurato. |

Un PAT classic usa *scope* spesso più ampi. Usalo solo dopo aver verificato che l’operazione non si possa coprire con una credenziale più limitata e che le policy dell’organizzazione lo consentano. Con SAML SSO può servire un’autorizzazione esplicita del classic per l’organizzazione; per i fine-grained l’autorizzazione SSO avviene durante la creazione.

## Esempio pratico: identità e accesso sono due verifiche

Con `gh` già autenticata su GitHub.com **come utente**, il primo comando mostra solo il login effettivo, non il valore della credenziale:

```bash
gh api user --jq '.login'
```

Per verificare la lettura di una issue nota, sostituisci `OWNER/REPO` e `12` con i valori del tuo caso. Per provare proprio il PAT dello script, assicurati che `gh` stia usando quella credenziale, non un’altra sessione salvata.

```bash
gh api repos/OWNER/REPO/issues/12 --jq '{number, state, title}'
```

Il primo comando riuscito non garantisce il secondo. E una lettura riuscita su un **repository pubblico** non prova che il token abbia accesso a risorse private. Con Git via HTTPS, quando viene richiesta una password puoi usare un PAT al suo posto; non inserirlo nell’URL del remote.

## Custodia e revoca

Conserva la credenziale in un gestore di credenziali o di secret, iniettala solo dove serve e scegli una scadenza adeguata. Non inserirla negli esempi, nell’output di debug o nella cronologia della shell. Per la rotazione programmata verifica il sostituto e revoca il precedente; se un PAT è stato esposto, **revocalo subito** e aggiorna i componenti che lo utilizzavano. Cancellare il file o la riga di log non lo invalida.

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub|Indice GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub REST API|GitHub REST API]]
- [[Programmazione/GitHub/Pagine/GitHub GraphQL API|GitHub GraphQL API]]
- [[Programmazione/GitHub/Pagine/Fine-grained token GitHub|Fine-grained token GitHub]]
- [[Programmazione/GitHub/Pagine/GitHub Apps|GitHub Apps]]
- [[Programmazione/GitHub/Pagine/GitHub CLI|GitHub CLI]]
- [[Programmazione/GitHub/Pagine/Sicurezza dei token GitHub|Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Tipi di PAT, limiti e scadenza](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens)
- [GitHub Docs - PAT e SAML SSO](https://docs.github.com/en/authentication/authenticating-with-single-sign-on/authorizing-a-personal-access-token-for-use-with-single-sign-on)
- [GitHub Docs - GITHUB_TOKEN del workflow](https://docs.github.com/en/actions/concepts/security/github_token)
- [GitHub CLI - gh api](https://cli.github.com/manual/gh_api)
