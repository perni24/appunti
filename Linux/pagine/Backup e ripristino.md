---
date: 2026-07-13
area: Linux
topic: Backup e ripristino dei sistemi Linux
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, server, backup, restore, disaster-recovery]
aliases: [Backup Linux, Restore Linux]
prerequisites: [Storage e filesystem, Trasferimento file con scp e rsync, Crittografia con LUKS]
related: [Database su Linux, Timer systemd, RAID software]
---

# Backup e ripristino

## Sintesi

Un backup e una copia indipendente e recuperabile dei dati, conservata con una politica di versioning, retention e protezione. Il suo valore si misura con un ripristino riuscito entro gli obiettivi concordati, non con l'assenza di errori nel job di copia.

Replica, RAID, snapshot e sincronizzazione migliorano disponibilita o velocita operativa, ma possono propagare cancellazioni, corruzione e compromissioni. Possono partecipare alla strategia, non sostituire copie separate e testate.

## Quando usarlo

- Proteggere dati, configurazioni, chiavi e metadati necessari al servizio.
- Recuperare cancellazioni o versioni precedenti.
- Ripristinare un host dopo guasto, ransomware o errore operativo.
- Preparare aggiornamenti e migrazioni rischiose.
- Dimostrare RPO e RTO attraverso prove periodiche.

## Come funziona

La progettazione parte da due obiettivi:

- **RPO**: quanti dati recenti si puo accettare di perdere.
- **RTO**: quanto tempo puo richiedere il ritorno in servizio.

Una strategia simile alla regola 3-2-1 mantiene piu copie, su supporti o sistemi distinti, con almeno una copia fuori dal dominio di guasto principale. Per minacce intenzionali serve anche una copia offline, append-only o immutabile con credenziali separate.

I backup possono essere:

- **completi**: contengono l'intero insieme selezionato;
- **incrementali**: salvano modifiche rispetto a un punto precedente;
- **differenziali**: salvano modifiche rispetto all'ultimo completo;
- **logici**: esportano oggetti tramite l'applicazione, per esempio SQL;
- **fisici**: copiano strutture native con una procedura supportata dal software.

Deduplicazione, compressione e cifratura riducono spazio o proteggono riservatezza, ma aggiungono dipendenze. Chiavi, password del repository, versioni del software e documentazione di recovery devono essere disponibili anche quando l'host originale non esiste piu.

File in modifica richiedono coerenza: snapshot filesystem, hook applicativi o strumenti nativi del database. Copiare singoli file di un database attivo non garantisce un punto ripristinabile.

## API / Sintassi

Inizializzare un repository restic locale:

```bash
restic -r /srv/backup/restic init
```

Creare un backup di `/etc` e `/srv`:

```bash
restic -r /srv/backup/restic backup /etc /srv
```

Elencare gli snapshot:

```bash
restic -r /srv/backup/restic snapshots
```

Verificare struttura e metadati del repository:

```bash
restic -r /srv/backup/restic check
```

Verificare anche tutti i dati del repository:

```bash
restic -r /srv/backup/restic check --read-data
```

Ripristinare uno snapshot in una directory separata:

```bash
restic -r /srv/backup/restic restore SNAPSHOT_ID --target /srv/restore-test
```

Simulare una sincronizzazione rsync prima di usarla come copia secondaria:

```bash
rsync -aHAX --numeric-ids --delete --dry-run /srv/dati/ backup.example:/srv/replica/dati/
```

Mostrare lo stato di un timer di backup systemd gia configurato:

```bash
systemctl status backup.timer
```

Mostrare le prossime esecuzioni dei timer:

```bash
systemctl list-timers
```

## Esempio pratico

Prima di automatizzare restic, creare un repository su storage separato e fornire la password tramite un file protetto o un secret manager, non nella riga di comando o nello storico della shell.

Eseguire il primo backup:

```bash
restic -r /srv/backup/restic backup /etc /srv
```

Controllare che lo snapshot sia registrato:

```bash
restic -r /srv/backup/restic snapshots
```

Verificare periodicamente il repository:

```bash
restic -r /srv/backup/restic check --read-data
```

Ripristinare uno snapshot in un percorso vuoto e separato:

```bash
restic -r /srv/backup/restic restore SNAPSHOT_ID --target /srv/restore-test
```

Confrontare file, permessi, ACL, extended attribute e funzionamento dell'applicazione. Il test deve includere anche configurazione, segreti e ordine di avvio dei servizi, non soltanto l'apertura di alcuni file.

## Varianti

- Restic crea snapshot deduplicati e cifrati verso backend locali o remoti.
- BorgBackup offre repository deduplicati, cifratura e accesso remoto tramite SSH.
- `rsync` e utile per repliche e copie, ma senza snapshot o versioning puo propagare immediatamente gli errori.
- Snapshot LVM, Btrfs o storage possono fornire un punto rapido, ma restano nello stesso dominio di guasto se non vengono esportati.
- Dump logici sono portabili e selettivi; backup fisici sono spesso piu rapidi per grandi database.
- WAL, binary log e journal applicativi possono abilitare point-in-time recovery insieme a un backup base.
- Backup bare-metal, configurazione dichiarativa e reinstallazione automatizzata offrono strategie di recovery differenti.

## Errori comuni

- Considerare completato il backup senza provarne il ripristino.
- Conservare tutte le copie sullo stesso host, account o storage.
- Chiamare backup una replica con `--delete` o un RAID.
- Copiare file di database attivi senza procedura applicativamente consistente.
- Cifrare il repository e non proteggere o duplicare la chiave di recovery.
- Applicare retention e prune senza verificare selezione e spazio disponibile.
- Escludere configurazioni, ACL, xattr, boot metadata o segreti necessari al recovery.
- Non monitorare job saltati, backup troppo piccoli o crescita anomala.
- Provare il restore sovrascrivendo direttamente la produzione.
- Definire RPO e RTO incompatibili con frequenza, banda e tempo di ripristino reali.

## Checklist

- Dati, configurazioni, database, chiavi e metadati da proteggere sono inventariati?
- RPO, RTO, frequenza e retention sono espliciti?
- Esistono copie in domini di guasto e credenziali differenti?
- Almeno una copia resiste a cancellazione o compromissione dell'host?
- Il backup dei dati attivi e consistente con l'applicazione?
- Repository, supporti e checksum vengono verificati periodicamente?
- Chiavi e password di recovery sono disponibili fuori dall'host?
- Alert rilevano fallimenti, assenza di nuovi backup e dimensioni inattese?
- Il ripristino viene provato in un ambiente separato?
- L'esito del test dimostra tempi e completezza richiesti?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Trasferimento file con scp e rsync|Trasferimento file con scp e rsync]]
- [[Linux/Pagine/Timer systemd|Timer systemd]]
- [[Linux/Pagine/RAID software|RAID software]]
- [[Linux/Pagine/Filesystem ext4 Btrfs e XFS|Filesystem ext4, Btrfs e XFS]]
- [[Linux/Pagine/Database su Linux|Database su Linux]]
- [[Linux/Pagine/Monitoraggio del sistema|Monitoraggio del sistema]]

## Fonti

- [restic documentation](https://restic.readthedocs.io/en/stable/)
- [restic - Preparing a new repository](https://restic.readthedocs.io/en/stable/030_preparing_a_new_repo.html)
- [restic - Checking integrity and consistency](https://restic.readthedocs.io/en/stable/045_working_with_repos.html)
- [BorgBackup documentation](https://borgbackup.readthedocs.io/en/stable/)
- [PostgreSQL - Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
