---
date: 2026-07-13
area: Linux
topic: Namespace del kernel Linux
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, kernel, namespace, isolamento, container]
aliases: [Linux namespaces, Namespace Linux]
prerequisites: [Processi PID e segnali, Principio del minimo privilegio]
related: [Cgroups, Container, Docker e Podman]
---

# Namespace

## Sintesi

I namespace sono una funzionalita del kernel Linux che presenta a un processo una vista isolata di determinate risorse globali. Processi in namespace differenti possono vedere PID, mount point, interfacce di rete, hostname o identita utente diversi pur usando lo stesso kernel.

Sono uno dei componenti fondamentali dei container, ma non costituiscono da soli un confine di sicurezza completo. L'isolamento robusto richiede anche cgroup, capability ridotte, filtri seccomp, permessi sul filesystem e policy AppArmor o SELinux.

## Quando usarlo

- Comprendere come un container separa processi e risorse dall'host.
- Ispezionare l'isolamento applicato a un processo.
- Eseguire test in una vista separata di mount, rete o PID.
- Entrare nei namespace di un processo per il troubleshooting.
- Progettare sandbox o runtime con privilegi minimi.

## Come funziona

Ogni processo appartiene a un namespace per ciascun tipo supportato. Le API `clone(2)`, `unshare(2)` e `setns(2)` permettono rispettivamente di creare un processo in nuovi namespace, separare il processo corrente o unirlo a namespace esistenti.

I tipi principali sono:

| Namespace | Isola principalmente |
| --- | --- |
| `mnt` | mount point e relativa propagazione |
| `pid` | numerazione e visibilita dei processi |
| `net` | interfacce, routing, firewall, porte e socket di rete |
| `uts` | hostname e nome di dominio NIS |
| `ipc` | IPC System V e code POSIX |
| `user` | UID, GID e capability |
| `cgroup` | vista della radice della gerarchia cgroup |
| `time` | alcuni clock di boot e monotonic |

Le entry in `/proc/PID/ns/` sono riferimenti ai namespace del processo. Due processi appartengono allo stesso namespace di un tipo quando i rispettivi link mostrano lo stesso identificatore. Un file descriptor aperto verso una di queste entry puo mantenere in vita il namespace anche dopo la terminazione dei processi che lo usavano.

Nel PID namespace, il primo processo visibile ha PID 1 e deve gestire segnali e processi figli orfani. Nel user namespace, UID 0 interno puo essere mappato su un UID non privilegiato esterno: essere `root` nel namespace non equivale a essere `root` sull'host.

## API / Sintassi

Elencare i namespace presenti nel sistema:

```bash
lsns
```

Mostrare i namespace della shell corrente:

```bash
ls -l /proc/self/ns
```

Confrontare i namespace di due processi:

```bash
readlink /proc/1/ns/pid
```

Creare una shell con hostname isolato:

```bash
sudo unshare --uts --fork /bin/bash
```

Creare una shell con user e mount namespace, mappando l'utente corrente come root interno:

```bash
unshare --user --map-root-user --mount --fork /bin/bash
```

Entrare nei namespace di un processo esistente:

```bash
sudo nsenter --target PID --mount --uts --ipc --net --pid
```

Mostrare le mappe UID e GID del processo corrente:

```bash
cat /proc/self/uid_map
```

## Esempio pratico

Aprire una shell con UTS namespace separato:

```bash
sudo unshare --uts --fork /bin/bash
```

Cambiare l'hostname visibile nella nuova shell:

```bash
hostname laboratorio
```

Verificare il risultato:

```bash
hostname
```

Da un'altra shell dell'host, l'hostname originale rimane invariato. Terminare la shell isolata:

```bash
exit
```

Questo esempio isola solo l'hostname. Processi, rete, filesystem e credenziali restano condivisi finche non vengono creati anche i relativi namespace.

## Varianti

- `unshare` crea nuovi namespace per un comando o per la shell corrente.
- `nsenter` entra nei namespace referenziati da un processo.
- `lsns` aggrega le informazioni esposte da procfs.
- Un bind mount di `/proc/PID/ns/TIPO` puo mantenere persistente un namespace.
- I container rootless usano user namespace e mappe subordinate definite in `/etc/subuid` e `/etc/subgid`.
- I network namespace vengono spesso collegati con coppie `veth`, bridge e routing configurato dall'host.

## Errori comuni

- Considerare un namespace una macchina virtuale: il kernel resta condiviso.
- Credere che un singolo namespace isoli tutte le risorse.
- Usare `unshare` con privilegi elevati senza capire quali risorse restano condivise.
- Confondere UID 0 interno con privilegi illimitati sull'host.
- Dimenticare che PID 1 in un PID namespace ha responsabilita speciali sui segnali e sui processi orfani.
- Montare procfs dell'host dentro un PID namespace e ottenere una vista incoerente dei processi.
- Esporre device, socket o directory sensibili che aggirano l'isolamento previsto.
- Usare namespace senza capability, seccomp e LSM per eseguire codice non attendibile.

## Checklist

- Quali risorse devono essere isolate?
- Quali namespace possiede realmente il processo?
- UID e GID interni sono mappati su identita esterne appropriate?
- Le capability sono state ridotte al minimo?
- Mount e propagazione non espongono dati dell'host?
- Rete e porte pubblicate rispettano il modello previsto?
- Seccomp e AppArmor o SELinux completano il confinamento?
- Il processo PID 1 gestisce segnali e processi figli?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Processi PID e segnali|Processi, PID e segnali]]
- [[Linux/Pagine/Principio del minimo privilegio|Principio del minimo privilegio]]
- [[Linux/Pagine/Cgroups|Cgroups]]
- [[Linux/Pagine/Container|Container]]
- [[Linux/Pagine/Docker e Podman|Docker e Podman]]
- [[Linux/Pagine/AppArmor e SELinux|AppArmor e SELinux]]

## Fonti

- [Linux man-pages - namespaces(7)](https://man7.org/linux/man-pages/man7/namespaces.7.html)
- [Linux man-pages - user_namespaces(7)](https://man7.org/linux/man-pages/man7/user_namespaces.7.html)
- [Linux man-pages - unshare(1)](https://man7.org/linux/man-pages/man1/unshare.1.html)
- [util-linux - lsns(8)](https://man7.org/linux/man-pages/man8/lsns.8.html)
- [util-linux - nsenter(1)](https://man7.org/linux/man-pages/man1/nsenter.1.html)
