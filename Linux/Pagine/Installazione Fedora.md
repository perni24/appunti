---
date: 2026-07-13
area: Linux
topic: Fedora Workstation
type: operational-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, fedora, installazione, uefi, anaconda]
aliases: [Installazione Fedora, Installare Fedora Workstation]
prerequisites: [UEFI e BIOS, Partizionamento dei dischi, Filesystem ext4 Btrfs e XFS, Interfacce e indirizzi IP]
related: [Installazione Arch Linux, Installazione Debian, apt dnf e pacman]
---

# Installazione Fedora

## Obiettivo

Installare la versione stabile corrente di Fedora Workstation su un computer `x86_64` avviato in modalita UEFI. La procedura usa il supporto live e l'installer Anaconda, con partizionamento automatico o manuale, cifratura facoltativa e controlli successivi al primo avvio.

> [!warning]
> La scrittura della chiavetta e il partizionamento possono cancellare dati. Preparare un backup e controllare piu volte il disco selezionato prima dell'installazione.

## Quando usarlo

- Per installare una workstation Linux aggiornata con GNOME e tecnologie recenti.
- Per provare Fedora in modalita live prima di modificare il disco.
- Quando si vuole usare il partizionamento automatico di Anaconda, con cifratura opzionale.
- Come base per sviluppo, container e tecnologie che entrano rapidamente nell'ecosistema Linux.

Questa guida riguarda Fedora Workstation. Fedora Server, gli Spin e i desktop Atomic hanno immagini, flussi o modelli di aggiornamento differenti.

## Procedura

### 1. Scaricare l'immagine corretta

Scaricare Fedora Workstation dalla pagina ufficiale. Fedora Media Writer e il metodo consigliato per selezionare la release, scaricarla e creare il supporto USB. Per una macchina virtuale e sufficiente collegare direttamente il file ISO.

Controllare che architettura, edizione e release corrispondano al sistema da installare.

### 2. Verificare firma e checksum

Se l'immagine e stata scaricata manualmente, scaricare anche il file `CHECKSUM` corrispondente e il portachiavi ufficiale Fedora dalla pagina di sicurezza.

Scaricare il portachiavi pubblicato da Fedora:

```bash
curl --remote-name https://fedoraproject.org/fedora.gpg
```

Mostrare le impronte delle chiavi e confrontarle con la pagina ufficiale:

```bash
gpg --show-keys --with-fingerprint --keyid-format long fedora.gpg
```

Verificare la firma del file di checksum e, solo se valida, controllare l'immagine. Sostituire il nome del file con quello scaricato:

```bash
gpgv --keyring ./fedora.gpg --output verified-checksums Fedora-Workstation-CHECKSUM
```

Verificare l'ISO presente nella directory:

```bash
sha256sum -c verified-checksums --ignore-missing
```

Il controllo deve restituire `OK`. Non usare un'immagine con firma o checksum non validi.

### 3. Creare il supporto USB

Con Fedora Media Writer selezionare l'immagine e la chiavetta corretta. In alternativa, da Linux identificare prima il dispositivo:

```bash
lsblk --output NAME,SIZE,TYPE,MOUNTPOINTS,MODEL
```

Smontare le partizioni della chiavetta senza espellerla. Sostituire `/dev/sdX` con il dispositivo completo:

```bash
sudo dd if=Fedora-Workstation-Live-x86_64.iso of=/dev/sdX bs=4M status=progress conv=fsync
```

Attendere il completamento delle scritture:

```bash
sync
```

### 4. Preparare UEFI

- Avviare la chiavetta tramite la voce UEFI.
- Secure Boot puo normalmente restare attivo con l'immagine ufficiale Fedora.
- In dual boot con Windows, disattivare l'avvio rapido e usare UEFI per entrambi i sistemi.
- Verificare la compatibilita di controller RAID, RST o VMD prima di cambiare le impostazioni del firmware.

### 5. Provare il sistema live

Quando il menu lo propone, eseguire il controllo del supporto prima di avviare Fedora. Nella sessione live verificare almeno:

