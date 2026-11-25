---
date: 2026-06-02
area: Programmazione
topic: PostgreSQL
type: technical-note
status: non revisionato
publish: true
difficulty: intermedio
tags:
  - postgresql
  - database
aliases:
  - Failover e Load Balancing
prerequisites: []
related: []
title: Failover e Load Balancing in PostgreSQL
---

# Failover e Load Balancing in PostgreSQL

## Sintesi

**Failover** significa scegliere e promuovere un nuovo primario dopo un guasto. **Bilanciamento** significa distribuire nuove connessioni o letture tra nodi idonei. Sono decisioni diverse: una porta TCP aperta non dimostra che il nodo possa accettare scritture, e due nodi scrivibili non costituiscono un sistema ad alta disponibilità sicuro.

## Identificare ruolo e capacità

Su ogni nodo interrogabile:

```sql
SELECT pg_is_in_recovery() AS in_recovery,
       current_setting('transaction_read_only') AS transazione_sola_lettura;
```

Su uno standby fisico ci si aspetta `true/on`. Sul primario una transazione può essere di sola lettura: `false/on` **non** identifica una replica. Il risultato descrive il nodo e la transazione interrogati, non dimostra che il vecchio primario sia isolato.

Un client libpq può selezionare un host all'apertura della connessione. Esempio di parametri, da completare con credenziali protette e TLS adeguato:

```text
host=db-a,db-b port=5432 dbname=app target_session_attrs=read-write connect_timeout=3
```

`read-write` scarta i nodi che non accettano transazioni in scrittura per impostazione predefinita. Per letture, `standby` richiede uno standby, `prefer-standby` consente un ripiego. La selezione avviene per **connessione**, non per statement: né libpq né il normale transaction pooling separano automaticamente `SELECT` e `INSERT`. Le connessioni già aperte non migrano.

## Sequenza di failover

1. **Definisci gli obiettivi.** RPO: quanti dati confermati si possono perdere? RTO: quanto tempo può passare prima che l'app torni operativa? Replica asincrona e perdita improvvisa del primario possono comportare perdita di commit già confermati.
2. **Accerta il guasto e isola il vecchio writer.** Un timeout può essere una partizione di rete. Il *fencing* deve impedirgli di accettare altre scritture anche se si riconnette; cambiare DNS non basta.
3. **Scegli il candidato.** Confronta stato di recovery, WAL disponibile e avanzamento di replay. Valuta l'eventuale perdita rispetto all'RPO. In uno switchover pianificato puoi fermare prima le scritture e aspettare il recupero.
4. **Promuovi una sola volta**, con il gestore HA adottato oppure con `pg_ctl promote` sullo standby designato. Verifica uscita dalla recovery, scrivibilità e instradamento dei nuovi client. Non impartire promozioni manuali concorrenti a un orchestratore.
5. **Recupera il servizio.** Riapri le connessioni del pool; se è caduta la connessione durante `COMMIT`, l'esito può essere ignoto. Verifica l'operazione tramite una chiave idempotente prima di ritentarla. Reintegra il vecchio primario soltanto come standby riallineato (nuova copia di base o `pg_rewind` se applicabile).

## Esercizio di accettazione

In una topologia di prova, verifica che l'endpoint write apra una nuova connessione al writer, quello read rispetti la politica di ritardo e che il vecchio writer rimanga escluso anche al riavvio. Misura il tempo **fino alla prima operazione applicativa riuscita**, non soltanto il tempo di promozione. Ripeti il test anche con una risposta di commit persa.

## Fonti

[PostgreSQL 18: failover](https://www.postgresql.org/docs/18/warm-standby-failover.html) · [libpq: connessioni multihost e target_session_attrs](https://www.postgresql.org/docs/18/libpq-connect.html#LIBPQ-CONNECT-TARGET-SESSION-ATTRS)

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/PostgreSQL/Pagine/Read replicas|Read replicas]]
- [[Programmazione/PostgreSQL/Pagine/Connection Pooling|Connection Pooling]]
