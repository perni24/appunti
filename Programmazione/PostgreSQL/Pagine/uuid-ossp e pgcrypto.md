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
  - estensioni
  - uuid
aliases: []
prerequisites: []
related: []
title: uuid-ossp e pgcrypto
---

# uuid-ossp e pgcrypto

## Sintesi

Su PostgreSQL 18 il tipo `uuid` e la generazione di UUID v4 e v7 sono **nativi**. Non installare `pgcrypto` solo per usare `gen_random_uuid()`. Scegli invece `uuid-ossp` se serve un UUID deterministico basato su namespace e nome; scegli `pgcrypto` per funzioni crittografiche come `digest` o `hmac`.

## UUID nativi: casuale o ordinato per tempo?

```sql
SELECT uuid_extract_version(pg_catalog.gen_random_uuid()) AS casuale,
       uuid_extract_version(pg_catalog.uuidv7()) AS temporale;
```

Attesi **4** e **7**. Il v4 è casuale; il v7 contiene una componente temporale che può favorire inserimenti vicini nell'indice, ma non certifica l'ordine dei commit e rivela un'indicazione sul momento di generazione. Una colonna `id uuid PRIMARY KEY DEFAULT gen_random_uuid()` non richiede estensioni. Un identificativo, anche se difficile da indovinare, non sostituisce un controllo degli accessi.

## UUID riproducibili

Con `uuid-ossp` già attiva e visibile nello `search_path` del database di prova, usa la versione 5 per ottenere lo stesso identificativo dagli stessi input. Il nome con il trattino va quotato in `CREATE EXTENSION "uuid-ossp"`. I nomi dell'esempio sono dati dimostrativi, non vengono risolti in rete.

```sql
WITH ids AS (
  SELECT uuid_generate_v5(uuid_ns_dns(), 'app.example') AS a,
         uuid_generate_v5(uuid_ns_dns(), 'app.example') AS b,
         uuid_generate_v5(uuid_ns_dns(), 'altro.example') AS c
)
SELECT a = b AS ripetibile, a <> c AS distinto, uuid_extract_version(a) AS versione
FROM ids;
```

Attesi `true, true, 5`. Cambiare maiuscole, spazi o namespace cambia l'input. Definisci una regola di normalizzazione se sistemi diversi devono produrre lo stesso ID. La storica `uuid_generate_v4()` resta disponibile nell'estensione, ma non è un requisito per la generazione casuale.

## Digest, integrità e password

Con `pgcrypto` attiva nel database, `digest` restituisce byte; `encode` li rende leggibili senza cambiarne il contenuto:

```sql
WITH h AS (SELECT digest('abc', 'sha256') AS valore)
SELECT octet_length(valore) AS bytes, length(encode(valore, 'hex')) AS caratteri,
       left(encode(valore, 'hex'), 8) AS prefisso FROM h;
```

Attesi `32, 64, ba7816bf`. Un digest non cifra i dati e non autentica chi li ha prodotti. Per verificare un messaggio con chiave condivisa si usa un MAC, non un hash pubblico. Per le password non usare SHA-256 diretto: occorre una funzione dedicata con sale e costo adattivo. Non passare segreti negli esempi, nelle query registrate o in connessioni non protette.

## Fonti

[PostgreSQL 18: funzioni UUID native](https://www.postgresql.org/docs/18/functions-uuid.html) · [uuid-ossp](https://www.postgresql.org/docs/18/uuid-ossp.html) · [pgcrypto](https://www.postgresql.org/docs/18/pgcrypto.html)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Gestione delle Estensioni|Gestione delle Estensioni]]
- [[Programmazione/PostgreSQL/Pagine/Sicurezza delle estensioni|Sicurezza delle estensioni]]
- [[Programmazione/PostgreSQL/Pagine/Tipi di Dato|Tipi di Dato]]
