---
date: 2026-07-11
area: Linux
topic: Monitoraggio sistema
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, monitoraggio, cpu, memoria, io, processi]
aliases: [Monitoraggio Linux, Risorse di sistema]
prerequisites: [Processi PID e segnali, Filesystem Hierarchy Standard]
related: [Logging con journalctl, Diagnostica spazio disco]
---

# Monitoraggio delle risorse

## Sintesi

Monitorare Linux significa correlare CPU, memoria, pressione I/O, storage, rete e singoli processi. Un valore isolato raramente basta: servono andamento nel tempo, baseline del sistema e comprensione della metrica.

Il load average non è una percentuale CPU. Su Linux rappresenta il numero medio di task eseguibili o in attesa non interrompibile negli ultimi 1, 5 e 15 minuti; va interpretato insieme al numero di CPU logiche e alle metriche I/O.

## Quando usarlo

- Individuare un processo che consuma CPU o memoria.
- Capire se un rallentamento deriva da CPU, RAM, swap o storage.
- Verificare capacità e spazio disponibile.
- Raccogliere una fotografia diagnostica prima di intervenire.
- Confrontare il comportamento attuale con una baseline.

## Come funziona

Metriche principali:

| Area | Indicatori utili | Attenzione |
| --- | --- | --- |
| CPU | utilizzo per CPU, run queue, context switch | distinguere user, system, iowait e steal |
| Memoria | `MemAvailable`, RSS, cache, swap | memoria usata include cache recuperabile |
| Storage | latenza, throughput, coda, spazio e inode | `df` e `du` misurano aspetti diversi |
| Processi | CPU, RSS, stato, thread, file aperti | un picco istantaneo può essere normale |
| Rete | byte, errori, drop, socket | separare saturazione da errori di protocollo |

`VSZ` è lo spazio di indirizzamento virtuale e non equivale alla RAM fisica usata. `RSS` misura pagine residenti, ma può contare memoria condivisa in più processi. Per decisioni importanti servono metriche proporzionali o strumenti specifici.

La memoria `available` è generalmente più significativa di `free`: il kernel usa RAM inutilizzata come cache e può recuperarla quando necessario.

## API / Sintassi

Mostrare uptime e load average:

```bash
uptime
```

Mostrare CPU logiche e topologia:

```bash
lscpu
```

Osservare processi e risorse in tempo reale:

```bash
top
```

Mostrare memoria e swap in unità leggibili:

```bash
free -h
```

Campionare CPU, processi, memoria e I/O ogni secondo:

```bash
vmstat 1
```

Ordinare i processi per consumo CPU:

```bash
ps -eo pid,user,stat,%cpu,%mem,rss,cmd --sort=-%cpu
```

Mostrare utilizzo dei filesystem:

```bash
df -hT
```

Mostrare utilizzo degli inode:

```bash
df -ih
```

Stimare lo spazio occupato dalle directory immediate:

```bash
du -xhd1 /var
```

Mostrare statistiche delle interfacce di rete:

```bash
ip -s link
```

## Esempio pratico

Registrare una prima fotografia del carico:

```bash
uptime
```

Verificare se la memoria disponibile o lo swap indicano pressione:

```bash
free -h
```

Osservare run queue, swap e attesa I/O con più campioni:

```bash
vmstat 1 10
```

Identificare i processi con più memoria residente:

```bash
ps -eo pid,user,%mem,rss,etime,cmd --sort=-rss
```

Controllare spazio e inode prima di cancellare dati:

```bash
df -hT
```

La diagnosi deve cercare correlazioni: per esempio load elevato, CPU poco occupata e molti task in stato `D` suggeriscono di verificare storage o altri I/O, non di attribuire automaticamente il problema alla CPU.

## Varianti

- `htop` offre una vista interattiva più accessibile, ma può non essere installato.
- `iostat -xz 1` del pacchetto sysstat analizza i device a blocchi.
- `pidstat` campiona CPU, memoria, I/O e context switch per processo.
- `sar` conserva e consulta serie storiche se la raccolta sysstat è configurata.
- `ss` osserva socket; `nstat` e `ethtool -S` aggiungono contatori di rete.
- PSI in `/proc/pressure/` misura il tempo perso per contesa di CPU, memoria e I/O.
- Cgroup e systemd espongono metriche per gruppi di processi e servizi.

## Errori comuni

- Interpretare il load average come percentuale di utilizzo CPU.
- Considerare la cache come memoria sprecata o indisponibile.
- Confrontare il load tra macchine senza considerare CPU logiche e workload.
- Usare un solo campione e dedurre una tendenza.
- Confondere `df`, che interroga il filesystem, con `du`, che percorre file accessibili.
- Liberare cache manualmente come soluzione abituale a problemi di memoria.
- Terminare il primo processo in cima a `top` senza verificare ruolo e durata del carico.

## Checklist

- Qual è il sintomo osservato e da quanto dura?
- Esiste una baseline o un periodo normale di confronto?
- CPU, memoria, I/O e rete sono stati controllati insieme?
- Sono stati raccolti più campioni?
- `MemAvailable`, swap in/out e PSI indicano pressione reale?
- Spazio, inode e file cancellati ma aperti sono stati distinti?
- Il processo sospetto appartiene a un servizio o cgroup gestito?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Processi PID e segnali|Processi, PID e segnali]]
- [[Linux/Pagine/Logging con journalctl|Logging con journalctl]]
- [[Linux/Pagine/systemd|systemd]]

## Fonti

- [Linux man-pages - proc_loadavg(5)](https://man7.org/linux/man-pages/man5/proc_loadavg.5.html)
- [Linux man-pages - proc_meminfo(5)](https://man7.org/linux/man-pages/man5/proc_meminfo.5.html)
- [procps-ng - documentazione ufficiale](https://gitlab.com/procps-ng/procps)
- [Linux kernel - PSI](https://docs.kernel.org/accounting/psi.html)
