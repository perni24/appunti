---
date: 2026-07-14
area: Programmi open source
topic: Client API Git-friendly
type: technical-note
status: non revisionato
difficulty: base
tags:
  - open-source
  - api
  - http-client
  - testing
aliases:
  - Bruno
prerequisites: []
related: []
title: Bruno
publish: true
---

# Bruno

## Sintesi

Bruno è un client open source per provare API REST e GraphQL. Salva le richieste in una **collection**, una cartella di file locali: puoi tenere gli esempi vicino al codice, rivedere le modifiche in una pull request e condividerli con Git senza un workspace cloud obbligatorio.

## Esempio pratico

Supponi che il tuo servizio di sviluppo esponga `GET /health` e risponda con HTTP 200 quando è pronto.

1. Crea una collection e un ambiente chiamato `Local`. Imposta la variabile `baseUrl` all’indirizzo effettivo del servizio, senza slash finale.
2. Crea la richiesta `GET {{baseUrl}}/health` e seleziona l’ambiente `Local`. Per altre richieste puoi salvare anche header e body.
3. Nella scheda delle asserzioni imposta **espressione** `res.status`, **operatore** `equals`, **valore** `200`. Invia la richiesta: ricevere una risposta non basta, l’asserzione deve risultare superata.
4. Salva la richiesta e verifica il diff della collection prima del commit.

Per ripetere gli stessi controlli in terminale o in CI, con Bruno CLI installata e il servizio avviato, esegui dalla cartella della collection:

```bash
bru run --env Local
```

## Limiti e precauzioni

- Le asserzioni verificano ciò che osservi via HTTP. Un `200` da solo non garantisce un body valido: controlla anche i campi da cui dipende il client. Queste prove affiancano i test interni dell’applicazione.
- La CLI esegue le richieste della collection, incluse eventuali scritture. Tieni separate le collection o gli ambienti di test e produzione; controlla il valore di `baseUrl` prima di avviare un’intera raccolta.
- Per i token usa variabili contrassegnate come **segrete**: l’app non salva il valore nel file ambiente versionato. In CI fornisci il valore tramite il meccanismo dei segreti del runner; non copiarlo negli header salvati o nel repository.

## Collegamenti

- [[Programmi open source/Indice Programmi Open Source|Catalogo open source]]

## Fonti

- [Bruno: asserzioni su stato, header e body](https://docs.usebruno.com/testing/tests/assertions)
- [Bruno CLI: eseguire una collection con un ambiente](https://docs.usebruno.com/bru-cli/run/overview)
- [Bruno: dove vengono conservate le variabili segrete](https://docs.usebruno.com/secrets-management/secret-variables)