- grafica e risoluzione;
- tastiera, touchpad e dispositivi di input;
- rete Ethernet o Wi-Fi;
- audio e sospensione, se importanti per la macchina.

La sessione live non garantisce ogni dettaglio dell'installazione, ma permette di individuare subito incompatibilita evidenti.

### 6. Avviare Anaconda

Aprire l'applicazione di installazione dalla sessione live. Selezionare lingua, localizzazione e fuso orario, quindi seguire il flusso mostrato dall'installer. Le schermate possono cambiare tra release, ma prima della conferma Anaconda presenta un riepilogo delle scelte.

### 7. Configurare lo storage

Per un disco destinato interamente a Fedora, il partizionamento automatico e la scelta piu semplice. Fedora Workstation usa normalmente un layout adatto al desktop corrente e Anaconda crea le partizioni richieste per l'avvio.

Per il partizionamento manuale in UEFI considerare:

- una EFI System Partition FAT32 montata in `/boot/efi`;
- una ESP di almeno 600 MiB per una nuova configurazione, in linea con i requisiti correnti di Anaconda;
- il filesystem radice e gli eventuali mount aggiuntivi;
- lo spazio necessario agli aggiornamenti, ai container, alle macchine virtuali e agli snapshot;
- la cifratura del volume quando il dispositivo contiene dati sensibili.

In dual boot riutilizzare la EFI System Partition esistente senza formattarla. Selezionare lo spazio libero destinato a Fedora e controllare nel riepilogo che le altre partizioni non siano marcate per la cancellazione.

### 8. Configurare l'account

Creare l'utente iniziale e una password robusta. Quando disponibile, abilitare i privilegi amministrativi per l'utente che dovra usare `sudo`. Conservare separatamente l'eventuale password di cifratura del disco.

### 9. Rivedere e installare

Prima di avviare l'installazione controllare:

- disco di destinazione;
- partizioni create, formattate o eliminate;
- cifratura;
- fuso orario e tastiera;
- account amministrativo.

Confermare solo quando il riepilogo corrisponde alla configurazione desiderata.

### 10. Riavviare

Al termine riavviare il sistema e rimuovere la chiavetta. Se parte nuovamente la sessione live, correggere l'ordine di boot o scegliere la voce Fedora dal firmware.

### 11. Aggiornare e verificare il sistema

Installare gli aggiornamenti disponibili:

```bash
sudo dnf upgrade --refresh
```

Controllare i repository abilitati:

```bash
dnf repolist
```

Controllare dischi e filesystem:

```bash
lsblk -f
```

Controllare i punti di mount:

```bash
findmnt
```

Verificare la rete:

```bash
ip address show
```

Verificare la route predefinita:

```bash
ip route show
```

Controllare lo stato di SELinux:

```bash
getenforce
```

Controllare eventuali servizi falliti:

```bash
systemctl --failed
```

## Snippet

Mostrare la release Fedora:

```bash
cat /etc/fedora-release
```

Mostrare il numero della release usato dal sistema RPM:

```bash
rpm -E %fedora
```

Mostrare il kernel attivo:

```bash
uname -r
```

Verificare il pacchetto che identifica la release:

```bash
rpm -q fedora-release
```

Controllare Secure Boot, se `mokutil` e installato:

```bash
mokutil --sb-state
```

Controllare gli aggiornamenti firmware supportati, se `fwupd` e disponibile:

```bash
fwupdmgr get-updates
```

## Adattamenti comuni

### Dual boot

Ridurre la partizione dell'altro sistema con i suoi strumenti nativi e lasciare spazio non allocato. Riutilizzare la ESP senza formattarla e verificare che entrambi i sistemi siano stati avviati in UEFI.

### Fedora Server

Usare l'immagine Fedora Server e seguire le opzioni specifiche per servizi, rete e storage. Non installare un desktop environment su un server se non e necessario.

### Spin e desktop Atomic

