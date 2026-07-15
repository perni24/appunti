---
date: 2026-07-11
area: Linux
topic: Early user space
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, initramfs, boot, dracut, mkinitcpio]
aliases: [Initial RAM filesystem, Early userspace]
prerequisites: [Processo di boot, Bootloader GRUB e systemd-boot]
related: [Moduli del kernel, LVM, Crittografia con LUKS]
---

# Initramfs

## Sintesi

L'initramfs è un filesystem temporaneo caricato in memoria insieme al kernel. Fornisce early user space: rileva storage, carica moduli, sblocca cifratura, assembla RAID o LVM e rende disponibile la root reale prima di eseguire lo switch root.

Il suo contenuto deve corrispondere al kernel e al layout di boot. Un kernel valido può fallire l'avvio se l'initramfs non contiene driver, firmware o configurazioni necessarie.

## Quando usarlo

- Diagnosticare root device non trovato.
- Includere driver necessari prima del mount della root.
- Aggiornare configurazione per LUKS, LVM o RAID.
- Ispezionare cosa viene caricato nell'early user space.
- Rigenerare immagini dopo modifiche supportate dalla distribuzione.

## Come funziona

Il bootloader carica kernel e archivio initramfs. Il kernel lo estrae in un rootfs temporaneo ed esegue `/init`. Gli hook o moduli del generatore preparano device e mount, quindi trasferiscono il controllo al sistema reale.

Generatori comuni:

| Famiglia | Strumento tipico |
| --- | --- |
| Debian/Ubuntu | `update-initramfs`, basato su initramfs-tools |
| Fedora/RHEL | `dracut` |
| Arch Linux | `mkinitcpio` o dracut secondo installazione |

Immagini host-only contengono quanto rilevato per la macchina; immagini più generiche includono più driver e risultano più portabili ma più grandi.

## API / Sintassi

Mostrare immagini installate:

```bash
ls -lh /boot/initr* /boot/initramfs*
```

Ispezionare un'immagine dracut:

```bash
lsinitrd /boot/initramfs-$(uname -r).img
```

Ispezionare un'immagine mkinitcpio:

```bash
lsinitcpio /boot/initramfs-linux.img
```

Elencare componenti con initramfs-tools:

```bash
lsinitramfs /boot/initrd.img-$(uname -r)
```

Rigenerare l'immagine corrente con dracut:

```bash
sudo dracut --force
```

Rigenerare preset mkinitcpio:

```bash
sudo mkinitcpio -P
```

Aggiornare tutte le immagini gestite da initramfs-tools:

```bash
sudo update-initramfs -u -k all
```

## Esempio pratico

Confrontare kernel in esecuzione e file in `/boot`:

```bash
uname -r
```

Verificare la presenza del modulo storage nell'immagine con lo strumento della distribuzione. Dopo la rigenerazione, controllare che timestamp e dimensione siano plausibili:

```bash
ls -lh /boot
```

Mantenere una vecchia immagine avviabile finché quella nuova non è stata provata.

## Varianti

- Microcode CPU può essere integrato o caricato come immagine separata.
- Unified Kernel Image può incorporare initrd, kernel e command line.
- Dracut usa moduli; mkinitcpio usa hook e preset; initramfs-tools usa hook e script propri.
- Resume da ibernazione può richiedere parametri e componenti nell'initramfs.
- Root di rete, iSCSI e storage avanzato richiedono moduli specifici.
- Una emergency shell nell'initramfs permette di ispezionare device e command line prima dello switch root.

## Errori comuni

- Eseguire il comando di un'altra distribuzione o generatore.
- Rigenerare mentre `/boot` o ESP corretti non sono montati.
- Rimuovere l'immagine precedente prima del test.
- Aggiungere un modulo al sistema reale ma non all'initramfs.
- Confondere initramfs con la root definitiva.
- Ignorare errori e warning del generatore.
- Aggiornare l'immagine ma lasciare il bootloader puntato a un altro file.

## Checklist

- Quale generatore possiede le immagini?
- Kernel, initramfs e entry del bootloader corrispondono?
- `/boot` e ESP corretti sono montati?
- Driver e strumenti necessari alla root sono presenti?
- La rigenerazione termina senza errori?
- Esiste una immagine precedente funzionante?
- Il nuovo boot è stato verificato prima della pulizia?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Processo di boot|Processo di boot]]
- [[Linux/Pagine/Bootloader GRUB e systemd-boot|Bootloader GRUB e systemd-boot]]
- [[Linux/Pagine/Moduli del kernel|Moduli del kernel]]
- [[Linux/Pagine/LVM|LVM]]

## Fonti

- [Linux kernel - initramfs](https://docs.kernel.org/filesystems/ramfs-rootfs-initramfs.html)
- [dracut documentation](https://dracut-ng.github.io/dracut-ng/)
- [mkinitcpio](https://man.archlinux.org/man/mkinitcpio.8)
- [initramfs-tools](https://manpages.debian.org/initramfs-tools/update-initramfs.8.en.html)
