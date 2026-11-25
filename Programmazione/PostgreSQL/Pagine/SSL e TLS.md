---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
tags:
  - programmazione
  - postgres
  - sicurezza
  - tls
aliases:
  - SSL/TLS
prerequisites: []
related: []
title: SSL/TLS
---

# SSL/TLS

## Sintesi

TLS risponde a due domande diverse: «il traffico è cifrato?» e «sono connesso al server previsto?». SCRAM autentica il login; non sostituisce la verifica del certificato del server. Se usi un pooler o un proxy, considera separatamente il tratto client-pooler e quello pooler-database.

## Scegliere la modalità libpq

| `sslmode` | Cosa richiede il client |
| --- | --- |
| `disable` / `prefer` | Nessun TLS / tentativo TLS con possibile ripiego: non sono una garanzia di cifratura |
| `require` | Richiede cifratura. Per compatibilità, se trova una CA radice si comporta come `verify-ca`; non usarlo per esprimere una politica di verifica del nome |
| `verify-ca` | Richiede cifratura e una catena valida verso una CA attendibile, ma non verifica il nome dell'host |
| `verify-full` | Richiede anche la corrispondenza tra host richiesto e certificato: scelta esplicita per connessioni remote che devono autenticare il server |

## Esempio: verificare il server

Prerequisiti: PostgreSQL con supporto TLS, `ssl=on`, certificato e chiave server; il certificato deve essere valido per il nome usato dal client. Distribuisci al client la CA attendibile attraverso un canale controllato. Il certificato pubblico della CA non è una password: ne è essenziale l'integrità; la **chiave privata** invece deve restare segreta.

Esempio `psql` per un client con i percorsi indicati. La password non compare nel comando: usa il prompt o un passfile protetto. Con libpq, `gssencmode=disable` rende questa prova specifica per TLS anche in ambienti che offrono cifratura GSS.

```bash
psql "host=db.example.test dbname=app_db user=app_user sslmode=verify-full sslrootcert=/etc/postgresql/app-ca.pem gssencmode=disable"
```

Nella connessione appena aperta:

```sql
SELECT ssl, version, cipher
FROM pg_stat_ssl WHERE pid = pg_backend_pid();
```

Atteso: `ssl=true`, protocollo e cifrario valorizzati. Questa vista descrive la tratta che arriva a PostgreSQL: **non dimostra** quale `sslmode` ha usato il client. Verifica separatamente che il client rifiuti un nome non coperto dal certificato o una CA diversa.

## Richiedere TLS anche sul server

Esempio di regole HBA per la sola combinazione database, ruolo e rete IPv4 indicata; verificare ordine e ambito anche per altri indirizzi e IPv6:

```text
hostnossl app_db app_user 10.0.0.0/24 reject
hostssl   app_db app_user 10.0.0.0/24 scram-sha-256
```

Vale la **prima** regola applicabile. Una `hostssl` da sola non impedisce a una successiva regola `host` più ampia di accettare connessioni non cifrate. Valida le regole prima della distribuzione, verifica le nuove connessioni e pianifica rinnovo, catena di fiducia e permessi sulla chiave. L'autenticazione con certificato client è un'opzione distinta dalla verifica del certificato server.

## Fonti

[PostgreSQL 18: verifica TLS in libpq](https://www.postgresql.org/docs/18/libpq-ssl.html) · [TLS lato server](https://www.postgresql.org/docs/18/ssl-tcp.html) · [Ordine e tipi delle regole HBA](https://www.postgresql.org/docs/18/auth-pg-hba-conf.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Driver e connection string|Driver e connection string]]
- [[Programmazione/PostgreSQL/Pagine/Secret management|Secret management]]
- [[Programmazione/PostgreSQL/Pagine/Gestione Utenti e Ruoli|Gestione Utenti e Ruoli]]
