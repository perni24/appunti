---
date: 2026-07-11
area: Linux
topic: Cifratura storage Linux
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, sicurezza, luks, cryptsetup, dm-crypt]
aliases: [LUKS, Cifratura disco Linux]
prerequisites: [Partizionamento dei dischi, Initramfs]
related: [Hardening del sistema, Filesystem ext4 Btrfs e XFS]
---

# Crittografia con LUKS

## Sintesi

LUKS è un formato standard per volumi cifrati Linux gestiti normalmente con `cryptsetup` sopra dm-crypt. L'header conserva parametri, keyslot e metadata; le passphrase sbloccano una volume key usata per cifrare i settori.

LUKS protegge principalmente dati a riposo quando il volume è chiuso. Una volta aperto, processi autorizzati e un sistema compromesso possono accedere ai dati in chiaro attraverso il mapping.

## Quando usarlo

- Proteggere dischi e partizioni in caso di furto o accesso offline.
- Cifrare root, home, dati o supporti rimovibili.
- Gestire più credenziali tramite keyslot.
- Integrare sblocco con initramfs, TPM o token supportati.
- Ruotare credenziali senza ricifrare tutti i dati.

## Come funziona

`luksFormat` crea header e keyslot sul device, distruggendo il formato precedente. `cryptsetup open` verifica una credenziale e crea un mapping `/dev/mapper/NOME`; sopra il mapping si crea o monta il filesystem.

LUKS2 supporta metadata ridondanti, token e PBKDF moderni. Il backup dell'header permette di recuperare da danni all'header, ma contiene materiale sensibile: combinato con una passphrase valida può consentire accesso anche dopo cambiamenti successivi ai keyslot rappresentati dal backup.

La cifratura non fornisce automaticamente autenticazione o integrità di tutti i settori. Manipolazione, rollback e availability richiedono controlli ulteriori secondo il threat model.

## API / Sintassi

Verificare se un device contiene LUKS:

```bash
sudo cryptsetup isLuks /dev/sdX1
```

Mostrare metadata e keyslot senza esporre la volume key:

```bash
sudo cryptsetup luksDump /dev/sdX1
```

Creare un contenitore LUKS2 su un device vuoto verificato:

```bash
sudo cryptsetup luksFormat --type luks2 /dev/sdX1
```

Aprire il contenitore:

```bash
sudo cryptsetup open /dev/sdX1 dati_crypt
```

Mostrare lo stato del mapping:

```bash
sudo cryptsetup status dati_crypt
```

Chiudere il mapping dopo aver smontato il filesystem:

```bash
sudo cryptsetup close dati_crypt
```

Aggiungere una nuova passphrase in un keyslot libero:

```bash
sudo cryptsetup luksAddKey /dev/sdX1
```

Creare un backup binario dell'header:

```bash
sudo cryptsetup luksHeaderBackup /dev/sdX1 --header-backup-file luks-header.img
```

## Esempio pratico

Identificare prima il target:

```bash
lsblk -o NAME,PATH,SIZE,FSTYPE,MOUNTPOINTS,MODEL,SERIAL
```

Controllare firme senza cancellarle:

```bash
sudo wipefs --no-act /dev/sdX1
```

Dopo la formattazione e l'apertura, il filesystem va creato sul mapping, non sul device cifrato sottostante. Verificare la catena:

```bash
lsblk -o NAME,TYPE,FSTYPE,MOUNTPOINTS
```

Conservare header backup e backup dati in luoghi separati, protetti e provati secondo una procedura di recovery.

## Varianti

- `/etc/crypttab` descrive volumi da aprire al boot e interagisce con initramfs e systemd.
- systemd-cryptenroll integra token FIDO2, TPM2 e recovery key in configurazioni compatibili.
- Header detached separa metadata LUKS dal device dati, aumentando requisiti di backup.
- Cifratura root protegge più dati rispetto a un singolo volume, ma boot e initramfs restano parte del modello.
- `discard` può migliorare gestione SSD ma rivela pattern di blocchi utilizzati.
- dm-integrity e modalità autenticate affrontano esigenze ulteriori con costi e compatibilità specifici.

## Errori comuni

- Eseguire `luksFormat` sul device sbagliato.
- Credere che LUKS sostituisca backup e integrità.
- Conservare header backup non protetto accanto al disco.
- Rimuovere l'ultimo keyslot valido o non provare una nuova credenziale prima della rotazione.
- Formattare il device fisico dopo aver aperto il mapping invece di usare `/dev/mapper/...`.
- Chiudere il mapping mentre il filesystem è montato.
- Presumere che i dati siano protetti mentre il sistema è acceso e sbloccato.

## Checklist

- Device, modello, seriale e contenuto sono stati verificati?
- Esistono backup dati indipendenti?
- Passphrase e PBKDF sono adeguati?
- Almeno una credenziale di recupero è stata provata?
- Header backup è protetto e conservato separatamente?
- Initramfs, crypttab e bootloader sono coerenti per root cifrata?
- Il threat model considera sistema acceso, integrità e disponibilità?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Partizionamento dei dischi|Partizionamento dei dischi]]
- [[Linux/Pagine/Initramfs|Initramfs]]
- [[Linux/Pagine/Filesystem ext4 Btrfs e XFS|Filesystem ext4, Btrfs e XFS]]
- [[Linux/Pagine/Hardening del sistema|Hardening del sistema]]

## Fonti

- [cryptsetup project](https://gitlab.com/cryptsetup/cryptsetup)
- [cryptsetup(8)](https://gitlab.com/cryptsetup/cryptsetup/-/blob/master/man/cryptsetup.8.adoc)
- [Cryptsetup FAQ](https://gitlab.com/cryptsetup/cryptsetup/-/blob/master/FAQ.md)
- [dm-crypt](https://docs.kernel.org/admin-guide/device-mapper/dm-crypt.html)
