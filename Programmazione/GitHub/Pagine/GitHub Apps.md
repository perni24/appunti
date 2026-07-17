---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [github, github-apps, api, automazione]
aliases: [GitHub Apps, GitHub App]
prerequisites: [GitHub REST API, Webhooks GitHub]
related: [Webhooks GitHub, Fine-grained token GitHub, Personal access token GitHub, Automazioni issue e pull request]
---

# GitHub Apps

## Sintesi

Le **GitHub Apps** sono integrazioni registrate su GitHub che possono interagire con repository, organizzazioni e utenti tramite permessi specifici, token temporanei e webhooks.

Per automazioni serie o condivise sono spesso preferibili ai personal access token, perche non dipendono da un utente specifico e permettono permessi piu controllati.

## Quando usarlo

Usa una GitHub App quando:

- vuoi un'integrazione installabile su piu repository;
- vuoi permessi granulari e auditabili;
- vuoi token temporanei invece di token personali lunghi;
- vuoi reagire a eventi con webhooks;
- vuoi costruire bot, controlli o strumenti interni;
- vuoi evitare account di servizio fragili.

## Come funziona

Una GitHub App viene registrata con:

- nome e descrizione;
- permessi richiesti;
- eventi webhook;
- chiave privata;
- URL callback o setup se servono;
- visibilita privata o pubblica.

L'app puo autenticarsi:

- come app, usando un JWT;
- come installation, usando un installation access token;
- per conto di un utente, usando un user access token.

## API / Sintassi

Flusso server-to-server semplificato:

```text
crea JWT con private key
chiama API per ottenere installation access token
usa installation token per REST o GraphQL API
```

Uso logico:

```text
webhook pull_request -> app valida firma -> app ottiene token installazione -> app commenta la PR
```

## Esempio pratico

Un bot di review automatica puo:

1. ricevere evento `pull_request`;
2. controllare file modificati;
3. verificare convenzioni del repository;
4. pubblicare un commento;
5. aggiungere label;
6. aggiornare uno status o un check.

La GitHub App agisce con permessi dedicati, senza usare il token personale di uno sviluppatore.

## Varianti

- **App privata**: usata solo dal proprietario.
- **App pubblica**: installabile da altri account.
- **App server-to-server**: agisce come integrazione.
- **App user-to-server**: agisce per conto di un utente autorizzato.
- **App con webhooks**: reagisce a eventi GitHub.
- **OAuth App**: diversa da GitHub App, piu centrata sull'autorizzazione utente.

## Errori comuni

- Usare un PAT quando serve un'integrazione persistente.
- Richiedere permessi troppo ampi.
- Non ruotare o proteggere la private key.
- Non validare i webhook ricevuti.
- Non gestire installazioni sospese o rimosse.
- Confondere token dell'app, token dell'installazione e token utente.

## Checklist

- Serve davvero una GitHub App o basta `GITHUB_TOKEN`?
- I permessi sono minimi?
- Gli eventi webhook sono solo quelli necessari?
- La private key e conservata in modo sicuro?
- I token temporanei non vengono salvati in chiaro?
- L'app gestisce errori, retry e disinstallazione?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub REST API]]
- [[GitHub GraphQL API]]
- [[Webhooks GitHub]]
- [[Personal access token GitHub]]
- [[Fine-grained token GitHub]]
- [[Automazioni issue e pull request]]

## Fonti

- [GitHub Docs - GitHub Apps](https://docs.github.com/en/apps)
- [GitHub Docs - About creating GitHub Apps](https://docs.github.com/en/apps/creating-github-apps/about-creating-github-apps/about-creating-github-apps)
