---
date: 2026-07-11
area: Linux
topic: Manutenzione filesystem
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, filesystem, fsck, e2fsck, xfs-repair, btrfs]
aliases: [Riparazione filesystem, Controllo filesystem Linux]
prerequisites: [Filesystem ext4 Btrfs e XFS, Mount e umount]
related: [RAID software, Monitoraggio delle risorse]
---

# Controllo e riparazione filesystem

## Sintesi

Il controllo di un filesystem deve usare lo strumento specifico e lo stato di mount richiesto. `fsck` è un dispatcher verso programmi come `fsck.ext4`; XFS e Btrfs seguono flussi differenti. Una riparazione modifica metadata e può scartare strutture irrecuperabili, quindi backup o immagine del device vengono prima dell'intervento.

Prima di attribuire il problema al filesystem bisogna verificare hardware, cavi, controller, RAID e memoria. Riparare ripetutamente corruzioni causate da un device guasto peggiora la situazione.

## Quando usarlo

- Dopo errori di mount o segnalazioni di corruzione.
- Per verifiche programmate supportate dal filesystem.
- Dopo shutdown anomali quando il sistema richiede un controllo.
- Per distinguere checksum error da danni strutturali.
- Durante recovery da ambiente esterno o rescue mode.

## Come funziona

| Filesystem | Controllo principale | Stato tipico |
| --- | --- | --- |
| ext4 | `e2fsck` | smontato |
| XFS | `xfs_scrub` online, `xfs_repair` offline | dipende dall'operazione |
| Btrfs | `btrfs scrub` online, `btrfs check` strutturale | scrub montato, check preferibilmente smontato |

Il journal accelera il ripristino della coerenza dei metadata dopo un crash, ma non sostituisce un controllo in presenza di danni o hardware difettoso.

`btrfs scrub` legge dati e metadata, verifica checksum e può usare copie ridondanti corrette; non è un fsck strutturale. `btrfs check --repair` è un'operazione rischiosa da usare soltanto con indicazioni esperte e backup.

## API / Sintassi

Mostrare quale backend `fsck` verrebbe chiamato senza eseguirlo:

```bash
sudo fsck -N /dev/sdX1
```

Verificare ext4 smontato senza applicare modifiche automatiche:

```bash
sudo e2fsck -f -n /dev/sdX1
```

Controllare XFS montato con gli strumenti disponibili:

```bash
sudo xfs_scrub /srv/dati
```

Analizzare XFS smontato senza modificare:

```bash
sudo xfs_repair -n /dev/sdX1
```

Avviare uno scrub Btrfs online in foreground:

```bash
sudo btrfs scrub start -Bd /srv/dati
```

Mostrare lo stato dell'ultimo scrub Btrfs:

```bash
sudo btrfs scrub status /srv/dati
```

Controllare strutture Btrfs in sola lettura su un device smontato:

```bash
sudo btrfs check --readonly /dev/sdX1
```

Mostrare errori I/O e filesystem del boot corrente:

```bash
journalctl -k -b -p warning
```

## Esempio pratico

Identificare l'intera catena storage:

```bash
lsblk -o NAME,PATH,TYPE,SIZE,FSTYPE,MOUNTPOINTS,MODEL,SERIAL
```

Verificare se il filesystem è montato:

```bash
findmnt --source /dev/sdX1
```

Raccogliere errori kernel prima di modificare metadata:

```bash
journalctl -k -b
```

Eseguire inizialmente una modalità non modificante specifica del filesystem. Se vengono confermati danni, creare un'immagine quando possibile, verificare backup e consultare la documentazione dello strumento prima della riparazione effettiva.

## Varianti

- `e2fsck -p` ripara automaticamente soltanto problemi considerati sicuri; altre modalità richiedono decisioni diverse.
- Il filesystem root si controlla normalmente da initramfs, rescue system o altro ambiente in cui non è montato in scrittura.
- `xfs_repair` ricostruisce metadata offline; opzioni come `-L` possono perdere aggiornamenti metadata e non vanno usate alla cieca.
- Btrfs offre comandi `rescue`, restore e immagini metadata per scenari specifici.
- Uno scrub RAID verifica coerenza dell'array, non quella del filesystem.
- SMART e diagnostica NVMe aiutano a individuare problemi hardware, ma un esito positivo non garantisce l'assenza di guasti.

## Errori comuni

- Eseguire `fsck` su un filesystem montato in lettura-scrittura.
- Usare `fsck -y` senza backup e senza leggere gli errori.
- Lanciare `btrfs check --repair` come primo tentativo.
- Usare `xfs_repair -L` soltanto perché la modalità normale segnala il log.
- Confondere scrub di checksum, rebuild RAID e riparazione strutturale.
- Ignorare errori hardware e continuare a scrivere sul device.
- Riparare l'unica copia invece di lavorare su clone o immagine quando possibile.

## Checklist

- Device, filesystem e livelli sottostanti sono identificati?
- Il filesystem è nello stato di mount richiesto?
- Log kernel e salute hardware sono stati raccolti?
- Esiste un backup verificato o un'immagine del device?
- È stata eseguita prima una modalità read-only o no-modify?
- Lo strumento appartiene esattamente al filesystem?
- Le opzioni distruttive sono motivate dalla documentazione o da assistenza esperta?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Filesystem ext4 Btrfs e XFS|Filesystem ext4, Btrfs e XFS]]
- [[Linux/Pagine/Mount e umount|Mount e umount]]
- [[Linux/Pagine/RAID software|RAID software]]
- [[Linux/Pagine/Monitoraggio delle risorse|Monitoraggio delle risorse]]

## Fonti

- [fsck(8)](https://man7.org/linux/man-pages/man8/fsck.8.html)
- [e2fsck(8)](https://man7.org/linux/man-pages/man8/e2fsck.8.html)
- [xfs_scrub(8)](https://man7.org/linux/man-pages/man8/xfs_scrub.8.html)
- [xfs_repair(8)](https://man7.org/linux/man-pages/man8/xfs_repair.8.html)
- [Btrfs scrub](https://btrfs.readthedocs.io/en/latest/Scrub.html)
- [Btrfs check](https://btrfs.readthedocs.io/en/latest/btrfs-check.html)
