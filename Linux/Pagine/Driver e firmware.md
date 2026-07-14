---
date: 2026-07-11
area: Linux
topic: Supporto hardware kernel
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, driver, firmware, kernel, hardware]
aliases: [Driver Linux, Firmware Linux]
prerequisites: [Rilevamento hardware, Moduli del kernel]
related: [udev, Compilazione del kernel]
---

# Driver e firmware

## Sintesi

Il driver è codice kernel che controlla un device; il firmware è codice o dati eseguiti dal dispositivo o dal platform controller. Un driver può essere built-in o modulo e può richiedere un blob sotto `/lib/firmware` caricato durante l'inizializzazione.

Aggiornare il kernel, il pacchetto firmware e il firmware del dispositivo sono operazioni differenti con rischi e strumenti propri.

## Quando usarlo

- Diagnosticare un device rilevato ma non operativo.
- Verificare driver e versione firmware in uso.
- Risolvere errori `firmware: failed to load`.
- Valutare moduli esterni o DKMS.
- Gestire compatibilità con Secure Boot.

## Come funziona

Il kernel associa device e driver tramite ID, tabelle e modalias. Quando il driver richiede firmware, il kernel genera una richiesta user-space e cerca il file nei percorsi previsti. L'assenza può impedire il funzionamento o ridurre funzionalità.

I pacchetti della distribuzione mantengono moduli e firmware coerenti con kernel e policy di licenza. Driver esterni possono richiedere rebuild a ogni aggiornamento e firma per Secure Boot.

Microcode CPU viene caricato molto presto e non coincide con il firmware UEFI della scheda madre. `fwupd` gestisce soltanto hardware supportato dal Linux Vendor Firmware Service o da plugin disponibili.

## API / Sintassi

Mostrare driver PCI associati:

```bash
lspci -nnk
```

Mostrare driver di una interfaccia di rete:

```bash
ethtool -i eth0
```

Mostrare metadata di un modulo:

```bash
modinfo nome_modulo
```

Mostrare modalias del device udev:

```bash
udevadm info --query=property --name=/dev/nome-device
```

Cercare errori firmware nel boot:

```bash
journalctl -k -b | grep -i firmware
```

Mostrare device aggiornabili tramite fwupd:

```bash
fwupdmgr get-devices
```

Mostrare aggiornamenti firmware disponibili:

```bash
fwupdmgr get-updates
```

## Esempio pratico

Identificare scheda e driver:

```bash
lspci -nnk
```

Controllare se il modulo è caricato:

```bash
lsmod
```

Leggere errori kernel senza tentare subito un driver alternativo:

```bash
journalctl -k -b -p warning
```

Se manca un file firmware, individuare il pacchetto ufficiale che lo fornisce e riavviare o ricaricare il driver secondo documentazione, conservando un percorso di recovery.

## Varianti

- Driver in-tree seguono il ciclo del kernel; out-of-tree seguono un progetto separato.
- DKMS automatizza rebuild ma non garantisce compatibilità con nuove API kernel.
- Firmware può essere caricato dal driver, dal bootloader, dall'UEFI o aggiornato in flash.
- Moduli firmati soddisfano policy Secure Boot solo se la chiave è attendibile.
- Initramfs deve includere driver e firmware necessari prima della root.
- VFIO associa device a un driver per passthrough, rimuovendoli dal driver host ordinario.

## Errori comuni

- Confondere versione driver, kernel e firmware.
- Scaricare blob o moduli da fonti non verificate.
- Installare driver esterni quando quello in-tree supporta già l'ID.
- Dimenticare rebuild DKMS o firma dopo un aggiornamento kernel.
- Rimuovere un modulo usato dal filesystem, rete o display corrente.
- Aggiornare firmware senza alimentazione stabile e istruzioni del vendor.
- Ignorare che il firmware mancante deve essere incluso anche nell'initramfs.

## Checklist

- Vendor/device ID e revisione sono corretti?
- Quale driver è associato e quale potrebbe gestirlo?
- Il firmware richiesto esiste e proviene dal pacchetto previsto?
- Kernel e modulo sono compatibili?
- Secure Boot accetta la firma?
- Il componente serve nell'initramfs?
- Aggiornamento e rollback del firmware sono documentati?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Rilevamento hardware|Rilevamento hardware]]
- [[Linux/Pagine/Moduli del kernel|Moduli del kernel]]
- [[Linux/Pagine/udev|udev]]
- [[Linux/Pagine/Compilazione del kernel|Compilazione del kernel]]

## Fonti

- [Linux kernel driver API](https://docs.kernel.org/driver-api/)
- [Linux kernel firmware API](https://docs.kernel.org/driver-api/firmware/)
- [linux-firmware](https://gitlab.com/kernel-firmware/linux-firmware)
- [fwupd documentation](https://fwupd.github.io/libfwupdplugin/)
