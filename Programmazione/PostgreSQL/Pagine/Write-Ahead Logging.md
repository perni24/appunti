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
  - Write-Ahead Logging (WAL)
prerequisites: []
related: []
title: Write-Ahead Logging (WAL) in PostgreSQL
---

# Write-Ahead Logging (WAL) in PostgreSQL

## Sintesi

Il **write-ahead log** (WAL) registra le informazioni necessarie a rifare le modifiche dopo un arresto imprevisto. La regola riguarda l'ordine delle scritture **persistenti**: prima che una pagina dati modificata venga scritta su disco, deve essere stato reso persistente il WAL che descrive la modifica. La pagina in memoria può essere già cambiata. Un commit durevole non deve aspettare che tutte le pagine dati della transazione arrivino nei file delle tabelle.

## Tre posizioni da non confondere

Su un **primario** PostgreSQL 18, questa lettura distingue tre posizioni nel flusso. Un LSN (*log sequence number*) è una posizione in byte, non un orario, un ID di transazione o il nome di un file.

```sql
SELECT pg_current_wal_insert_lsn() AS inserted,
       pg_current_wal_lsn()        AS written,
       pg_current_wal_flush_lsn()  AS flushed;
```

`inserted` indica fin dove sono stati inseriti record nei buffer WAL; `written` fin dove sono stati scritti; `flushed` fin dove PostgreSQL ha completato il flush verso lo storage. Possono coincidere. Su un server attivo le funzioni non costituiscono un campionamento atomico. `pg_walfile_name(lsn)` collega una posizione al nome del segmento; una differenza fra LSN misura il flusso del **cluster**, non i byte prodotti esclusivamente dal tuo backend.

## Laboratorio: il flush dopo un commit

Sul primario di prova, usa la stessa sessione, `wal_level` pari a `replica` o `logical` e un nome `lab_wal_events` libero nello schema in cui puoi creare tabelle. La tabella degli eventi è ordinaria e genera WAL; quella temporanea serve solo a conservare due misure. Nella medesima transazione eliminiamo la sola tabella eventi appena creata.

```sql
BEGIN;
SET LOCAL synchronous_commit = on;
CREATE TABLE lab_wal_events (id integer, label text);
CREATE TEMP TABLE lab_wal_marks (step text PRIMARY KEY, pos pg_lsn NOT NULL);
INSERT INTO lab_wal_marks VALUES ('before', pg_current_wal_insert_lsn());
INSERT INTO lab_wal_events
SELECT i, 'evento-' || i FROM generate_series(1, 1000) AS g(i);
INSERT INTO lab_wal_marks VALUES ('after', pg_current_wal_insert_lsn());
DROP TABLE lab_wal_events;
COMMIT;
```

```sql
SELECT pg_wal_lsn_diff(b.pos, a.pos) AS interval_bytes,
       pg_current_wal_flush_lsn() >= b.pos AS flushed_through_sample
FROM lab_wal_marks AS a CROSS JOIN lab_wal_marks AS b
WHERE a.step = 'before' AND b.step = 'after';
```

Attesi: un intervallo **positivo** e `true`. Il secondo campione precede il commit; al ritorno del commit sincrono il flush locale lo ha raggiunto. Non esiste un numero di byte atteso per riga. Questo non dimostra un ripristino da backup né la ricezione su una replica. Con `synchronous_commit = off` il client può ricevere successo prima del flush: un crash può perdere transazioni recenti già confermate. Non equivale a disattivare `fsync`.

## Checkpoint

Il checkpoint stabilisce un punto da cui il server può iniziare il **redo** al riavvio. Durante il checkpoint vengono scritte le pagine che devono essere persistenti per quel punto, mentre il database continua a lavorare. Il record che descrive il checkpoint e il punto da cui rifare le modifiche **non sono necessariamente lo stesso LSN**. Un checkpoint non conferma le transazioni aperte e non sostituisce un backup.

Lettura diagnostica su PostgreSQL 18, con un ruolo autorizzato a consultare i dati di controllo:

```sql
SELECT checkpoint_lsn, redo_lsn, timeline_id, checkpoint_time
FROM pg_control_checkpoint();
```

`checkpoint_timeout` e la quantità di WAL generata influenzano la frequenza; `max_wal_size` è un obiettivo, **non un limite rigido alla directory**. Checkpoint ravvicinati possono aumentare scritture e immagini complete di pagina. Per distinguere richieste da checkpoint effettivamente eseguiti, confronta i contatori su un intervallo che non attraversi un reset:

```sql
SELECT num_timed, num_requested, num_done, buffers_written, stats_reset
FROM pg_stat_checkpointer;
```

## Archiviazione, replica e ripristino