Uno Spin sostituisce principalmente l'ambiente desktop. Fedora Silverblue, Kinoite e gli altri desktop Atomic usano invece un sistema immutabile con gestione del software diversa: verificare la documentazione dell'edizione prima di applicare procedure basate su pacchetti tradizionali.

### Cifratura

Abilitare la cifratura durante la configurazione dello storage. La cifratura protegge i dati a riposo, ma non sostituisce backup, aggiornamenti e controllo degli accessi.

### Installazioni ripetibili

Anaconda supporta Kickstart per descrivere in un file partizioni, pacchetti e configurazione. Evitare segreti in chiaro nei file versionati e provare la configurazione in una macchina virtuale prima dell'uso su hardware reale.

## Debug rapido

### Il supporto non si avvia

- Ricreare la chiavetta dopo avere verificato il checksum.
- Scegliere esplicitamente la voce UEFI nel boot menu.
- Controllare che il firmware supporti l'architettura dell'immagine.

### Il disco non e visibile

- Verificare impostazioni RAID, RST e VMD.
- Controllare che il controller sia supportato dal kernel della release.
- Valutare l'impatto sull'altro sistema prima di modificare la modalita del controller.

### Il sistema mostra una schermata nera

- Provare l'opzione di risoluzione grafica di base disponibile nel menu di avvio.
- Aggiornare il sistema dopo il primo avvio.
- Identificare la GPU prima di installare driver aggiuntivi e seguire fonti compatibili con la release in uso.

### La EFI System Partition e troppo piccola

- Non formattare o ridimensionare alla cieca una ESP condivisa.
- Eseguire un backup della tabella delle partizioni e dei dati.
- Liberare o riallocare spazio solo dopo avere verificato i file di boot presenti e i requisiti dell'installer.

### `dnf` non aggiorna i repository

- Controllare data, ora, rete e DNS.
- Verificare i repository abilitati.
- Riprovare dopo avere escluso un disservizio temporaneo dei mirror.

### SELinux segnala accessi negati dopo modifiche manuali

Ripristinare i contesti previsti sul percorso interessato, senza disabilitare SELinux come prima soluzione:

```bash
sudo restorecon -RFv /percorso/da/correggere
```

## Checklist finale

- [ ] L'immagine proviene dal sito Fedora ed e stata verificata.
- [ ] I dati importanti sono inclusi in un backup valido.
- [ ] Il supporto e il sistema installato usano la modalita UEFI prevista.
- [ ] Il riepilogo dello storage non modifica partizioni estranee.
- [ ] Fedora si avvia senza la chiavetta.
- [ ] `dnf upgrade --refresh` termina senza errori.
- [ ] Rete, audio, grafica e sospensione funzionano secondo le necessita.
- [ ] SELinux e attivo nella modalita prevista.
- [ ] `systemctl --failed` non mostra errori non compresi.

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/UEFI e BIOS|UEFI e BIOS]]
- [[Linux/Pagine/Partizionamento dei dischi|Partizionamento dei dischi]]
- [[Linux/Pagine/Filesystem ext4 Btrfs e XFS|Filesystem ext4, Btrfs e XFS]]
- [[Linux/Pagine/AppArmor e SELinux|AppArmor e SELinux]]
- [[Linux/Pagine/apt dnf e pacman|apt, dnf e pacman]]
- [[Linux/Pagine/Installazione Arch Linux|Installazione Arch Linux]]
- [[Linux/Pagine/Installazione Debian|Installazione Debian]]

## Fonti

- [Fedora Workstation - Download ufficiale](https://fedoraproject.org/workstation/download/)
- [Fedora - Verifica delle immagini e chiavi OpenPGP](https://fedoraproject.org/security)
- [Anaconda - Flusso di installazione](https://anaconda-installer.readthedocs.io/en/latest/anaconda-webui/docs/installation-steps.html)
- [Anaconda - Note di rilascio](https://anaconda-installer.readthedocs.io/en/latest/release-notes/index.html)
- [Anaconda - Kickstart](https://anaconda-installer.readthedocs.io/en/latest/user-guide/kickstart.html)
