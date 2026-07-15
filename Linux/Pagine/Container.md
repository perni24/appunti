---
date: 2026-07-13
area: Linux
topic: Container Linux
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, container, oci, isolamento, runtime]
aliases: [Linux containers, Container applicativi]
prerequisites: [Namespace, Cgroups, Principio del minimo privilegio]
related: [Docker e Podman, KVM e QEMU, AppArmor e SELinux]
---

# Container

## Sintesi

Un container e un insieme di processi isolati e configurati dal sistema operativo, normalmente avviati con un filesystem radice derivato da un'immagine. Su Linux condivide il kernel dell'host e combina namespace, cgroup, capability, seccomp, filesystem e policy LSM.

Un container non e una macchina virtuale leggera in senso stretto: una VM esegue un kernel guest su hardware virtuale, mentre un container usa il kernel host. Questa differenza rende i container rapidi e densi, ma lega compatibilita e superficie di attacco al kernel condiviso.

## Quando usarlo

- Distribuire un'applicazione con dipendenze riproducibili.
- Isolare servizi con cicli di vita e limiti separati.
- Costruire ambienti coerenti tra sviluppo, CI e produzione.
- Eseguire workload effimeri o scalabili.
- Separare applicazioni senza il costo di una VM per ciascuna istanza.

## Come funziona

Un'immagine OCI descrive layer di filesystem e configurazione. Quando viene creato un container, il runtime prepara un filesystem scrivibile sopra i layer dell'immagine, configura isolamento e limiti, quindi avvia il processo definito come entrypoint o comando.

I concetti da distinguere sono:

- **Immagine**: artefatto immutabile e versionato usato come base.
- **Container**: istanza eseguibile con stato runtime e layer scrivibile.
- **Registry**: servizio che distribuisce immagini e relativi manifest.
- **Runtime**: componente che prepara ed esegue il container secondo una specifica, per esempio `runc` o `crun`.
- **Engine**: strumento di livello superiore che gestisce immagini, rete, volumi e ciclo di vita.

Il processo principale del container determina normalmente il suo ciclo di vita. Se termina, il container si arresta. Come PID 1 interno deve ricevere e inoltrare segnali, attendere i figli e gestire lo shutdown; applicazioni che non lo fanno possono richiedere un piccolo init.

I dati nel layer scrivibile sono legati al container. I dati persistenti vanno collocati in volumi o bind mount con ownership, backup e policy espliciti. La rete e virtuale solo se il runtime crea un network namespace; pubblicare una porta rende il servizio raggiungibile secondo le regole configurate sull'host.

## API / Sintassi

Le specifiche OCI separano immagine, distribuzione e runtime. A livello concettuale, un engine esegue operazioni equivalenti a:

```text
pull image -> verify reference -> unpack root filesystem -> configure runtime -> create -> start -> monitor -> delete
```

Mostrare i namespace del processo corrente:

```bash
ls -l /proc/self/ns
```

Mostrare il cgroup del processo corrente:

```bash
cat /proc/self/cgroup
```

Mostrare le capability della shell quando `capsh` e disponibile:

```bash
capsh --print
```

Mostrare lo stato seccomp del processo corrente:

```bash
grep '^Seccomp:' /proc/self/status
```

## Esempio pratico

Considerare un servizio web eseguito in un container. L'immagine contiene binario e dipendenze, mentre configurazione e segreti arrivano a runtime. Il processo ascolta sulla porta 8080 interna, che viene pubblicata solo quando serve.

Il database non deve essere salvato nel layer scrivibile del container. Si usa un volume dedicato, si definiscono limiti di memoria e processi, si rimuovono capability non necessarie e si mantiene il filesystem in sola lettura quando l'applicazione lo consente.

Durante un aggiornamento non si modifica manualmente il container esistente: si costruisce una nuova immagine, la si verifica, si sostituisce l'istanza e si conserva lo stato esterno. Questo rende il deployment ripetibile e riduce la divergenza tra ambienti.

## Varianti

- I container applicativi eseguono spesso un solo servizio principale.
- I system container imitano un sistema completo e possono avviare piu servizi.
- I container rootless mappano identita e risorse su un utente non privilegiato dell'host.
- Un sandboxed runtime puo aggiungere un kernel intermedio o un monitor per aumentare l'isolamento.
- Le VM offrono un kernel separato e sono preferibili quando serve un confine piu forte o un sistema operativo guest differente.
- I pod raggruppano container che condividono alcune risorse, spesso la rete.
- OCI standardizza i formati e le interfacce principali, ma non rende identici tutti gli engine.

## Errori comuni

- Confondere immagine e container o trattare il layer scrivibile come storage permanente.
- Usare tag mobili come `latest` senza controllare digest e provenienza.
- Inserire segreti nell'immagine o nei layer di build.
- Eseguire come root senza necessita e mantenere capability eccessive.
- Montare il socket dell'engine o directory sensibili dell'host nel container.
- Pubblicare porte su tutte le interfacce senza verificare firewall e rete.
- Ignorare segnali, PID 1 e timeout di arresto.
- Credere che rootless elimini ogni rischio di escalation o vulnerabilita kernel.
- Aggiornare manualmente un container invece di ricostruire l'immagine.

## Checklist

- L'immagine proviene da una fonte attendibile ed e identificata da versione o digest?
- Il processo usa un utente non privilegiato?
- Capability, seccomp e policy LSM sono restrittivi?
- Filesystem e mount espongono solo cio che serve?
- Dati persistenti, configurazioni e segreti sono esterni all'immagine?
- Limiti CPU, memoria e PIDs sono definiti e monitorati?
- Porte e network mode corrispondono all'esposizione prevista?
- Il processo principale gestisce segnali e shutdown?
- Esiste una strategia di rebuild, aggiornamento, rollback e backup?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Namespace|Namespace]]
- [[Linux/Pagine/Cgroups|Cgroups]]
- [[Linux/Pagine/Principio del minimo privilegio|Principio del minimo privilegio]]
- [[Linux/Pagine/AppArmor e SELinux|AppArmor e SELinux]]
- [[Linux/Pagine/Filesystem ext4 Btrfs e XFS|Filesystem ext4, Btrfs e XFS]]
- [[Linux/Pagine/Docker e Podman|Docker e Podman]]
- [[Linux/Pagine/KVM e QEMU|KVM e QEMU]]

## Fonti

- [Open Container Initiative](https://opencontainers.org/)
- [OCI Runtime Specification](https://github.com/opencontainers/runtime-spec)
- [OCI Image Specification](https://github.com/opencontainers/image-spec)
- [Linux man-pages - namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [Linux kernel - Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html)
