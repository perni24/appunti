---
date: 2026-07-13
area: Linux
topic: Debian
type: operational-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, debian, installazione, uefi, debian-installer]
aliases: [Installazione Debian, Installare Debian]
prerequisites: [UEFI e BIOS, Partizionamento dei dischi, Filesystem ext4 Btrfs e XFS, Interfacce e indirizzi IP]
related: [Installazione Arch Linux, Installazione Fedora, apt dnf e pacman]
---

# Installazione Debian

## Obiettivo

Installare la versione stabile corrente di Debian su un computer `amd64` avviato in modalita UEFI, usando il Debian Installer grafico. La procedura copre la verifica dell'immagine, la preparazione della chiavetta USB, il partizionamento guidato o manuale, l'installazione di GRUB e i controlli successivi al primo avvio.

> [!warning]
> Il partizionamento e la scrittura dell'immagine USB possono cancellare dati. Eseguire un backup e verificare con attenzione il disco selezionato prima di confermare.

## Quando usarlo

- Per installare Debian su un computer fisico o una macchina virtuale.
- Quando si preferisce una distribuzione stabile, con aggiornamenti conservativi e un lungo ciclo di supporto.
- Per una workstation, un server o un sistema minimale configurabile tramite il Debian Installer.
- Quando si vuole usare il partizionamento guidato, con o senza cifratura LUKS e LVM.

Per dual boot, RAID, storage gia partizionato o firmware particolare, adattare i passaggi prima di confermare le modifiche ai dischi.

## Procedura

### 1. Scegliere l'immagine

Per la maggior parte delle installazioni e sufficiente l'immagine `netinst`, che contiene l'installer e scarica i pacchetti dalla rete. Usare un'immagine DVD quando la connessione non e disponibile durante l'installazione.

Scaricare l'immagine stabile dal sito ufficiale Debian insieme ai file `SHA512SUMS` e `SHA512SUMS.sign` della stessa directory.

### 2. Verificare l'immagine

Prima di usare i checksum, verificarne la firma OpenPGP seguendo la pagina ufficiale Debian. Il portachiavi deve provenire da una fonte Debian attendibile: importare una chiave trovata casualmente non autentica il file.

Verificare poi il checksum dell'immagine presente nella directory corrente:

```bash
sha512sum -c SHA512SUMS --ignore-missing
```

L'output deve indicare `OK` per il file ISO scaricato. Un checksum non valido richiede un nuovo download.

### 3. Creare la chiavetta USB

Si puo usare un programma grafico che scriva immagini ISO in modalita raw. Da Linux e possibile usare `dd`, dopo avere identificato il dispositivo corretto con `lsblk`.

```bash
lsblk --output NAME,SIZE,TYPE,MOUNTPOINTS,MODEL
```

Smontare le eventuali partizioni della chiavetta senza espellerla. Sostituire `/dev/sdX` con il dispositivo completo, non con una partizione come `/dev/sdX1`:

```bash
sudo dd if=debian-amd64-netinst.iso of=/dev/sdX bs=4M status=progress conv=fsync
```

Attendere il completamento delle scritture:

```bash
sync
```

### 4. Preparare il firmware

- Avviare il supporto con la voce UEFI, evitando di mescolare UEFI e modalita BIOS legacy.
- Secure Boot puo restare attivo: Debian stabile supporta l'avvio protetto sulle architetture previste.
- In dual boot con Windows, disattivare l'avvio rapido di Windows e verificare che entrambi i sistemi usino la stessa modalita di avvio.
- Se il disco usa RAID firmware, Intel RST o VMD, verificare prima che il controller sia supportato e visibile all'installer.

### 5. Avviare il Debian Installer

Selezionare `Graphical install`, quindi impostare lingua, localizzazione e tastiera. Configurare la rete, il nome host e, solo quando realmente usato, il dominio.

Se il firmware di una periferica non e incluso, l'installer puo chiedere un file aggiuntivo. Le immagini Debian moderne possono includere firmware non libero distribuibile, ma alcuni dispositivi richiedono comunque un pacchetto specifico.

### 6. Configurare utenti e privilegi

Creare un utente personale con una password robusta. Se l'installer propone la password di `root`, scegliere consapevolmente il modello di amministrazione:

- impostando la password di `root`, l'amministrazione puo avvenire tramite l'account dedicato;
- lasciandola vuota, nelle installazioni che prevedono questa opzione l'accesso diretto a `root` viene disabilitato e il primo utente riceve normalmente i privilegi tramite `sudo`.

Controllare il riepilogo mostrato dall'installer, perche il comportamento puo dipendere dal profilo selezionato.

### 7. Partizionare il disco

Per un'installazione pulita, il metodo guidato sull'intero disco riduce il rischio di dimenticare partizioni necessarie. Il profilo guidato con LVM cifrato e adatto quando si vuole proteggere i dati a riposo.

Nel partizionamento manuale UEFI servono almeno:

- una EFI System Partition in FAT32, montata in `/boot/efi`;
- una partizione radice `/`, normalmente in ext4;
- spazio di swap tramite partizione o file, se necessario per il carico o l'ibernazione;
- una partizione `/home` separata solo se risponde a una precisa strategia di gestione o reinstallazione.

In dual boot riutilizzare la EFI System Partition esistente senza formattarla. Verificare attentamente il riepilogo delle operazioni prima di applicare le modifiche.

### 8. Configurare mirror e software

Selezionare un mirror vicino e configurare un proxy solo se richiesto dalla rete. Nella selezione dei task installare esclusivamente gli ambienti necessari:

- un desktop environment per una workstation;
- `SSH server` solo se il sistema deve accettare accessi remoti;
- gli strumenti di sistema standard per una base amministrabile.

