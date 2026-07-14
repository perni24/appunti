---
date: 2026-07-11
area: Linux
topic: Logical Volume Manager
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, lvm, storage, volumi, snapshot]
aliases: [Logical Volume Manager, Volumi logici Linux]
prerequisites: [Partizionamento dei dischi, Filesystem ext4 Btrfs e XFS]
related: [RAID software, Mount e umount]
---

# LVM

## Sintesi

LVM inserisce un livello flessibile tra dispositivi a blocchi e filesystem. I physical volume, PV, vengono aggregati in volume group, VG; lo spazio del VG viene assegnato a logical volume, LV, esposti come device su cui creare filesystem o altri contenuti.

LVM facilita crescita, migrazione e snapshot, ma non crea ridondanza da solo. Un VG su un singolo disco mantiene il medesimo punto di guasto del disco.

## Quando usarlo

- Suddividere capacità senza dipendere rigidamente dalle partizioni.
- Espandere volumi usando spazio libero del VG.
- Aggregare più device sotto una gestione comune.
- Spostare extent tra physical volume.
- Creare snapshot coerenti con procedure applicative adeguate.

## Come funziona

| Livello | Esempio | Funzione |
| --- | --- | --- |
| PV | `/dev/sdb1` | device inizializzato per LVM |
| VG | `vg_dati` | pool di extent provenienti dai PV |
| LV | `lv_archivio` | device virtuale allocato dal VG |
| filesystem | ext4, XFS | struttura dati creata sul LV |

Il percorso può apparire come `/dev/vg_dati/lv_archivio` e corrisponde a un device mapper. Estendere un LV aumenta il contenitore a blocchi; il filesystem sovrastante deve essere espanso separatamente o tramite opzioni integrate consapevolmente.

Ridurre richiede l'ordine opposto: prima il filesystem, se supporta la riduzione, poi il LV. XFS non può essere ridotto. Un errore di ordine può troncare dati.

## API / Sintassi

Mostrare physical volume:

```bash
sudo pvs
```

Mostrare volume group e spazio libero:

```bash
sudo vgs
```

Mostrare logical volume e device sottostanti:

```bash
sudo lvs -a -o +devices
```

Inizializzare una partizione vuota verificata come PV:

```bash
sudo pvcreate /dev/sdX1
```

Creare un VG dal PV:

```bash
sudo vgcreate vg_dati /dev/sdX1
```

Creare un LV da 100 GiB:

```bash
sudo lvcreate -L 100G -n lv_archivio vg_dati
```

Estendere il LV di 20 GiB:

```bash
sudo lvextend -L +20G /dev/vg_dati/lv_archivio
```

Espandere ext4 dopo il LV:

```bash
sudo resize2fs /dev/vg_dati/lv_archivio
```

Espandere XFS usando il mount point:

```bash
sudo xfs_growfs /srv/archivio
```

## Esempio pratico

Verificare la catena dei device prima di modificare capacità:

```bash
lsblk -o NAME,TYPE,SIZE,FSTYPE,MOUNTPOINTS
```

Controllare spazio libero nel VG:

```bash
sudo vgs -o vg_name,vg_size,vg_free
```

Estendere il logical volume senza coinvolgere automaticamente il filesystem:

```bash
sudo lvextend -L +20G /dev/vg_dati/lv_archivio
```

Identificare il filesystem:

```bash
findmnt -no FSTYPE,TARGET /dev/vg_dati/lv_archivio
```

Applicare quindi lo strumento di crescita specifico. Il backup resta necessario: LVM modifica metadata e geometria, mentre il tool del filesystem modifica le proprie strutture.

## Varianti

- `lvextend -r` prova a ridimensionare anche il filesystem tramite `fsadm` o strumenti supportati.
- Thin pool e thin volume allocano spazio fisico su richiesta, ma richiedono monitoraggio rigoroso di dati e metadata.
- Snapshot classici consumano spazio man mano che l'origine cambia; se esauriscono l'area diventano inutilizzabili.
- `pvmove` migra extent tra PV mantenendo attivi molti workload, con costi e rischi operativi.
- LVM può essere sopra RAID software o sotto alcuni altri livelli, secondo requisiti di ridondanza e gestione.
- `vgcfgbackup` salva metadata LVM, non i dati dei logical volume.

## Errori comuni

- Eseguire `pvcreate` su una partizione contenente dati.
- Confondere spazio libero del filesystem con `VFree` del volume group.
- Estendere il LV e aspettarsi che ogni filesystem cresca automaticamente.
- Ridurre il LV prima del filesystem.
- Trattare snapshot LVM come backup di lunga durata.
- Lasciare esaurire thin pool o metadata pool.
- Aggiungere un secondo disco al VG senza considerare che la perdita di un PV può compromettere più LV.

## Checklist

- La catena device, RAID, cifratura, PV, VG, LV e filesystem è documentata?
- Esiste spazio libero reale nel VG?
- Il filesystem supporta l'operazione richiesta e in quale stato di mount?
- L'ordine di ridimensionamento è corretto?
- Backup e metadata LVM sono disponibili?
- Snapshot e thin pool hanno monitoraggio e soglie?
- Il layout offre la ridondanza attesa oppure soltanto flessibilità?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Partizionamento dei dischi|Partizionamento dei dischi]]
- [[Linux/Pagine/Filesystem ext4 Btrfs e XFS|Filesystem ext4, Btrfs e XFS]]
- [[Linux/Pagine/RAID software|RAID software]]
- [[Linux/Pagine/Mount e umount|Mount e umount]]

## Fonti

- [LVM2 documentation](https://docs.kernel.org/admin-guide/device-mapper/)
- [Red Hat - LVM administration](https://docs.redhat.com/en/documentation/red_hat_enterprise_linux/9/html/configuring_and_managing_logical_volumes/)
- [lvm(8)](https://man7.org/linux/man-pages/man8/lvm.8.html)
- [lvextend(8)](https://man7.org/linux/man-pages/man8/lvextend.8.html)
