---
date: 2026-05-20
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
difficulty: 
tags:
  - programmazione
  - postgres
  - sicurezza
  - tls
aliases:
  - SSL/TLS
prerequisites: []
related: []
---

# SSL/TLS

## Sintesi

SSL/TLS protegge la connessione tra client e server PostgreSQL cifrando il traffico e, se configurato, verificando identita del server e del client.

## Concetto chiave

La cifratura in transito evita lettura o manipolazione del traffico sulla rete.

## Configurazione tipica

Nel client si usa spesso una modalita SSL:

- `disable`
- `prefer`
- `require`
- `verify-ca`
- `verify-full`

`verify-full` e la scelta piu forte per verificare anche il nome host.

## Errori comuni

- Usare `require` pensando che verifichi l'identita del server.
- Non ruotare certificati.
- Esporre database su rete pubblica senza policy di rete.

## Quando usarlo

- Da completare: indicare scenari pratici in cui questa nota e utile.

## Come funziona

Da completare: spiegare il meccanismo principale o il comportamento tecnico.

## API / Sintassi

```text
Da completare con API o sintassi principale.
```

## Esempio pratico

```text
Da completare con un esempio pratico.
```

## Varianti

- Da completare: varianti, alternative o differenze rispetto ad approcci simili.

## Checklist

- Da completare: controlli essenziali prima di usare questo concetto in pratica.

## Collegamenti
- [[Programmazione/Postgres/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/Postgres/Pagine/Secret management|Secret management]]
- [[Programmazione/Postgres/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]


