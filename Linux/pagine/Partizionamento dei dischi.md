---
date: 2026-07-11
area: Linux
topic: Partizionamento storage
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, storage, partizioni, gpt, mbr]
aliases: [Partizioni Linux, GPT e MBR]
prerequisites: [File directory e link, sudo e privilegi amministrativi]
related: [Mount e umount, Configurazione di fstab, LVM]
---

# Partizionamento dei dischi

## Sintesi

Il partizionamento divide un dispositivo a blocchi in intervalli descritti da una tabella. GPT è il formato moderno preferibile; MBR, chiamato anche DOS, mantiene compatibilità con sistemi più vecchi ma ha limiti maggiori.

Modificare una tabella può rendere inaccessibili tutti i dati del dispositivo. Prima di scrivere bisogna identificare modello, dimensione, seriale, mount, filesystem e dipendenze come LVM, RAID o cifratura.

## Quando usarlo

- Preparare un disco nuovo.
- Separare sistema, dati, swap o area EFI.
- Creare spazio per LVM, RAID o un filesystem.
- Ispezionare layout e allineamento esistenti.
- Correggere una tabella soltanto dopo backup e diagnosi.

## Come funziona

GPT conserva identificatori univoci, supporta molti entry e mantiene una copia secondaria della tabella. MBR usa quattro entry primarie, con eventuali partizioni estese, e indirizzamento storico più limitato.

Una partizione non è un filesystem: è un intervallo di blocchi che può contenere filesystem, swap, un physical volume LVM, un membro RAID o dati cifrati. Creare la partizione non formatta automaticamente il contenuto.

I nomi dipendono dal device: `/dev/sda1`, `/dev/nvme0n1p1` e `/dev/mmcblk0p1`. Non sono identità stabili; modello, seriale, `PARTUUID` e percorsi `/dev/disk/by-*` aiutano a verificare il target.

## API / Sintassi

Mostrare dispositivi, topologia, filesystem e mount:

```bash
lsblk -o NAME,PATH,SIZE,TYPE,FSTYPE,FSVER,LABEL,UUID,MOUNTPOINTS,MODEL,SERIAL
```

Mostrare tabelle e partizioni con `fdisk` senza modificarle:

```bash
sudo fdisk -l
```

Mostrare firme presenti su un dispositivo senza cancellarle:

```bash
sudo wipefs --no-act /dev/sdX
```

Aprire l'interfaccia interattiva di `fdisk` sul dispositivo verificato:

```bash
sudo fdisk /dev/sdX
```

Stampare il layout tramite GNU Parted:

```bash
sudo parted /dev/sdX print
```

Chiedere al kernel di rileggere la tabella dopo una modifica:

```bash
sudo partprobe /dev/sdX
```

Mostrare identificatori delle partizioni:

```bash
lsblk -o NAME,PARTTYPE,PARTLABEL,PARTUUID
```

## Esempio pratico

Prima di intervenire su un disco nuovo, identificarlo con campi espliciti:

```bash
lsblk -d -o NAME,PATH,SIZE,MODEL,SERIAL,TRAN
```

Controllare che non esistano mount attivi:

```bash
findmnt --source /dev/sdX
```

Verificare firme pregresse:

```bash
sudo wipefs --no-act /dev/sdX
```

Solo dopo backup e conferma del dispositivo si può usare un editor come `fdisk`. Prima del comando di scrittura, rileggere la tabella proposta nell'interfaccia e interrompere se dimensioni o device non coincidono.

## Varianti

- `fdisk` gestisce GPT e MBR ed è adatto a operazioni interattive comuni.
- `sfdisk` è orientato a output e input scriptabili, da usare con verifiche rigorose.
- GNU Parted gestisce anche layout e unità con un modello di comandi diverso.
- `gdisk` è specializzato in GPT e può aiutare in alcune conversioni o riparazioni.
- Un disco interamente dedicato a LVM o ZFS può essere usato senza partizioni, se boot e policy lo consentono.
- L'espansione di una partizione non espande automaticamente contenitore LVM o filesystem.

## Errori comuni

- Confondere `/dev/sda` con `/dev/sdb` dopo un riavvio o il collegamento di altri dischi.
- Partizionare un device che contiene mount, swap, RAID, LVM o cifratura attivi.
- Credere che eliminare e ricreare una partizione equivalga a ridimensionare in sicurezza i dati.
- Formattare la nuova partizione senza verificare la tabella riletta dal kernel.
- Usare settori o allineamenti manuali senza necessità.
- Rimuovere firme con `wipefs` pensando che cancelli soltanto etichette innocue.
- Procedere senza backup verificato e piano di ripristino.

## Checklist

- Modello, seriale, dimensione e trasporto identificano il disco corretto?
- Tutti i mount e gli utilizzatori del device sono stati individuati?
- Esiste un backup verificato?
- GPT o MBR sono coerenti con firmware e sistema di destinazione?
- Tipo, dimensione e allineamento delle partizioni sono corretti?
- Il kernel ha riletto la tabella?
- Il livello successivo, filesystem, LVM, RAID o swap, è stato pianificato separatamente?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Mount e umount|Mount e umount]]
- [[Linux/Pagine/Configurazione di fstab|Configurazione di fstab]]
- [[Linux/Pagine/LVM|LVM]]
- [[Linux/Pagine/RAID software|RAID software]]

## Fonti

- [util-linux - lsblk(8)](https://man7.org/linux/man-pages/man8/lsblk.8.html)
- [util-linux - fdisk(8)](https://man7.org/linux/man-pages/man8/fdisk.8.html)
- [util-linux - wipefs(8)](https://man7.org/linux/man-pages/man8/wipefs.8.html)
- [GNU Parted Manual](https://www.gnu.org/software/parted/manual/parted.html)
