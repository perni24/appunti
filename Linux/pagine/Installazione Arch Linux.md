---
date: 2026-07-11
area: Linux
topic: Arch Linux
type: operational-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, arch-linux, installazione, uefi, grub]
aliases: [Installazione Arch Linux, Installare Arch Linux]
prerequisites: [UEFI, partizionamento, filesystem, rete]
related: [Gestione utenti, Indice Linux]
---

# Installazione Arch Linux

## Obiettivo

Installare manualmente Arch Linux su un computer `x86_64` avviato in modalità UEFI, usando una partizione EFI, un filesystem root `ext4`, NetworkManager e GRUB.

La procedura cancella o modifica partizioni. Prima di eseguire qualsiasi comando, identifica con certezza il disco di destinazione e conserva un backup verificato dei dati importanti.

## Quando usarlo

- Installazione pulita su un disco dedicato.
- Macchina virtuale configurata con firmware UEFI.
- Sistema di laboratorio sul quale vuoi comprendere ogni passaggio.
- Recupero guidato tramite ambiente live e `arch-chroot`.

Per dual boot, cifratura LUKS, RAID, LVM o Btrfs servono adattamenti specifici: non applicare automaticamente lo schema di esempio.

## Procedura

### 1. Preparare e avviare il supporto

Scarica l'immagine dal sito ufficiale, verifica firma o checksum e crea il supporto di avvio. Dopo il boot dell'ambiente live:

Imposta temporaneamente la tastiera italiana:

```bash
loadkeys it
```

Verifica la modalità di avvio del supporto:

```bash
cat /sys/firmware/efi/fw_platform_size
```

Il comando deve indicare un ambiente UEFI, normalmente `64`. Se il percorso non esiste, il supporto potrebbe essere stato avviato in modalità BIOS/CSM.

### 2. Verificare rete e orologio

Per Ethernet il DHCP dell'ambiente live normalmente funziona senza configurazione. Per Wi-Fi usa `iwctl`.

Elenca le interfacce di rete:

```bash
ip link
```

Verifica la connettività Internet:

```bash
ping -c 3 archlinux.org
```

Controlla sincronizzazione e fuso orario dell'ambiente live:

```bash
timedatectl status
```

L'ambiente installato non eredita automaticamente i servizi di rete attivi nella ISO: il gestore di rete va installato e abilitato nel nuovo sistema.

### 3. Identificare e partizionare il disco

Mostra dischi, filesystem e mount point in forma leggibile:

```bash
lsblk -o NAME,SIZE,TYPE,FSTYPE,MOUNTPOINTS,MODEL
```

Visualizza anche le tabelle delle partizioni:

```bash
fdisk -l
```

Apri il disco corretto con `cfdisk`, `fdisk` o `parted`:

```bash
cfdisk /dev/nvme0n1
```

Esempio GPT minimale per UEFI:

| Partizione | Dimensione indicativa | Tipo | Mount point |
| --- | ---: | --- | --- |
| EFI System Partition | 1 GiB | EFI System | `/boot` |
| Root | spazio restante | Linux filesystem | `/` |

La swap può essere una partizione oppure un file creato dopo l'installazione. I nomi reali possono essere `/dev/sda1`, `/dev/nvme0n1p1` o altro: non copiare i placeholder senza verificarli.

### 4. Formattare e montare

Nell'esempio seguente sostituisci i dispositivi con quelli ottenuti da `lsblk`:

Formatta la EFI System Partition in FAT32:

```bash
mkfs.fat -F 32 /dev/nvme0n1p1
```

Formatta la partizione root in ext4:

```bash
mkfs.ext4 /dev/nvme0n1p2
```

Monta la root del nuovo sistema:

```bash
mount /dev/nvme0n1p2 /mnt
```

Crea `/mnt/boot` e monta la partizione EFI:

```bash
mount --mkdir /dev/nvme0n1p1 /mnt/boot
```

Controlla il risultato prima di proseguire:

```bash
findmnt /mnt
```

`mkfs` distrugge il filesystem precedente sulla partizione indicata. Interrompi la procedura se il dispositivo non è certo.

### 5. Installare il sistema base

```bash
pacstrap -K /mnt \
  base linux linux-firmware \
  networkmanager sudo nano \
  man-db man-pages texinfo \
  grub efibootmgr
```

Su CPU Intel aggiungi il relativo microcode:

```bash
pacstrap -K /mnt intel-ucode
```

Su CPU AMD usa invece:

```bash
pacstrap -K /mnt amd-ucode
```

### 6. Generare fstab

Genera `fstab` usando gli UUID:

```bash
genfstab -U /mnt >> /mnt/etc/fstab
```

Leggi il file generato:

```bash
cat /mnt/etc/fstab
```

Controlla che root ed EFI compaiano una sola volta e con i mount point corretti.

### 7. Entrare nel nuovo sistema

```bash
arch-chroot /mnt
```

Da questo punto i comandi operano sul sistema installato.

### 8. Configurare orario, locale e tastiera

Imposta il fuso orario:

```bash
ln -sf /usr/share/zoneinfo/Europe/Rome /etc/localtime
```

Sincronizza l'orologio hardware:

```bash
hwclock --systohc
```

Apri l'elenco delle locale disponibili:

```bash
nano /etc/locale.gen
```

