---
date: 2026-07-11
area: Linux
topic: Mount filesystem
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, mount, umount, filesystem, storage]
aliases: [Montare filesystem, Smontare filesystem]
prerequisites: [Partizionamento dei dischi, Filesystem Hierarchy Standard]
related: [Configurazione di fstab, File directory e link]
---

# Mount e umount

## Sintesi

Montare un filesystem collega la sua radice a una directory dell'albero visibile al processo. Il mount point non copia dati: rende raggiungibile una diversa gerarchia. Smontare rimuove l'associazione dopo che gli utilizzatori hanno rilasciato file e directory.

Un mount sopra una directory non vuota nasconde temporaneamente i contenuti sottostanti senza cancellarli. I mount appartengono a un mount namespace, quindi container o processi diversi possono vedere alberi differenti.

## Quando usarlo

- Rendere accessibile un filesystem locale o remoto.
- Montare temporaneamente un disco per manutenzione.
- Creare bind mount tra percorsi.
- Cambiare opzioni di un mount esistente.
- Smontare in sicurezza prima di scollegare storage o eseguire riparazioni offline.

## Come funziona

`mount` richiede una sorgente, un target, un tipo e opzioni. Se esiste una voce in `/etc/fstab`, spesso basta indicare sorgente o mount point. Il kernel registra i mount per namespace; `findmnt` legge le informazioni correnti in forma più affidabile dell'analisi testuale dell'output di `mount`.

Opzioni comuni:

| Opzione | Effetto |
| --- | --- |
| `ro` / `rw` | sola lettura o lettura-scrittura |
| `noexec` | impedisce l'esecuzione diretta di binari dal mount |
| `nosuid` | ignora setuid e setgid |
| `nodev` | non interpreta device speciali |
| `noatime` | evita aggiornamenti di access time |
| `bind` | espone un percorso esistente in un altro punto |

Queste opzioni riducono alcune capacità ma non costituiscono da sole una sandbox completa.

## API / Sintassi

Mostrare filesystem e mount correnti:

```bash
findmnt
```

Mostrare filesystem rilevati sui device:

```bash
lsblk --fs
```

Creare un mount point:

```bash
sudo mkdir -p /mnt/dati
```

Montare esplicitamente una partizione:

```bash
sudo mount /dev/sdX1 /mnt/dati
```

Montare temporaneamente in sola lettura:

```bash
sudo mount -o ro /dev/sdX1 /mnt/dati
```

Verificare il mount point esatto:

```bash
findmnt --target /mnt/dati
```

Smontare tramite mount point:

```bash
sudo umount /mnt/dati
```

Creare un bind mount:

```bash
sudo mount --bind /srv/dati /mnt/dati
```

## Esempio pratico

Identificare UUID e tipo senza affidarsi al nome del device:

```bash
lsblk -o NAME,PATH,FSTYPE,LABEL,UUID,MOUNTPOINTS
```

Montare la partizione verificata:

```bash
sudo mount -o ro /dev/sdX1 /mnt/dati
```

Controllare sorgente, tipo e opzioni effettive:

```bash
findmnt -no SOURCE,FSTYPE,OPTIONS --target /mnt/dati
```

Prima di smontare, uscire dalla directory in tutte le shell e arrestare applicazioni che usano il filesystem:

```bash
sudo fuser -vm /mnt/dati
```

Smontare soltanto dopo aver risolto gli utilizzatori:

```bash
sudo umount /mnt/dati
```

## Varianti

- `mount -o remount,ro target` prova a cambiare opzioni del mount esistente.
- `mount --rbind` replica ricorsivamente un albero di mount; richiede attenzione alla propagazione.
- FUSE permette mount in user space con regole specifiche.
- `udisksctl` offre operazioni controllate per sessioni desktop.
- `umount --lazy` scollega subito il mount dall'albero e pulisce i riferimenti in seguito; non risolve la causa di un mount occupato.
- `umount --force` è destinato a casi e filesystem specifici, spesso remoti, e può comportare perdita di dati.

## Errori comuni

- Scollegare un device senza smontarlo e attendere il completamento delle scritture.
- Montare sopra una directory contenente dati e credere che siano spariti.
- Usare `umount -l` come soluzione abituale a `target is busy`.
- Confondere `/dev/sdX1` con un identificatore persistente.
- Supporre che `noexec` impedisca a un interprete di leggere uno script.
- Cercare il processo responsabile soltanto con il nome e non con `fuser` o strumenti equivalenti.
- Eseguire controlli offline su un filesystem ancora montato in scrittura.

## Checklist

- Sorgente, filesystem e UUID sono quelli attesi?
- Il mount point esiste ed è vuoto o consapevolmente coperto?
- Le opzioni effettive sono appropriate?
- Il mount deve essere temporaneo o persistente in `fstab`?
- Tutti i processi hanno rilasciato il filesystem prima di `umount`?
- Le scritture sono terminate prima di scollegare il device?
- Il mount appartiene al namespace atteso?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Partizionamento dei dischi|Partizionamento dei dischi]]
- [[Linux/Pagine/Configurazione di fstab|Configurazione di fstab]]
- [[Linux/Pagine/Filesystem ext4 Btrfs e XFS|Filesystem ext4, Btrfs e XFS]]

## Fonti

- [util-linux - mount(8)](https://man7.org/linux/man-pages/man8/mount.8.html)
- [util-linux - umount(8)](https://man7.org/linux/man-pages/man8/umount.8.html)
- [util-linux - findmnt(8)](https://man7.org/linux/man-pages/man8/findmnt.8.html)
- [Linux man-pages - mount_namespaces(7)](https://man7.org/linux/man-pages/man7/mount_namespaces.7.html)
