---
date: 2026-07-13
area: Linux
topic: Gestione operativa dei database su Linux
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, server, database, postgresql, mysql, amministrazione]
aliases: [Database server Linux, PostgreSQL e MySQL su Linux]
prerequisites: [systemd, Porte e socket, Storage e filesystem]
related: [Backup e ripristino, Monitoraggio del sistema, Firewall con nftables]
---

# Database su Linux

## Sintesi

Gestire un database su Linux significa coordinare il motore con servizi, filesystem, memoria, rete, identita, log, aggiornamenti e backup. PostgreSQL e MySQL/MariaDB seguono convenzioni differenti; percorsi, nomi delle unit e strumenti dipendono anche dai pacchetti della distribuzione.

Il data directory non e una normale cartella da copiare mentre il server e attivo. Consistenza e ripristino richiedono strumenti logici o backup fisici supportati dal motore, insieme ai log necessari per il point-in-time recovery.

## Quando usarlo

- Installare e mantenere un database come servizio di sistema.
- Diagnosticare avvio, connessioni, spazio e prestazioni.
- Limitare l'esposizione di rete e i privilegi degli account.
- Pianificare aggiornamenti, backup e ripristino.
- Integrare metriche e log del motore con quelli dell'host.

## Come funziona

Il processo server gira normalmente con un utente di sistema dedicato, per esempio `postgres` o `mysql`, e possiede il data directory. Le applicazioni si autenticano con ruoli interni al database: account del sistema operativo e account SQL sono livelli distinti, anche quando un metodo locale li mette in relazione.

PostgreSQL chiama **cluster** l'insieme di database gestiti da una singola istanza e data directory. MySQL organizza un'istanza attorno a data directory, system schema, redo/undo e binary log secondo configurazione e storage engine.

Il servizio puo ascoltare su socket Unix, TCP loopback o indirizzi di rete. Il bind determina dove accetta connessioni; firewall, regole di autenticazione e privilegi SQL determinano chi puo usarle. Esporre una porta senza TLS e controllo degli host crea un confine molto piu ampio del necessario.

Memoria e cache del database si sommano alla page cache, alle connessioni e agli altri servizi. Un limite cgroup troppo aggressivo puo attivare OOM; impostazioni eccessive possono saturare l'host. Storage, filesystem e cache policy devono rispettare le garanzie di flush richieste dal motore.

Gli aggiornamenti minori e maggiori hanno procedure diverse. Prima di cambiare repository, versione principale, formato o plugin servono compatibilita verificata, backup ripristinabile e piano di rollback realistico.

## API / Sintassi

Mostrare lo stato di PostgreSQL quando la distribuzione espone questa unit:

```bash
systemctl status postgresql
```

Verificare la disponibilita PostgreSQL:

```bash
pg_isready
```

Mostrare la versione del server PostgreSQL tramite SQL locale:

```bash
sudo -u postgres psql --command='SELECT version();'
```

Mostrare lo stato di MySQL quando la unit si chiama `mysql`:

```bash
systemctl status mysql
```

Verificare che MySQL risponda:

```bash
mysqladmin ping
```

Mostrare la versione MySQL tramite SQL:

```bash
mysql --execute='SELECT VERSION();'
```

Controllare socket e porte in ascolto:

```bash
sudo ss -ltnp
```

Mostrare spazio e filesystem del data directory noto:

```bash
findmnt /var/lib
```

Leggere i log PostgreSQL dalla unit generica:

```bash
sudo journalctl -u postgresql -b
```

Leggere i log MySQL dalla unit `mysql`:

```bash
sudo journalctl -u mysql -b
```

## Esempio pratico

Quando un'applicazione non raggiunge il database, verificare prima che il servizio sia attivo:

```bash
systemctl status postgresql
```

Controllare la disponibilita a livello protocollo:

```bash
pg_isready -h 127.0.0.1 -p 5432
```

Verificare dove il processo ascolta realmente:

```bash
sudo ss -ltnp
```

Leggere gli eventi recenti del servizio:

```bash
sudo journalctl -u postgresql -b
```

Se il server risponde localmente ma non da remoto, controllare in ordine bind address, regole di autenticazione del motore, firewall, routing e TLS. Non risolvere impostando ascolto su tutte le interfacce e accesso universale.

## Varianti

- PostgreSQL usa `pg_dump` per backup logici e `pg_basebackup` per copie fisiche supportate.
- MySQL usa strumenti logici come `mysqldump` e soluzioni fisiche compatibili con storage engine e versione.
- I pacchetti della distribuzione integrano utenti, directory, unit e policy; i repository del vendor possono seguire convenzioni diverse.
- Un socket Unix evita la rete locale e puo integrarsi con autenticazione peer.
- Replica e failover aumentano disponibilita, ma non sostituiscono backup contro errori logici o cancellazioni.
- Container e VM cambiano packaging e isolamento, non eliminano requisiti di storage persistente, backup e monitoraggio.
- Un servizio gestito esterno sposta parte dell'operativita al provider, ma non responsabilita su schema, accessi e ripristino applicativo.

## Errori comuni

- Copiare il data directory di un server attivo con strumenti generici e chiamarlo backup consistente.
- Eseguire il database come `root` o rendere i file leggibili da utenti non necessari.
- Esporre la porta su tutte le interfacce senza firewall, TLS e regole di autenticazione restrittive.
- Usare l'account amministrativo del database per l'applicazione.
- Confondere replica, snapshot e backup ripristinabile.
- Aggiornare una major release come un normale aggiornamento di pacchetto.
- Dimensionare memoria per singola connessione ignorando il numero massimo di sessioni.
- Ignorare spazio per WAL, binary log, file temporanei e operazioni di manutenzione.
- Cambiare ownership o permessi del data directory senza conoscere le aspettative del pacchetto.
- Monitorare solo la porta aperta senza eseguire query e controlli di replica o recovery.

## Checklist

- Versione, pacchetto, unit e data directory effettivi sono noti?
- Il servizio usa un account OS dedicato e privilegi minimi?
- Socket e bind address espongono soltanto le reti necessarie?
- Autenticazione, ruoli SQL, TLS e firewall formano una policy coerente?
- Memoria, connessioni, storage e log hanno capacita sufficiente?
- Backup logico o fisico e point-in-time recovery sono configurati?
- Un ripristino completo e stato provato su un ambiente separato?
- Aggiornamenti e migrazioni hanno prerequisiti e rollback documentati?
- Metriche includono query, lock, connessioni, replica e spazio dei log?
- Configurazione e segreti sono protetti e inventariati separatamente dai dati?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/systemd|systemd]]
- [[Linux/Pagine/Porte e socket|Porte e socket]]
- [[Linux/Pagine/Filesystem ext4 Btrfs e XFS|Filesystem ext4, Btrfs e XFS]]
- [[Linux/Pagine/Firewall con nftables|Firewall con nftables]]
- [[Linux/Pagine/Backup e ripristino|Backup e ripristino]]
- [[Linux/Pagine/Monitoraggio del sistema|Monitoraggio del sistema]]

## Fonti

- [PostgreSQL - Server Setup and Operation](https://www.postgresql.org/docs/current/runtime.html)
- [PostgreSQL - Backup and Restore](https://www.postgresql.org/docs/current/backup.html)
- [MySQL - Security](https://dev.mysql.com/doc/refman/8.4/en/security.html)
- [MySQL - Backup and Recovery](https://dev.mysql.com/doc/refman/8.4/en/backup-and-recovery.html)
- [MariaDB Server documentation](https://mariadb.com/docs/server/)
