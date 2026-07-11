---
date: 2026-07-11
area: Linux
topic: Firmware di avvio
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, uefi, bios, firmware, secure-boot]
aliases: [Firmware UEFI, Legacy BIOS]
prerequisites: [Processo di boot, Partizionamento dei dischi]
related: [Bootloader GRUB e systemd-boot, Compilazione del kernel]
---

# UEFI e BIOS

## Sintesi

BIOS legacy e UEFI sono modelli di firmware con percorsi di boot differenti. UEFI comprende un boot manager, variabili NVRAM e applicazioni EFI caricate da una EFI System Partition, ESP. BIOS esegue invece codice iniziale installato secondo il layout del disco e delega al bootloader.

GPT e UEFI sono spesso usati insieme, ma non sono sinonimi: GPT è una tabella delle partizioni e può essere usata anche con BIOS, se il bootloader dispone delle strutture necessarie.

## Problema che risolve

Il firmware deve inizializzare la piattaforma e trovare un componente avviabile prima che esistano servizi e driver del sistema operativo. Distinguere UEFI e BIOS permette di scegliere partizioni, loader e strumenti compatibili con il percorso realmente usato.

## Concetto chiave

| Elemento | UEFI | BIOS legacy |
| --- | --- | --- |
| destinazione | eseguibile EFI | codice boot installato sul disco |
| configurazione | variabili NVRAM | ordine firmware e bootloader |
| partizione tipica | ESP FAT | eventuale BIOS Boot Partition con GPT |
| Secure Boot | supportato | non equivalente |

La ESP usa normalmente FAT ed è montata in un percorso scelto dalla distribuzione, come `/boot`, `/boot/efi` o `/efi`. Contiene loader EFI, non l'intero firmware.

Secure Boot verifica una catena di componenti firmati secondo chiavi e policy del firmware. Non cifra filesystem o dati e non sostituisce LUKS. Driver o kernel personalizzati devono essere compatibili con la policy di firma adottata.

## Dettagli importanti

In modalità UEFI il firmware consulta le entry `Boot####` in NVRAM o il percorso fallback dell'architettura sulla ESP. Carica un eseguibile come GRUB, systemd-boot, shim o una Unified Kernel Image.

In modalità BIOS, il firmware seleziona un device e avvia il codice iniziale. Su GPT, GRUB in modalità BIOS usa normalmente una piccola BIOS Boot Partition per la propria core image; questa non è la ESP.

CSM emula comportamenti legacy su alcuni firmware UEFI, ma aumenta ambiguità. Un sistema installato in una modalità può non avviarsi semplicemente cambiando modalità nel setup.

## Esempio

Verificare se il kernel corrente è stato avviato in modalità UEFI:

```bash
test -d /sys/firmware/efi
```

Mostrare le entry UEFI, quando avviato in UEFI:

```bash
sudo efibootmgr -v
```

Individuare una ESP montata:

```bash
findmnt /boot/efi
```

Mostrare partizioni, filesystem e tipi GPT:

```bash
lsblk -o NAME,PATH,FSTYPE,PARTTYPE,PARTLABEL,MOUNTPOINTS
```

Verificare lo stato Secure Boot se `mokutil` è disponibile:

```bash
mokutil --sb-state
```

Mostrare variabili EFI esposte dal kernel:

```bash
ls /sys/firmware/efi/efivars
```

## Limiti

- Implementazioni UEFI differenti possono avere bug e interfacce di setup non uniformi.
- Secure Boot verifica firme secondo una policy, ma non garantisce assenza di vulnerabilità.
- CSM non replica perfettamente ogni comportamento BIOS.
- La presenza di una ESP o di GPT non dimostra da sola la modalità del boot corrente.

## Errori comuni

- Confondere ESP e partizione BIOS Boot.
- Formattare o montare la ESP sbagliata in sistemi con più dischi.
- Cambiare da UEFI a CSM aspettandosi che le entry esistenti funzionino.
- Credere che Secure Boot cifri il disco.
- Eliminare entry NVRAM senza conoscere il percorso fallback.
- Installare un bootloader per una piattaforma diversa dalla modalità corrente.
- Considerare GPT prova certa di un boot UEFI.

## Checklist

- Il sistema corrente è avviato in UEFI o BIOS?
- Tabella partizioni e modalità di boot sono compatibili?
- Quale ESP è montata e su quale disco?
- Entry NVRAM e file EFI puntano alla stessa installazione?
- Secure Boot è attivo e quali chiavi autorizzano i componenti?
- Esiste un percorso di boot fallback o un supporto di recupero?
- Le modifiche al firmware preservano altri sistemi installati?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Processo di boot|Processo di boot]]
- [[Linux/Pagine/Bootloader GRUB e systemd-boot|Bootloader GRUB e systemd-boot]]
- [[Linux/Pagine/Partizionamento dei dischi|Partizionamento dei dischi]]
- [[Linux/Pagine/Compilazione del kernel|Compilazione del kernel]]

## Fonti

- [UEFI Specifications](https://uefi.org/specifications)
- [Linux kernel - EFI](https://docs.kernel.org/admin-guide/efi-stub.html)
- [efibootmgr](https://github.com/rhboot/efibootmgr)
