---
date: 2026-07-11
area: Linux
topic: RAID software Linux
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, raid, mdadm, storage, ridondanza]
aliases: [Linux MD RAID, mdadm]
prerequisites: [Partizionamento dei dischi, Monitoraggio delle risorse]
related: [LVM, Controllo e riparazione filesystem]
---

# RAID software

## Sintesi

Linux MD combina più dispositivi a blocchi in un array gestito dal kernel e amministrato normalmente con `mdadm`. I livelli RAID bilanciano capacità, prestazioni e tolleranza ai guasti, ma non proteggono da cancellazioni, corruzione logica, malware, errori amministrativi o perdita dell'intero sistema.

RAID aumenta disponibilità; non è un backup. La ricostruzione sollecita tutti i device superstiti e non garantisce il recupero se esistono errori latenti.

## Quando usarlo

- Continuare a operare dopo il guasto previsto di uno o più dischi.
- Aggregare throughput o capacità con un livello consapevole dei rischi.
- Costruire storage locale ridondato sotto LVM o filesystem.
- Monitorare e sostituire membri degradati.
- Eseguire scrub periodici dell'array.

## Come funziona

| Livello | Minimo | Capacità indicativa | Tolleranza |
| --- | --- | --- | --- |
| RAID 0 | 2 | somma dei device | nessun guasto |
| RAID 1 | 2 | dimensione del membro più piccolo | uno o più secondo le copie |
| RAID 5 | 3 | `(N-1) × minimo` | 1 membro |
| RAID 6 | 4 | `(N-2) × minimo` | 2 membri |
| RAID 10 | 4 | circa metà | dipende dalla disposizione delle copie |

L'array viene esposto come `/dev/md*`. Metadata sui membri descrivono UUID, livello e ruolo; l'assemblaggio deve basarsi su questi metadata, non soltanto sull'ordine dei nomi `/dev/sdX`.

Lo stato `degraded` significa che la ridondanza è ridotta. Un rebuild ricostruisce un nuovo membro usando i dati disponibili, ma non sostituisce una verifica del backup e della salute degli altri device.

## API / Sintassi

Mostrare lo stato sintetico degli array:

```bash
cat /proc/mdstat
```

Mostrare dettagli di un array:

```bash
sudo mdadm --detail /dev/md0
```

Esaminare metadata di un membro senza assemblarlo:

```bash
sudo mdadm --examine /dev/sdX1
```

Creare un RAID 1 su due partizioni vuote e verificate:

```bash
sudo mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdX1 /dev/sdY1
```

Marcare come guasto un membro già identificato:

```bash
sudo mdadm /dev/md0 --fail /dev/sdX1
```

Rimuovere il membro guasto dall'array:

```bash
sudo mdadm /dev/md0 --remove /dev/sdX1
```

Aggiungere un nuovo membro preparato:

```bash
sudo mdadm /dev/md0 --add /dev/sdZ1
```

Avviare un controllo dell'array tramite sysfs:

```bash
echo check | sudo tee /sys/block/md0/md/sync_action
```

## Esempio pratico

Quando arriva un allarme, registrare stato e identità dei membri:

```bash
sudo mdadm --detail /dev/md0
```

Controllare avanzamento di recovery o check:

```bash
cat /proc/mdstat
```

Verificare errori kernel e device nel boot corrente:

```bash
journalctl -k -b
```

Prima di rimuovere un membro, confrontare seriali fisici e percorsi:

```bash
lsblk -o NAME,PATH,SIZE,MODEL,SERIAL,TYPE,MOUNTPOINTS
```

La sequenza fail, remove e add va adattata al tipo di guasto. Se un device è scomparso, può non essere possibile marcarlo manualmente; non bisogna improvvisare `--force` senza comprendere gli event counter.

## Varianti

- RAID 0 aumenta capacità e throughput ma aumenta il rischio: basta un membro perso per compromettere l'array.
- RAID 1 replica blocchi; il numero di copie e membri determina la tolleranza effettiva.
- RAID 5 e 6 usano parità e richiedono policy per coerenza e write hole.
- RAID 10 combina striping e copie con layout configurabili.
- Bitmap e journal RAID possono ridurre il lavoro di resync dopo interruzioni.
- Btrfs e ZFS offrono gestione multi-device integrata con semantiche diverse da MD.

## Errori comuni

- Considerare RAID un backup.
- Creare l'array su device sbagliati o con dati non salvati.
- Sostituire il disco basandosi su `/dev/sdX` senza verificare seriale e slot.
- Ignorare un array degradato finché fallisce un altro membro.
- Usare dischi di dimensioni diverse senza comprendere capacità inutilizzata.
- Confondere scrub, rebuild e controllo del filesystem sovrastante.
- Forzare assembly o azzerare superblock senza aver salvato metadata e analizzato event counter.

## Checklist

- Livello, numero di membri e tolleranza soddisfano i requisiti?
- Device e seriali sono documentati?
- Notifiche e monitoraggio di `/proc/mdstat` sono attivi?
- Backup indipendente e ripristino sono stati testati?
- Scrub periodici e controllo degli errori hanno una procedura?
- Prima della sostituzione è stato verificato lo stato di tutti i membri?
- Filesystem, LVM e cifratura sovrastanti sono trattati come livelli separati?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/LVM|LVM]]
- [[Linux/Pagine/Partizionamento dei dischi|Partizionamento dei dischi]]
- [[Linux/Pagine/Controllo e riparazione filesystem|Controllo e riparazione filesystem]]
- [[Linux/Pagine/Monitoraggio delle risorse|Monitoraggio delle risorse]]

## Fonti

- [Linux kernel - MD](https://docs.kernel.org/admin-guide/md.html)
- [mdadm(8)](https://man7.org/linux/man-pages/man8/mdadm.8.html)
- [Linux RAID wiki](https://raid.wiki.kernel.org/)