- La replica fisica usa i record WAL; `wal_level = replica` o superiore fornisce le informazioni necessarie. Il logical decoding richiede `logical`. Uno slot può trattenere WAL a partire dal suo `restart_lsn`: il consumo lento o fermo può riempire il volume.
- Per il PITR servono **un base backup utilizzabile e una sequenza continua di WAL** fino al punto voluto, sulla storia temporale corretta. Un restore point nominato, creato con `pg_create_restore_point`, è un riferimento nel flusso, non una copia dei dati.
- Prima di abilitare `archive_mode`, stabilisci dove archiviare, come rilevare errori e come provare il restore. Il comando o modulo di archiviazione deve segnalare successo solo se il segmento è stato salvato in modo durevole; un nuovo tentativo su un segmento già presente e identico deve poter riuscire, **senza sovrascrivere un file diverso**. Una semplice copia senza questi controlli non è una configurazione pronta per produzione.
- Se `pg_wal` cresce, controlla spazio libero, stato dell'archiver e slot. Non cancellare i segmenti dal filesystem per fare spazio. La validazione operativa del PITR resta un ripristino su un'altra istanza.

**Fonti PostgreSQL 18:** [principio del WAL](https://www.postgresql.org/docs/18/wal-intro.html), [checkpoint e configurazione](https://www.postgresql.org/docs/18/wal-configuration.html), [statistiche del checkpointer](https://www.postgresql.org/docs/18/monitoring-stats.html#MONITORING-PG-STAT-CHECKPOINTER-VIEW), [archiviazione continua e PITR](https://www.postgresql.org/docs/18/continuous-archiving.html).

## Point-in-Time Recovery

Il PITR ricostruisce **tutto il cluster** lungo una determinata timeline. Per recuperare una sola tabella, ripristina prima su un'istanza isolata e poi esporta la tabella da lì. Occorrono un backup fisico terminato prima dell'obiettivo e tutti i segmenti WAL necessari dall'inizio del backup fino a quell'obiettivo. Il WAL incluso da `pg_basebackup -X stream` rende consistente il backup iniziale, ma non contiene le scritture future.

### Prova con un punto nominato

1. Su un **primario di laboratorio** predisponi archiviazione funzionante e una tabella ordinaria. Fai un base backup in una directory nuova e verifica il manifest con `pg_verifybackup`. Il test deve usare la stessa major e percorsi sicuri anche per eventuali tablespace.
2. **Dopo** la fine del backup, inserisci una riga riconoscibile e fai commit. Con un ruolo autorizzato crea un punto con nome univoco, per esempio `SELECT pg_create_restore_point('lab_prima_cancellazione');`. Poi cancella **solo quella riga di prova** e conferma: dovrà mancare sul primario e ricomparire sulla copia.
3. Forza il cambio del segmento con `pg_switch_wal()` nel laboratorio e verifica che il segmento contenente l'obiettivo sia arrivato nell'archivio. Un cambio di segmento non equivale a un'archiviazione riuscita.
4. Prepara **una copia separata** del backup, senza applicazioni connesse. Usa porta e percorsi distinti, nessun collegamento di streaming al primario e un `restore_command` che recuperi dall'archivio il file richiesto (`%f`) nella destinazione (`%p`), restituendo errore se manca. Sulla sola copia crea `recovery.signal` e imposta:

```ini
recovery_target_name = 'lab_prima_cancellazione'
recovery_target_action = 'pause'
```

5. Avvia la copia con hot standby abilitato. Attendi **sia** il messaggio di raggiungimento del punto richiesto nei log **sia** lo stato `paused` di `pg_get_wal_replay_pause_state()`. Verifica che `pg_is_in_recovery()` sia vero e che la riga sia visibile. Il solo fatto che il server accetti connessioni non dimostra che il target sia stato raggiunto. Se manca il WAL, non dichiarare riuscito il recupero e non promuovere per aggirare l'errore.

Per questa prova si arresta la copia ancora in pausa. In un incidente reale, verifica target, timeline, dati e destinazione del traffico prima di decidere se terminare il recovery. Un target a timestamp richiede anche un fuso esplicito e la scelta del confine di inclusione; un punto nominato evita di dover indovinare l'orario del commit. Misura il tempo fino alla disponibilità dei dati per l'applicazione, non solo fino all'avvio del processo.

## Collegamenti

- [[Programmazione/PostgreSQL/Indice PostgreSQL|Indice PostgreSQL]]
- [[Programmazione/PostgreSQL/Pagine/Backup e Ripristino|Backup e Ripristino]]
- [[Programmazione/PostgreSQL/Pagine/Replicazione Fisica|Replicazione Fisica]]
- [[Programmazione/PostgreSQL/Pagine/Logical decoding|Logical decoding]]
