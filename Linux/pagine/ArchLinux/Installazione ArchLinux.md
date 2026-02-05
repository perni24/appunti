---
date: 2026-02-03
tags:
  - linux
  - archlinux
  - installazione
type:
status: budding
---

# Installazione di Arch Linux

Questa guida descrive i passaggi fondamentali per installare Arch Linux su un sistema con firmware UEFI.

## 1. Preparazione dell'Ambiente di Installazione

1.  **Scaricare l'ISO**: Scarica l'immagine ISO aggiornata dal sito ufficiale di [Arch Linux](https://archlinux.org/download/).
2.  **Avviare l'ambiente live**: Dopo aver preparato il supporto di installazione (es. una chiavetta USB), avvialo. Si aprirà un terminale con privilegi di `root`.
3.  **Impostare layout tastiera**: Per la tastiera italiana.
    ```bash
    loadkeys it
    ```
4.  **Verificare la modalità di avvio (UEFI)**:
    ```bash
    cat /sys/firmware/efi/fw_platform_size
    ```
    > [!INFO]
    > Se il comando restituisce `64`, il sistema è avviato correttamente in modalità UEFI a 64 bit. In caso di errore o valore diverso, verifica le impostazioni del BIOS/UEFI.

5.  **Connettersi a Internet**:
    - Per reti Wi-Fi, puoi usare `iwctl`.
    - Verifica la connessione:
      ```bash
      ping archlinux.org
      ```
6.  **Sincronizzare l'orologio di sistema**:
    ```bash
    timedatectl set-ntp true
    ```
    > [!NOTE]
    > Questo passaggio è importante per la validità dei certificati SSL durante il download dei pacchetti.

## 2. Partizionamento del Disco

1.  **Identificare il disco di destinazione**:
    ```bash
    lsblk
    ```
2.  **Avviare l'utility di partizionamento**:
    ```bash
    cfdisk /dev/sdX
    ```
    > [!WARNING]
    > Sostituisci `sdX` con l'identificativo corretto del tuo disco (es. `sda`, `nvme0n1`). Presta la massima attenzione per non cancellare dati importanti.

3.  **Creare lo schema di partizioni (Esempio GPT per UEFI)**:
    - Seleziona `gpt` come tipo di tabella delle partizioni.
    - **Partizione EFI System**: `512M` - Tipo: `EFI System`.
    - **Partizione di Swap**: (Opzionale ma raccomandata) La dimensione dipende dalla RAM (es. `4G` o più) - Tipo: `Linux swap`.
    - **Partizione di Root (/)**: Lo spazio rimanente - Tipo: `Linux filesystem`.
4.  **Scrivere le modifiche**: Seleziona `Write`, conferma con `yes` e poi `Quit`.

## 3. Formattazione e Montaggio dei Filesystem

1.  **Formattare le partizioni**:
    - Root (`/`):
      ```bash
      mkfs.ext4 /dev/sdX3 # Assumendo che / sia la terza partizione
      ```
    - EFI:
      ```bash
      mkfs.fat -F32 /dev/sdX1 # Assumendo che EFI sia la prima partizione
      ```
2.  **Attivare la partizione di Swap**:
    ```bash
    mkswap /dev/sdX2 # Assumendo che la swap sia la seconda partizione
    swapon /dev/sdX2
    ```
3.  **Montare i filesystem**:
    - Monta la partizione di root:
      ```bash
      mount /dev/sdX3 /mnt
      ```
    - Crea la directory per la partizione EFI e montala:
      ```bash
      mount --mkdir /dev/sdX1 /mnt/boot/efi
      ```

## 4. Installazione del Sistema Base

1.  **Installare i pacchetti essenziali**:
    ```bash
    pacstrap -K /mnt base linux linux-firmware nano networkmanager grub efibootmgr
    ```
    > [!TIP]
    > - **base**: Pacchetti minimi per un sistema funzionante.
    > - **linux**: Il kernel Linux.
    > - **linux-firmware**: Firmware per l'hardware comune.
    > - **nano**: Un editor di testo semplice.
    > - **networkmanager**: Per una gestione semplificata della rete.
    > - **grub** & **efibootmgr**: Componenti del bootloader per UEFI.

2.  **Generare il file `fstab`**:
    ```bash
    genfstab -U /mnt >> /mnt/etc/fstab
    ```
    > [!INFO]
    > L'opzione `-U` usa gli UUID per identificare le partizioni, rendendo la configurazione più robusta contro cambiamenti nell'ordine dei dischi.

## 5. Configurazione del Sistema

1.  **Entrare nel nuovo sistema con `chroot`**:
    ```bash
    arch-chroot /mnt
    ```
2.  **Impostare il fuso orario**:
    ```bash
    ln -sf /usr/share/zoneinfo/Europe/Rome /etc/localtime
    hwclock --systohc
    ```
3.  **Localizzazione (Lingua e Tastiera)**:
    - Apri `/etc/locale.gen` con `nano` e decommenta la riga `it_IT.UTF-8 UTF-8`.
    - Genera le locali:
      ```bash
      locale-gen
      ```
    - Imposta la lingua di sistema:
      ```bash
      echo "LANG=it_IT.UTF-8" > /etc/locale.conf
      ```
    - Imposta la mappa della tastiera in modo persistente:
      ```bash
      echo "KEYMAP=it" > /etc/vconsole.conf
      ```
4.  **Configurazione di Rete**:
    - Imposta il nome del computer (hostname):
      ```bash
      echo "mio-arch" > /etc/hostname # Sostituisci "mio-arch"
      ```
    - Abilita il servizio di NetworkManager all'avvio:
      ```bash
      systemctl enable NetworkManager
      ```
5.  **Creare l'immagine `initramfs`**:
    ```bash
    mkinitcpio -P
    ```
6.  **Impostare la password di `root`**:
    ```bash
    passwd
    ```

## 6. Installazione del Bootloader (GRUB)

1.  **Installare GRUB per UEFI**:
    ```bash
    grub-install --target=x86_64-efi --efi-directory=/boot/efi --bootloader-id=GRUB
    ```
2.  **Generare il file di configurazione di GRUB**:
    ```bash
    grub-mkconfig -o /boot/grub/grub.cfg
    ```
    > [!INFO]
    > A questo punto, dovresti vedere un output che conferma il rilevamento del kernel Linux (es. `Found linux image: /boot/vmlinuz-linux`).

## 7. Finalizzazione

1.  **Uscire dall'ambiente `chroot`**:
    ```bash
    exit
    ```
2.  **Smontare tutte le partizioni**:
    ```bash
    umount -R /mnt
    ```
3.  **Riavviare il sistema**:
    ```bash
    reboot
    ```
    Al riavvio, rimuovi il supporto di installazione e accedi come utente `root` con la password appena creata.