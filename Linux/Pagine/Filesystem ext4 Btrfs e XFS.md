---
date: 2026-07-11
area: Linux
topic: Filesystem Linux
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, filesystem, ext4, btrfs, xfs]
aliases: [Confronto filesystem Linux, ext4 Btrfs XFS]
prerequisites: [Partizionamento dei dischi, Mount e umount]
related: [Controllo e riparazione filesystem, LVM, RAID software]
---

# Filesystem ext4, Btrfs e XFS

## Sintesi

ext4, Btrfs e XFS sono filesystem Linux con obiettivi diversi. ext4 privilegia maturità e semplicità operativa; XFS è progettato per scalabilità e workload paralleli; Btrfs usa copy-on-write e integra checksum, subvolumi, snapshot, compressione e gestione multi-device.

La scelta dipende da workload, procedure di backup, strumenti disponibili e competenze operative. Journaling, checksum e snapshot migliorano proprietà specifiche ma non sostituiscono copie indipendenti dei dati.

## Quando usarlo

- Scegliere il filesystem per un nuovo volume.
- Valutare crescita, riduzione e snapshot.
- Comprendere strumenti di manutenzione specifici.
- Pianificare workload con file grandi, molti piccoli file o compressione.
- Evitare procedure di riparazione appartenenti al filesystem sbagliato.

## Come funziona

| Caratteristica | ext4 | Btrfs | XFS |
| --- | --- | --- | --- |
| modello | journaling tradizionale | copy-on-write | journaling ad alta scalabilità |
| checksum dati | no | sì | no |
| checksum metadata | funzionalità disponibili | sì | sì nelle versioni moderne |
| snapshot nativi | no | subvolumi snapshot | no |
| crescita online | sì | sì | sì |
| riduzione | offline | online | non supportata |
| multi-device integrato | no | sì | no |

ext4 usa extent, block group e journal dei metadata nel modo predefinito. XFS usa allocation group per parallelismo e cresce online tramite `xfs_growfs`. Btrfs gestisce extent condivisi e checksum; una modifica produce nuovi blocchi anziché sovrascrivere immediatamente quelli referenziati.

Lo spazio Btrfs richiede la distinzione tra allocazione logica, chunk e profili di dati/metadata; il semplice `df` può non descrivere tutto il quadro.

## API / Sintassi

Mostrare tipo e opzioni del mount:

```bash
findmnt -no SOURCE,FSTYPE,OPTIONS --target /srv/dati
```

Mostrare informazioni di un ext4 non montato o identificato:

```bash
sudo tune2fs -l /dev/sdX1
```

Mostrare geometria e caratteristiche XFS montate:

```bash
xfs_info /srv/dati
```

Mostrare device e profili Btrfs:

```bash
sudo btrfs filesystem show /srv/dati
```

Mostrare utilizzo dettagliato Btrfs:

```bash
sudo btrfs filesystem usage /srv/dati
```

Creare ext4 su una partizione vuota verificata:

```bash
sudo mkfs.ext4 -L dati /dev/sdX1
```

Creare XFS su una partizione vuota verificata:

```bash
sudo mkfs.xfs -L dati /dev/sdX1
```

Creare Btrfs su una partizione vuota verificata:

```bash
sudo mkfs.btrfs -L dati /dev/sdX1
```

## Esempio pratico

Prima della formattazione, verificare target e firme:

```bash
lsblk -o NAME,PATH,SIZE,FSTYPE,LABEL,UUID,MOUNTPOINTS,MODEL,SERIAL
```

Controllare eventuali signature senza rimuoverle:

```bash
sudo wipefs --no-act /dev/sdX1
```

Scegliere poi un solo comando `mkfs` coerente con requisiti e piano di manutenzione. Ogni `mkfs` distrugge la struttura dati precedente sul target e non deve essere eseguito su un filesystem montato.

## Varianti

- ext4 può crescere online e ridursi offline, dopo controlli e riduzione del filesystem prima del contenitore.
- XFS cresce online ma non viene ridotto; per ridimensionare verso il basso serve normalmente creare un filesystem più piccolo e migrare i dati.
- Btrfs supporta subvolumi e snapshot, ma uno snapshot nello stesso filesystem condivide il dominio di guasto.
- `reflink` crea copie che condividono extent finché vengono modificati.
- La compressione Btrfs può ridurre I/O e spazio, ma il risultato dipende dai dati.
- LUKS, LVM e RAID possono essere collocati sopra o sotto il filesystem secondo l'architettura.

## Errori comuni

- Usare un comando `mkfs` sul device sbagliato o sul disco intero invece della partizione.
- Considerare snapshot Btrfs un backup indipendente.
- Pianificare la riduzione di XFS come se fosse ext4.
- Applicare `fsck` generico senza conoscere il backend e lo stato di mount.
- Confrontare spazio Btrfs soltanto con `df`.
- Abilitare opzioni di mount copiate senza comprenderne effetti e compatibilità.
- Scegliere il filesystem soltanto da benchmark non rappresentativi.

## Checklist

- Workload, dimensione, crescita e necessità di snapshot sono noti?
- Gli strumenti di recovery sono disponibili nell'ambiente di soccorso?
- La strategia di backup è indipendente dal filesystem?
- Crescita e possibile riduzione sono state pianificate?
- Kernel e tool user-space supportano le feature abilitate?
- Il device target è stato verificato prima di `mkfs`?
- Monitoraggio e manutenzione sono specifici del filesystem scelto?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Mount e umount|Mount e umount]]
- [[Linux/Pagine/Controllo e riparazione filesystem|Controllo e riparazione filesystem]]
- [[Linux/Pagine/LVM|LVM]]
- [[Linux/Pagine/RAID software|RAID software]]

## Fonti

- [Linux kernel - ext4](https://www.kernel.org/doc/html/latest/filesystems/ext4/)
- [Btrfs documentation](https://btrfs.readthedocs.io/)
- [Linux kernel - XFS](https://www.kernel.org/doc/html/latest/filesystems/xfs.html)
- [xfsprogs documentation](https://kernel.googlesource.com/pub/scm/fs/xfs/xfsprogs-dev/)
