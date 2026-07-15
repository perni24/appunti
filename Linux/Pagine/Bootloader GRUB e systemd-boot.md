---
date: 2026-07-11
area: Linux
topic: Bootloader Linux
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, bootloader, grub, systemd-boot, uefi]
aliases: [GRUB e systemd-boot, Boot manager Linux]
prerequisites: [Processo di boot, UEFI e BIOS]
related: [Initramfs, Parametri del kernel e sysctl]
---

# Bootloader GRUB e systemd-boot

## Sintesi

Il bootloader seleziona e carica kernel, initramfs e command line. GRUB supporta BIOS e UEFI, numerosi filesystem, script e chainloading. systemd-boot è un boot manager UEFI più semplice che legge entry e immagini dalla ESP o da una Extended Boot Loader Partition compatibile.

La gestione concreta dipende dalla distribuzione. Installazione del pacchetto, installazione nel firmware/disco e generazione delle entry sono operazioni distinte.

## Quando usarlo

- Selezionare kernel o sistema operativo al boot.
- Provare temporaneamente parametri kernel.
- Verificare entry, ESP e file caricati.
- Rigenerare configurazioni dopo modifiche controllate.
- Recuperare un sistema con configurazione o percorso errato.

## Come funziona

GRUB carica moduli e legge normalmente `/boot/grub/grub.cfg` o un percorso equivalente. Questo file è spesso generato da `grub-mkconfig` usando configurazioni e script della distribuzione; modificarlo direttamente produce cambiamenti fragili che possono essere sovrascritti.

systemd-boot funziona soltanto in UEFI. Legge entry Boot Loader Specification e può avviare kernel, initramfs o Unified Kernel Image. `bootctl` ispeziona stato, loader e entry.

Una Unified Kernel Image combina in un singolo eseguibile EFI componenti come kernel, initrd e command line, con possibilità di firma come unità. Non equivale automaticamente a un boot verificato: chiavi e policy Secure Boot devono essere configurate.

## API / Sintassi

Mostrare lo stato di systemd-boot e della ESP rilevata:

```bash
bootctl status
```

Elencare entry conosciute da `bootctl`:

```bash
bootctl list
```

Mostrare le entry GRUB generate senza modificarle:

```bash
grep '^menuentry ' /boot/grub/grub.cfg
```

Controllare la sintassi di una configurazione GRUB generata in un file temporaneo:

```bash
sudo grub-mkconfig -o /tmp/grub.cfg.test
```

Mostrare i file kernel e initramfs disponibili:

```bash
ls -lh /boot
```

Mostrare command line del kernel avviato:

```bash
cat /proc/cmdline
```

Mostrare entry e file gestiti da kernel-install:

```bash
kernel-install inspect
```

## Esempio pratico

Per provare un parametro in GRUB, selezionare una entry, usare la modifica temporanea dal menu, aggiungere il parametro alla riga `linux` e avviare senza salvare. Dopo il boot verificare:

```bash
cat /proc/cmdline
```

Controllare effetti e log:

```bash
journalctl -k -b
```

Solo dopo un test riuscito applicare il parametro nel punto configurato dalla distribuzione e rigenerare le entry con lo strumento previsto. Percorso di output e comando wrapper, come `update-grub`, variano.

## Varianti

- `update-grub` è un wrapper Debian per generare la configurazione GRUB.
- Fedora, Arch e altre distribuzioni usano percorsi e comandi differenti per `grub-mkconfig`.
- systemd-boot usa entry Type #1 testuali e Type #2 Unified Kernel Image.
- Shim permette catene Secure Boot con chiavi e componenti firmati nell'ecosistema della distribuzione.
- `kernel-install` automatizza aggiunta e rimozione di immagini e entry tramite plugin.
- Firmware UEFI può avviare direttamente un kernel con EFI stub in configurazioni appropriate.

## Errori comuni

- Modificare direttamente `grub.cfg` e perdere le modifiche al prossimo aggiornamento.
- Eseguire `grub-install` con target o piattaforma copiati da un'altra macchina.
- Rigenerare la configurazione nel percorso sbagliato.
- Aggiornare il bootloader senza verificare che ESP o `/boot` siano montati.
- Rimuovere il kernel precedente prima di provare quello nuovo.
- Confondere `bootctl install` con la creazione automatica di tutte le entry necessarie.
- Rendere permanente un parametro che impedisce l'avvio senza predisporre rollback.

## Checklist

- Firmware e piattaforma del bootloader sono identificati?
- ESP e `/boot` corretti sono montati?
- Quale strumento possiede e genera le entry?
- Kernel e initramfs referenziati esistono?
- La configurazione generata è stata verificata prima dell'installazione?
- Esiste una entry precedente funzionante?
- Secure Boot e firma dei componenti restano coerenti?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Processo di boot|Processo di boot]]
- [[Linux/Pagine/UEFI e BIOS|UEFI e BIOS]]
- [[Linux/Pagine/Initramfs|Initramfs]]
- [[Linux/Pagine/Parametri del kernel e sysctl|Parametri del kernel e sysctl]]

## Fonti

- [GNU GRUB Manual](https://www.gnu.org/software/grub/manual/grub/grub.html)
- [systemd-boot(7)](https://www.freedesktop.org/software/systemd/man/latest/systemd-boot.html)
- [bootctl(1)](https://www.freedesktop.org/software/systemd/man/latest/bootctl.html)
- [Boot Loader Specification](https://uapi-group.org/specifications/specs/boot_loader_specification/)
