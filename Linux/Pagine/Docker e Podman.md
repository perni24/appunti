---
date: 2026-07-13
area: Linux
topic: Container engine Docker e Podman
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, docker, podman, container, oci]
aliases: [Docker vs Podman, Container engine Linux]
prerequisites: [Container, Namespace, Cgroups]
related: [Principio del minimo privilegio, systemd, Firewall con nftables]
---

# Docker e Podman

## Sintesi

Docker Engine e Podman gestiscono immagini, container, reti e volumi OCI tramite interfacce a riga di comando simili. Docker usa normalmente un'architettura client-server con il daemon `dockerd`; Podman e progettato come engine daemonless e puo avviare container direttamente sotto l'utente che esegue il comando.

La somiglianza della CLI facilita la migrazione, ma non garantisce compatibilita completa. Differiscono per architettura, socket API, gestione systemd, rete, Compose, storage rootless e integrazioni esterne. La scelta deve considerare automazione e modello di sicurezza, non solo la sintassi di `run`.

## Quando usarlo

- Usare Docker quando strumenti, pipeline e team dipendono dalla Docker Engine API o da Docker Compose.
- Usare Podman per workflow Linux daemonless, rootless e integrazione nativa con systemd tramite Quadlet.
- Eseguire servizi isolati con immagini OCI.
- Costruire e ispezionare immagini applicative.
- Riprodurre localmente ambienti usati in CI o produzione.

## Come funziona

Con Docker, il client `docker` invia richieste al daemon tramite un socket Unix o un endpoint remoto. Il daemon gestisce oggetti e delega l'esecuzione ai componenti runtime. L'accesso al socket locale concede di fatto un controllo molto elevato sull'host: non deve essere esposto a utenti o container non attendibili.

Podman non richiede un daemon centrale per il normale uso locale. Ogni utente rootless possiede storage e container separati; i container dell'utente non coincidono con quelli gestiti da `root`. Podman puo comunque esporre un servizio API compatibile per integrazioni che lo richiedono.

Entrambi distinguono:

- immagini e layer immutabili;
- container con configurazione e stato runtime;
- volumi gestiti dall'engine;
- bind mount verso percorsi dell'host;
- reti e porte pubblicate;
- registry da cui effettuare pull e verso cui effettuare push.

Rootless riduce l'impatto di una compromissione mappando il container su un utente non privilegiato, ma presenta limiti su porte privilegiate, networking, filesystem e device. Non sostituisce aggiornamenti, capability minime, seccomp e policy AppArmor o SELinux.

## API / Sintassi

Mostrare versione e componenti Docker:

```bash
docker version
```

Mostrare configurazione e storage Docker:

```bash
docker info
```

Mostrare versione Podman:

```bash
podman version
```

Mostrare configurazione e storage Podman:

```bash
podman info
```

Scaricare un'immagine con Docker:

```bash
docker pull docker.io/library/alpine:3.22
```

Scaricare la stessa immagine con Podman:

```bash
podman pull docker.io/library/alpine:3.22
```

Eseguire un container effimero con Docker:

```bash
docker run --rm docker.io/library/alpine:3.22 cat /etc/os-release
```

Eseguire un container effimero con Podman:

```bash
podman run --rm docker.io/library/alpine:3.22 cat /etc/os-release
```

Elencare tutti i container Docker:

```bash
docker ps --all
```

Elencare tutti i container Podman dell'utente corrente:

```bash
podman ps --all
```

Leggere i log con Docker:

```bash
docker logs nome-container
```

Leggere i log con Podman:

```bash
podman logs nome-container
```

Ispezionare la configurazione con Docker:

```bash
docker inspect nome-container
```

Ispezionare la configurazione con Podman:

```bash
podman inspect nome-container
```

Aprire una shell in un container Docker in esecuzione:

```bash
docker exec -it nome-container /bin/sh
```

Aprire una shell in un container Podman in esecuzione:

```bash
podman exec -it nome-container /bin/sh
```