Decommenta almeno:

```text
it_IT.UTF-8 UTF-8
```

Poi genera la locale e configura lingua e tastiera console:

Genera le locale decommentate:

```bash
locale-gen
```

Imposta la lingua predefinita:

```bash
echo 'LANG=it_IT.UTF-8' > /etc/locale.conf
```

Rendi persistente la tastiera italiana nella console:

```bash
echo 'KEYMAP=it' > /etc/vconsole.conf
```

### 9. Configurare hostname e rete

Imposta il nome della macchina:

```bash
echo 'mio-arch' > /etc/hostname
```

Abilita NetworkManager per i boot successivi:

```bash
systemctl enable NetworkManager
```

Usa un hostname composto da lettere minuscole, cifre e trattini.

### 10. Impostare account e sudo

Imposta la password di root:

```bash
passwd
```

Crea l'utente aggiungendolo al gruppo amministrativo `wheel`:

```bash
useradd -m -G wheel -s /bin/bash luca
```

Assegna una password all'utente:

```bash
passwd luca
```

Configura il gruppo `wheel` tramite un file dedicato validato da `visudo`:

```bash
EDITOR=nano visudo /etc/sudoers.d/10-wheel
```

Contenuto:

```sudoers
%wheel ALL=(ALL:ALL) ALL
```

Non modificare `sudoers` con un editor normale: un errore sintattico può rendere inutilizzabile `sudo`.

### 11. Gestire initramfs quando necessario

L'installazione del kernel tramite `pacstrap` esegue normalmente `mkinitcpio`. Rigenera l'immagine solo se hai modificato `/etc/mkinitcpio.conf` o usi cifratura, LVM, RAID o hook aggiuntivi:

```bash
mkinitcpio -P
```

### 12. Installare GRUB in UEFI

Questa procedura presuppone che la EFI System Partition sia montata su `/boot`:

```bash
grub-install \
  --target=x86_64-efi \
  --efi-directory=/boot \
  --bootloader-id=GRUB
```

Genera separatamente il file di configurazione di GRUB:

```bash
grub-mkconfig -o /boot/grub/grub.cfg
```

Verifica che non vengano segnalati errori e che kernel e initramfs siano presenti in `/boot`.

### 13. Uscire e riavviare

Esci dal chroot:

```bash
exit
```

Smonta ricorsivamente i filesystem sotto `/mnt`:

```bash
umount -R /mnt
```

Riavvia la macchina:

```bash
reboot
```

Rimuovi il supporto live e accedi con l'utente creato.

## Snippet

Controlla i mount attivi:

```bash
findmnt
```

Controlla la configurazione persistente dei mount:

```bash
cat /etc/fstab
```

Verifica i file installati nella partizione di boot:

```bash
ls -la /boot
```

Verifica che NetworkManager sia abilitato:

```bash
systemctl is-enabled NetworkManager
```

Controlla gruppi e UID dell'utente:

```bash
id luca
```

Valida infine la configurazione sudo:

```bash
visudo -c
```

## Adattamenti comuni

- **Btrfs**: definisci subvolume e opzioni di mount prima di generare `fstab`.
- **LUKS**: configura cifratura, hook initramfs e parametri kernel prima del bootloader.
- **Dual boot**: conserva la ESP esistente e non formattarla senza averne verificato il contenuto.
- **systemd-boot**: alternativa a GRUB per sistemi UEFI, con configurazione differente.
- **Swap file**: può essere creato dopo il primo boot; su Btrfs richiede accorgimenti specifici.
- **Archinstall**: installer guidato disponibile nella ISO, alternativo alla procedura manuale.

## Debug rapido

- **`grub-install: EFI variables are not supported`**: verifica di aver avviato la ISO in UEFI e che `efivarfs` sia disponibile.
- **Sistema senza rete dopo il boot**: controlla che NetworkManager sia installato e abilitato.
- **Root filesystem non trovato**: confronta UUID di `fstab`, `lsblk -f` e configurazione initramfs.
- **Locale non disponibile**: verifica che la riga corretta sia decommentata in `/etc/locale.gen`, poi riesegui `locale-gen`.
- **Utente senza sudo**: controlla appartenenza a `wheel`, contenuto del file sudoers e risultato di `visudo -c`.
- **GRUB non compare nel firmware**: controlla mount della ESP, modalità UEFI e output di `efibootmgr -v`.

## Checklist finale

- Backup verificato prima del partizionamento.
- Disco e partizioni identificati senza placeholder.
- Root ed ESP montate correttamente.
- `fstab` controllato e senza duplicati.
- Locale, timezone e hostname configurati.
- Utente non-root creato con password.
- Configurazione sudo validata con `visudo -c`.
- NetworkManager abilitato.
- Bootloader installato nella ESP corretta.
- Adattamenti per cifratura, LVM, RAID o dual boot documentati.

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Gestione utenti|Gestione utenti, gruppi e permessi]]

## Fonti

- [ArchWiki - Installation guide](https://wiki.archlinux.org/title/Installation_guide)
- [ArchWiki - GRUB](https://wiki.archlinux.org/title/GRUB)
- [ArchWiki - Users and groups](https://wiki.archlinux.org/title/Users_and_groups)
- [ArchWiki - Sudo](https://wiki.archlinux.org/title/Sudo)
