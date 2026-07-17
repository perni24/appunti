---
date: 2026-07-07
area: Programmazione
topic: GitHub
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [github, webhooks, automazione, integrazioni]
aliases: [Webhooks GitHub, GitHub webhooks]
prerequisites: [GitHub, GitHub REST API]
related: [GitHub Apps, Automazioni issue e pull request, GitHub REST API]
---

# Webhooks GitHub

## Sintesi

I **webhooks GitHub** permettono a un servizio esterno di ricevere notifiche quando accadono eventi su GitHub. Invece di interrogare continuamente l'API, il tuo server riceve una richiesta HTTP quando avviene qualcosa.

Sono il meccanismo corretto per automazioni reattive: una pull request viene aperta, una issue cambia label, una release viene pubblicata, un workflow termina.

## Quando usarlo

Usali quando:

- vuoi reagire a eventi GitHub in tempo quasi reale;
- vuoi integrare GitHub con servizi esterni;
- vuoi costruire bot o automazioni server-side;
- vuoi evitare polling continuo della REST API;
- vuoi ricevere eventi di repository, organizzazione o GitHub App;
- vuoi collegare GitHub a sistemi interni.

## Come funziona

Configuri un webhook indicando:

- URL di destinazione;
- eventi da ascoltare;
- formato payload;
- secret per firmare le consegne;
- stato attivo o disattivo.

Quando l'evento avviene, GitHub invia una richiesta HTTP al tuo endpoint. Il tuo server deve validare la firma, rispondere rapidamente e poi processare il lavoro.

## API / Sintassi

Endpoint tipico:

```text
POST https://example.com/github/webhook
```

Header importanti:

```text
X-GitHub-Event: pull_request
X-GitHub-Delivery: identificatore-consegna
X-Hub-Signature-256: sha256=...
```

Pattern di gestione:

```text
ricevi evento -> valida firma -> salva delivery id -> metti in coda -> rispondi 2xx -> processa
```

## Esempio pratico

Automazione su pull request:

1. arriva evento `pull_request`;
2. il server valida `X-Hub-Signature-256`;
3. controlla titolo, label o file modificati;
4. chiama la REST API per commentare o aggiungere label;
5. registra delivery id per evitare doppie elaborazioni.

## Varianti

- **Repository webhook**: legato a un repository.
- **Organization webhook**: eventi su piu repository.
- **GitHub App webhook**: legato a un'app installabile.
- **Webhook verso sistema privato**: richiede proxy, tunnel o architettura dedicata.
- **Webhook con coda**: consigliato per elaborazioni lente.

## Errori comuni

- Non validare la firma del webhook.
- Eseguire lavoro lungo prima di rispondere.
- Non gestire retry e consegne duplicate.
- Ascoltare troppi eventi inutili.
- Esporre endpoint senza rate limit o logging.
- Trattare il payload come fonte fidata senza controlli.

## Checklist

- Il webhook ascolta solo eventi necessari?
- Il secret e configurato?
- La firma viene validata?
- Il delivery id viene registrato?
- Il server risponde velocemente?
- Gli errori vengono loggati senza segreti?
- Esiste una strategia per redelivery e retry?

## Collegamenti

- [[Programmazione/GitHub/Indice GitHub]]
- [[GitHub REST API]]
- [[GitHub Apps]]
- [[Automazioni issue e pull request]]
- [[Sicurezza dei token GitHub]]

## Fonti

- [GitHub Docs - Webhooks](https://docs.github.com/en/webhooks)
- [GitHub Docs - Validating webhook deliveries](https://docs.github.com/en/webhooks/using-webhooks/validating-webhook-deliveries)
