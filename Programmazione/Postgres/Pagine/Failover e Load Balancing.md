---
date: 2026-05-14
area: Programmazione
topic: PostgreSQL
type: technical-note
status: "non revisionato"
difficulty: intermediate
tags: [postgresql, database]
aliases: [Failover e Load Balancing]
prerequisites: []
related: []
---
# Failover e Load Balancing in PostgreSQL

## Sintesi

Nota su Failover e Load Balancing in PostgreSQL. Riassume il concetto, i meccanismi principali e i punti da ricordare durante studio, progettazione o amministrazione.

Per garantire la continuità del servizio e la scalabilità, un cluster PostgreSQL deve gestire correttamente i guasti (**Failover**) e distribuire il carico di lavoro (**Load Balancing**).

## Concetto chiave
Mentre la [[Programmazione/Postgres/Pagine/Replicazione Fisica|Replicazione]] sposta i dati, il **Failover** e il **Load Balancing** gestiscono il traffico dei client. Il Failover assicura che un database sia sempre disponibile per le scritture, mentre il Load Balancing ottimizza l'uso delle risorse distribuendo le letture.

---

##  Failover (Alta Affidabilità)

Il failover è il processo di promozione di un server Standby a Primario quando il Primario originale fallisce.

### 1. Failover Manuale
L'amministratore rileva il guasto e promuove lo standby (es. tramite `pg_ctl promote`). Rischi: tempi di inattività lunghi e errore umano.

### 2. Failover Automatico (HA Solutions)
Strumenti che monitorano costantemente il cluster e intervengono senza l'intervento umano:
- **Patroni:** Lo standard de facto. Usa un archivio di configurazione distribuito (come **etcd** o **Consul**) per gestire l'elezione del leader e prevenire lo "Split Brain" (due primari contemporaneamente).
- **repmgr:** Un set di strumenti più classico per la gestione dei cluster e del failover.

---

##  Load Balancing (Bilanciamento del Carico)

Poiché il Primario è l'unico che può gestire le scritture, il bilanciamento si concentra sulla distribuzione delle `SELECT` sulle repliche.

### Strategie di Bilanciamento
1.  **Read/Write Splitting a livello Applicativo:** L'applicazione usa due stringhe di connessione diverse: una per il Primario (Write) e una per il bilanciatore delle repliche (Read).
2.  **Proxy Layer (es. HAProxy):** Un proxy riceve tutto il traffico e lo smista in base a regole predefinite o allo stato dei server (health checks).
3.  **Connection Poolers Avanzati (es. pgcat):** Possono identificare automaticamente se una query è di sola lettura e inviarla a una replica.

---

##  Indirizzamento del Traffico

Quando avviene un failover, i client devono sapere dove si trova il nuovo Primario.
- **Virtual IP (VIP):** Un indirizzo IP che "salta" dal vecchio al nuovo primario tramite strumenti come `Keepalived`.
- **DNS Dinamico:** Il record DNS del primario viene aggiornato per puntare al nuovo server.
- **Service Discovery:** L'applicazione interroga `etcd` o `Consul` per conoscere l'IP del leader attuale.

---

## Logic layer: La gerarchia dell'HA

> [!INFO] Workflow di un sistema resiliente
> 1.  **Replicazione:** Mantiene i dati sincronizzati su più nodi.
> 2.  **Monitoring:** Rileva se il Primario è "vivo".
> 3.  **Failover Logic:** Elegge un nuovo leader se necessario.
> 4.  **Routing Layer:** Reindirizza i client sul nuovo leader in modo trasparente.

---
[[Programmazione/Postgres/Indice postgres|Torna all'Indice Postgres]]
