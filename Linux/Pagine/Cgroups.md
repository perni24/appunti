---
date: 2026-07-13
area: Linux
topic: Control group Linux
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, kernel, cgroup, risorse, systemd]
aliases: [Control groups, cgroup v2]
prerequisites: [Processi PID e segnali, Monitoraggio delle risorse, systemd]
related: [Namespace, Container, Unit e dipendenze systemd]
---

# Cgroups

## Sintesi

I control group, abbreviati in cgroup, organizzano i processi in una gerarchia sulla quale il kernel misura, distribuisce e limita risorse come CPU, memoria, I/O e numero di processi. I cgroup rispondono alla domanda "quante risorse puo usare questo gruppo?", mentre i namespace controllano soprattutto "che cosa puo vedere?".

Nei sistemi moderni e preferibile cgroup v2, che usa una gerarchia unificata. systemd costruisce e gestisce questa gerarchia attraverso slice, scope e service; modificare manualmente `/sys/fs/cgroup` su un sistema systemd puo entrare in conflitto con il gestore dei servizi.

## Quando usarlo

- Limitare memoria, CPU, I/O o numero di processi di un servizio.
- Contabilizzare le risorse consumate da un workload.
- Impedire che un processo esaurisca le risorse dell'intero host.
- Comprendere i limiti applicati a container e unit systemd.
- Creare ambienti temporanei con limiti riproducibili.

## Come funziona

Il kernel espone la gerarchia tramite il filesystem virtuale cgroup, normalmente montato in `/sys/fs/cgroup`. Ogni directory rappresenta un cgroup; i processi appartengono alla gerarchia e sono elencati in `cgroup.procs`.

In cgroup v2 i controller disponibili compaiono in `cgroup.controllers`, mentre il genitore abilita quelli delegabili ai figli tramite `cgroup.subtree_control`. File come `cpu.max`, `memory.max`, `memory.high`, `io.max` e `pids.max` configurano il comportamento del relativo controller.

Alcuni limiti hanno semantiche differenti:

- `memory.high` applica pressione e throttling senza essere un limite assoluto.
- `memory.max` e il limite rigido; se non e possibile recuperare memoria puo attivarsi l'OOM killer nel cgroup.
- `cpu.max` controlla quota e periodo, ma non riserva CPU esclusiva.
- `CPUWeight` distribuisce proporzionalmente CPU quando esiste contesa.
- `pids.max` limita i processi o thread contabilizzati dal controller PIDs.

La delega di un sottoalbero a un utente o runtime richiede ownership e confini corretti. Concedere scrittura indiscriminata sulla gerarchia puo permettere spostamenti di processi o alterazioni dei limiti non previste.

## API / Sintassi

Verificare il tipo di filesystem montato per cgroup:

```bash
stat -fc %T /sys/fs/cgroup
```

Con cgroup v2 il risultato atteso e `cgroup2fs`. Mostrare la gerarchia gestita da systemd:

```bash
systemd-cgls
```

Osservare l'uso delle risorse per cgroup:

```bash
systemd-cgtop
```

Mostrare il cgroup della shell corrente:

```bash
cat /proc/self/cgroup
```

Mostrare controller disponibili alla radice:

```bash
cat /sys/fs/cgroup/cgroup.controllers
```

Leggere le proprieta di risorsa di un servizio:

```bash
systemctl show nome.service --property=ControlGroup,MemoryCurrent,MemoryMax,CPUWeight,TasksCurrent,TasksMax
```

Eseguire un comando in uno scope temporaneo con limite di memoria:

```bash
systemd-run --user --scope --property=MemoryMax=512M comando
```

Eseguire un comando con peso CPU ridotto:

```bash
systemd-run --user --scope --property=CPUWeight=20 comando
```

## Esempio pratico

Avviare una shell temporanea con massimo 512 MiB di memoria e 100 processi:

```bash
systemd-run --user --scope --property=MemoryMax=512M --property=TasksMax=100 /bin/bash
```

Nella nuova shell, identificare il cgroup assegnato:

```bash
cat /proc/self/cgroup
```

Da un'altra shell, osservare consumo e gerarchia:

```bash
systemd-cgtop --user
```

Il limite non garantisce che un'allocazione fallisca in modo controllato: sotto forte pressione il kernel puo terminare processi del cgroup. L'applicazione deve quindi gestire correttamente errori, riavvii e persistenza dei dati.

## Varianti

- cgroup v1 usa gerarchie potenzialmente separate per controller ed e mantenuto per compatibilita.
- cgroup v2 offre una gerarchia unificata e una semantica di delega piu coerente.
- Le unit `service` raggruppano processi gestiti da systemd.
- Le unit `scope` raggruppano processi creati esternamente, come una sessione o un comando temporaneo.
- Le unit `slice` costruiscono la gerarchia di allocazione tra gruppi di unit.
- I runtime di container traducono opzioni di CPU e memoria in configurazioni cgroup.
- `systemd-run` e preferibile alla scrittura manuale nella gerarchia quando systemd ne e il proprietario.

## Errori comuni

- Confondere controllo delle risorse con isolamento di filesystem, PID o rete.
- Applicare solo `MemoryMax` senza considerare OOM, swap e comportamento dell'applicazione.
- Usare quote CPU come se fossero una garanzia di latenza.
- Modificare direttamente `/sys/fs/cgroup` sotto systemd e perdere la configurazione o creare conflitti.
- Dimenticare che thread e processi figli vengono contabilizzati secondo le regole del cgroup.
- Impostare limiti troppo bassi per startup, compilazione o picchi legittimi.
- Delegare un sottoalbero senza rispettare i vincoli di contenimento di cgroup v2.
- Presumere che tutte le distribuzioni abbiano gia disabilitato cgroup v1.

## Checklist

- Il sistema usa cgroup v2 o una configurazione ibrida?
- Quale processo o unit possiede il workload?
- Servono limiti rigidi, pesi relativi o entrambe le cose?
- Sono considerati picchi, cache, swap e OOM?
- Il limite PIDs lascia spazio ai thread necessari?
- systemd deve mantenere la configurazione in una unit persistente?
- Metriche e log permettono di distinguere throttling, OOM e crash applicativi?
- La delega e circoscritta al sottoalbero corretto?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Monitoraggio delle risorse|Monitoraggio delle risorse]]
- [[Linux/Pagine/systemd|systemd]]
- [[Linux/Pagine/Unit e dipendenze systemd|Unit e dipendenze systemd]]
- [[Linux/Pagine/Namespace|Namespace]]
- [[Linux/Pagine/Container|Container]]
- [[Linux/Pagine/Docker e Podman|Docker e Podman]]

## Fonti

- [Linux kernel - Control Group v2](https://docs.kernel.org/admin-guide/cgroup-v2.html)
- [Linux man-pages - cgroups(7)](https://man7.org/linux/man-pages/man7/cgroups.7.html)
- [systemd.resource-control](https://www.freedesktop.org/software/systemd/man/latest/systemd.resource-control.html)
- [systemd-run](https://www.freedesktop.org/software/systemd/man/latest/systemd-run.html)
