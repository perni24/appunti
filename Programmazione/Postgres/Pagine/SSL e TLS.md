---
date: 2026-06-02
area: Programmazione
topic: Postgres
type: technical-note
status: "non revisionato"
publish: true
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

SSL/TLS protegge la connessione tra client e server PostgreSQL cifrando il traffico e, se configurato correttamente, verificando l'identita del server.

## Quando usarlo

Usa TLS quando il traffico database attraversa reti non completamente fidate:

- connessioni da applicazioni a database gestiti;
- traffico tra host diversi;
- ambienti cloud;
- accesso da reti private condivise;
- connessioni amministrative remote;
- requisiti di compliance o audit.

## Come funziona

PostgreSQL puo accettare connessioni cifrate. Il client decide il livello di verifica tramite `sslmode`.

`require` cifra il traffico, ma non sempre verifica pienamente l'identita del server. `verify-ca` verifica la CA. `verify-full` verifica CA e hostname, ed e la scelta piu forte quando possibile.

## API / Sintassi

Modalita client comuni:

```text
sslmode=disable
sslmode=prefer
sslmode=require
sslmode=verify-ca
sslmode=verify-full
```

Connection string:

```text
postgresql://app_user:secret@db.example.com:5432/app_db?sslmode=verify-full
```

Regola `pg_hba.conf` solo TLS:

```text
hostssl app_db app_user 10.0.0.0/24 scram-sha-256
```

## Esempio pratico

Connessione applicativa con verifica forte:

```text
postgresql://app_user:${DB_PASSWORD}@db.prod.example.com:5432/app_db?sslmode=verify-full&sslrootcert=/etc/ssl/postgres/ca.pem
```

In questo caso il client rifiuta il server se il certificato non e firmato dalla CA attesa o se l'hostname non corrisponde.

## Varianti

- TLS solo cifratura: `sslmode=require`.
- Verifica CA: `sslmode=verify-ca`.
- Verifica CA e hostname: `sslmode=verify-full`.
- Autenticazione client con certificato.
- TLS terminato su proxy o pooler.
- Regole `hostssl` in `pg_hba.conf`.

## Errori comuni

- Usare `require` pensando che verifichi l'identita del server.
- Non ruotare certificati.
- Esporre database su rete pubblica senza policy di rete.
- Disabilitare verifica per aggirare problemi di certificato.
- Dimenticare TLS tra app e pooler o tra pooler e database.
- Non monitorare scadenza dei certificati.

## Checklist

- Il traffico attraversa reti non fidate?
- `sslmode` e almeno `verify-full` dove possibile?
- CA e certificati sono gestiti come segreti?
- Le regole `pg_hba.conf` richiedono `hostssl` se necessario?
- La scadenza dei certificati e monitorata?
- Pooler e proxy mantengono TLS dove serve?

## Collegamenti

- [[Programmazione/Postgres/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/Postgres/Pagine/Secret management|Secret management]]
- [[Programmazione/Postgres/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