## Esempio pratico

Creare un volume Docker:

```bash
docker volume create dati-demo
```

Avviare un container Docker non privilegiato con filesystem radice in sola lettura e volume scrivibile:

```bash
docker run --rm --read-only --cap-drop=ALL --security-opt=no-new-privileges --mount type=volume,source=dati-demo,target=/dati docker.io/library/alpine:3.22 sh -c 'echo prova > /dati/esempio.txt'
```

Creare un volume Podman:

```bash
podman volume create dati-demo
```

Eseguire l'equivalente con Podman:

```bash
podman run --rm --read-only --cap-drop=ALL --security-opt=no-new-privileges --mount type=volume,source=dati-demo,target=/dati docker.io/library/alpine:3.22 sh -c 'echo prova > /dati/esempio.txt'
```

Il volume persiste oltre la rimozione del container. In produzione vanno inoltre definite ownership, backup, limiti di risorsa, policy LSM e una versione immagine bloccata preferibilmente tramite digest.

## Varianti

- `docker compose` gestisce applicazioni multi-container descritte da un Compose file.
- `podman compose` delega il carico Compose a un provider esterno; la compatibilita va verificata sul progetto concreto.
- Podman Quadlet genera unit systemd a partire da file dichiarativi per container, pod, volumi e reti.
- Docker rootless esegue daemon e container in un user namespace senza privilegi root sull'host.
- Podman puo esporre un socket API attivato da systemd per client remoti o compatibili.
- I pod Podman raggruppano container che condividono namespace selezionati.
- BuildKit, Buildah e altri builder possono produrre immagini OCI senza coincidere con l'engine che le eseguira.

## Errori comuni

- Aggiungere indiscriminatamente utenti al gruppo `docker`, che permette di controllare il daemon privilegiato.
- Montare `/var/run/docker.sock` in un container non attendibile.
- Usare `--privileged` per aggirare problemi di permessi senza analizzarne la causa.
- Usare tag mobili o nomi immagine non qualificati in automazioni riproducibili.
- Confondere un volume con un backup o con una replica dei dati.
- Pubblicare una porta senza specificare l'indirizzo di bind e renderla raggiungibile da reti inattese.
- Presumere che Podman rootless veda container e immagini dell'utente root.
- Applicare un alias `docker=podman` e ignorare differenze di API, Compose, rete o plugin.
- Inserire password e token in `Dockerfile`, argomenti di build o history dell'immagine.
- Rimuovere risorse con comandi `prune` senza controllare quali oggetti non sono referenziati.

## Checklist

- L'engine e la modalita rootful o rootless sono noti?
- Il client parla con il socket e il contesto previsti?
- Le immagini usano registry esplicito, versione o digest e fonte attendibile?
- Il container usa utente, capability e mount minimi?
- Volumi e bind mount hanno ownership, backup e policy corrette?
- Le porte sono pubblicate solo sugli indirizzi necessari?
- Limiti cgroup e politiche di riavvio sono definiti?
- Compose, socket API e plugin sono realmente compatibili con l'engine scelto?
- Log, metriche e aggiornamenti sono integrati nel ciclo operativo?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Container|Container]]
- [[Linux/Pagine/Namespace|Namespace]]
- [[Linux/Pagine/Cgroups|Cgroups]]
- [[Linux/Pagine/Principio del minimo privilegio|Principio del minimo privilegio]]
- [[Linux/Pagine/systemd|systemd]]
- [[Linux/Pagine/Firewall con nftables|Firewall con nftables]]

## Fonti

- [Docker overview](https://docs.docker.com/get-started/docker-overview/)
- [Docker Engine security - Rootless mode](https://docs.docker.com/engine/security/rootless/)
- [Docker storage](https://docs.docker.com/engine/storage/)
- [Podman documentation](https://docs.podman.io/)
- [Podman manual](https://docs.podman.io/en/latest/markdown/podman.1.html)
- [Open Container Initiative](https://opencontainers.org/)
