---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Installazione e Inizializzazione di]
prerequisites: []
related: []
---
# Installazione e Inizializzazione di PostgreSQL

## Sintesi

Nota su Installazione e Inizializzazione di in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

## Concetto chiave
L'installazione di PostgreSQL varia a seconda del sistema operativo, ma il processo di **inizializzazione** (creazione della struttura fisica del database) è un passaggio universale gestito dal comando `initdb`. Comprendere come configurare correttamente l'ambiente iniziale è fondamentale per la sicurezza e le prestazioni future del server.

---

##  Metodi di Installazione

### 1. Linux (Debian/Ubuntu)
PostgreSQL è disponibile nei repository ufficiali, ma è spesso preferibile utilizzare il repository di PostgreSQL per ottenere l'ultima versione stabile.

```bash
# Installazione e Inizializzazione di PostgreSQL

## Sintesi

Nota su Installazione e Inizializzazione di in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
sudo sh -c 'echo "deb http://apt.postgresql.org/pub/repos/apt $(lsb_release -cs)-pgdg main" > /etc/apt/sources.list.d/pgdg.list'
wget --quiet -O - https://www.postgresql.org/media/keys/ACCC4CF8.asc | sudo apt-key add -

# Installazione e Inizializzazione di PostgreSQL

## Sintesi

Nota su Installazione e Inizializzazione di in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
sudo apt update
sudo apt install postgresql-16
```

### 2. Docker (Consigliato per Sviluppo)
Utilizzare Docker permette di isolare l'istanza e gestire facilmente diverse versioni.

```bash
docker run --name pg-server -e POSTGRES_PASSWORD=mysecretpassword -p 5432:5432 -d postgres:16
```

---

##  Inizializzazione con `initdb`

Il comando `initdb` crea un nuovo **Database Cluster** (una collezione di database gestiti da un singolo server). In molte distribuzioni Linux, questo viene eseguito automaticamente durante l'installazione, ma conoscerlo è utile per setup personalizzati.

```bash
# Installazione e Inizializzazione di PostgreSQL

## Sintesi

Nota su Installazione e Inizializzazione di in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
initdb -D /path/to/data/directory
```

### Opzioni Fondamentali:
- **`-D` / `--pgdata`**: Specifica la posizione della [[Programmazione/Postgres/Pagine/File System Layout e Data Directory|Data Directory]].
- **`-E` / `--encoding`**: Imposta il set di caratteri (es. `UTF8`).
- **`--locale`**: Definisce le regole di ordinamento e formattazione (es. `it_IT.UTF-8`).
- **`-A` / `--auth`**: Specifica il metodo di autenticazione predefinito per le connessioni locali (es. `md5` o `scram-sha-256`).

---

## Logic layer: Gestione del Servizio (`pg_ctl`)

Una volta inizializzato il cluster, il server deve essere avviato. Sebbene si usino spesso `systemctl` o `service` su Linux, il tool nativo di Postgres è `pg_ctl`.

```bash
# Installazione e Inizializzazione di PostgreSQL

## Sintesi

Nota su Installazione e Inizializzazione di in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
pg_ctl -D /path/to/data start

# Installazione e Inizializzazione di PostgreSQL

## Sintesi

Nota su Installazione e Inizializzazione di in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.
pg_ctl -D /path/to/data stop -m fast
```

> [!INFO] Modalità di Arresto (`-m`)
> - **Smart**: Attende che tutti i client si disconnettano.
> - **Fast** (Default consigliato): Chiude le connessioni attive e termina i processi immediatamente (ma in modo sicuro).
> - **Immediate**: Forza l'arresto senza un shutdown pulito (richiede recovery al riavvio).

---

##  Best Practices post-installazione

1.  **Non usare l'utente root**: PostgreSQL deve essere eseguito da un utente di sistema dedicato (solitamente chiamato `postgres`).
2.  **Configura il firewall**: Assicurati che la porta `5432` sia accessibile solo agli host autorizzati.
3.  **Ottimizzazione iniziale**: Modifica subito `postgresql.conf` basandoti sulle risorse hardware disponibili (es. `shared_buffers`).

---