Ridurre i task installati limita pacchetti e servizi non necessari.

### 9. Installare GRUB

Confermare l'installazione del bootloader sul disco destinato all'avvio. In UEFI, GRUB registra una voce nel firmware e usa la EFI System Partition. In dual boot verificare che la partizione EFI scelta sia quella condivisa e non venga formattata.

### 10. Riavviare

Terminata l'installazione, riavviare e rimuovere la chiavetta quando richiesto. Se il firmware torna all'installer, correggere l'ordine di avvio o selezionare la voce Debian.

### 11. Aggiornare e controllare il sistema

Aggiornare l'indice dei pacchetti:

```bash
sudo apt update
```

Installare tutti gli aggiornamenti disponibili, gestendo anche le dipendenze:

```bash
sudo apt full-upgrade
```

Controllare dischi e filesystem:

```bash
lsblk -f
```

Controllare i punti di mount:

```bash
findmnt
```

Verificare gli indirizzi di rete:

```bash
ip address show
```

Verificare la route predefinita:

```bash
ip route show
```

Verificare la risoluzione DNS:

```bash
getent hosts debian.org
```

Controllare eventuali servizi falliti:

```bash
systemctl --failed
```

## Snippet

Mostrare la release installata:

```bash
cat /etc/os-release
```

Mostrare il kernel in uso:

```bash
uname -r
```

Controllare l'architettura gestita da `dpkg`:

```bash
dpkg --print-architecture
```

Controllare le sorgenti e le priorita dei pacchetti:

```bash
apt-cache policy
```

Mostrare le voci UEFI, se `efibootmgr` e installato:

```bash
sudo efibootmgr -v
```

## Adattamenti comuni

### Dual boot

Ridurre la partizione dell'altro sistema con i suoi strumenti nativi, lasciare spazio non allocato e selezionarlo nell'installer. Non formattare la EFI System Partition esistente e mantenere la stessa modalita UEFI per entrambi i sistemi.

### Installazione cifrata

Usare il profilo guidato con LVM cifrato quando disponibile. Conservare separatamente le credenziali di sblocco: senza password o chiave di recupero i dati non sono recuperabili.

### Server minimale

Deselezionare i desktop environment e installare solo gli strumenti standard e, se necessario, il server SSH. Dopo il primo avvio verificare porte, firewall e autenticazione prima di esporre il sistema alla rete.

### Installazione senza rete

Usare un'immagine DVD contenente i pacchetti necessari. La `netinst` e progettata per scaricare gran parte del sistema e offre meno possibilita in assenza di connessione.

### Installazione automatizzata

Per installazioni ripetibili, Debian Installer supporta file di preconfigurazione. Conservare password e segreti fuori dal file versionato oppure usare valori cifrati compatibili con l'installer.

## Debug rapido

### Il computer non avvia Debian

- Controllare che l'installazione e il boot siano avvenuti entrambi in UEFI.
- Verificare l'ordine di avvio e la presenza della voce Debian nel firmware.
- Avviare il supporto di installazione in modalita rescue per reinstallare GRUB o correggere i mount.

### Il disco non compare

- Verificare le impostazioni RAID, RST o VMD del firmware.
- Controllare che il controller non richieda un driver assente dall'immagine.
- Prima di cambiare modalita del controller su un sistema dual boot, verificare l'impatto sull'altro sistema operativo.

### La rete non funziona nell'installer

- Provare una connessione Ethernet.
- Controllare se l'installer segnala firmware mancante.
- Usare un supporto DVD o fornire il pacchetto firmware richiesto da un secondo dispositivo.

### `apt update` restituisce errori

- Controllare data, ora, DNS e connettivita.
- Verificare che le sorgenti puntino alla release installata.
- Cambiare mirror solo dopo avere escluso problemi locali o temporanei.

### Un aggiornamento non configura i pacchetti

Riprendere eventuali configurazioni interrotte:

```bash
sudo dpkg --configure -a
```

Correggere dipendenze incomplete:

```bash
sudo apt --fix-broken install
```

## Checklist finale

- [ ] L'immagine ISO e il checksum autenticato sono stati verificati.
- [ ] Il backup dei dati importanti e disponibile.
- [ ] Il sistema e stato installato e avviato nella modalita UEFI prevista.
- [ ] Le partizioni e i mount corrispondono al progetto del disco.
- [ ] GRUB avvia Debian e gli eventuali altri sistemi.
- [ ] L'utente amministrativo usa il modello `sudo` o `root` scelto consapevolmente.
- [ ] `apt update` e `apt full-upgrade` terminano senza errori.
- [ ] Rete, DNS e servizi essenziali funzionano.
- [ ] `systemctl --failed` non mostra errori non compresi.

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/UEFI e BIOS|UEFI e BIOS]]
- [[Linux/Pagine/Partizionamento dei dischi|Partizionamento dei dischi]]
- [[Linux/Pagine/Filesystem ext4 Btrfs e XFS|Filesystem ext4, Btrfs e XFS]]
- [[Linux/Pagine/apt dnf e pacman|apt, dnf e pacman]]
- [[Linux/Pagine/Installazione Arch Linux|Installazione Arch Linux]]
- [[Linux/Pagine/Installazione Fedora|Installazione Fedora]]

## Fonti

- [Debian - Verifica delle immagini di installazione](https://www.debian.org/CD/verify.en.html)
- [Debian - Guida di installazione stabile per amd64](https://www.debian.org/releases/stable/amd64/)
- [Debian Installer - Caricamento del firmware mancante](https://www.debian.org/releases/stable/amd64/ch06s04.en.html)

