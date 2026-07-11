---
date: 2026-07-11
area: Linux
topic: Avvio Linux
type: theory-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, boot, kernel, initramfs, systemd]
aliases: [Boot Linux, Sequenza di avvio Linux]
prerequisites: [Architettura Linux kernel shell e user space, systemd]
related: [UEFI e BIOS, Bootloader GRUB e systemd-boot, Initramfs]
---

# Processo di boot

## Sintesi

L'avvio Linux attraversa più livelli: firmware, boot manager o bootloader, kernel, initramfs, filesystem root e processo init. Ogni livello prepara il successivo e produce errori differenti; identificare l'ultimo livello raggiunto riduce il campo della diagnosi.

Con systemd, PID 1 costruisce una transazione di unit e ne avvia molte in parallelo. Il boot non è quindi sempre una lista rigidamente sequenziale di servizi.

## Problema che risolve

Il sistema deve passare da una macchina appena accesa, senza kernel Linux in esecuzione, a un ambiente con root filesystem, driver, servizi e login disponibili. Il modello a fasi permette di associare ogni errore al componente che può realmente causarlo.

## Concetto chiave

1. **Firmware**: inizializza hardware e seleziona una destinazione di boot.
2. **Bootloader**: carica kernel, initramfs e command line.
3. **Kernel**: inizializza CPU, memoria, driver e sottosistemi.
4. **Initramfs**: ambiente temporaneo che trova e prepara la root reale.
5. **Switch root**: trasferisce il sistema alla root definitiva.
6. **Init**: PID 1 avvia servizi, mount, login e target.

Il kernel riceve parametri come `root=`, `ro`, `quiet` o opzioni specifiche. Dopo aver montato la root, esegue il programma init configurato, normalmente systemd. Se il kernel non trova root o init, il processo si interrompe prima dei servizi ordinari.

## Dettagli importanti

Il firmware non legge necessariamente il filesystem Linux. In UEFI carica un eseguibile EFI dalla ESP; in modalità BIOS il codice iniziale del bootloader viene raggiunto tramite settori e strutture installate sul disco.

L'initramfs contiene strumenti e moduli necessari prima della root: storage, RAID, LVM, cifratura, driver e logica di discovery. Terminata la preparazione, esegue uno switch root e avvia PID 1 dalla root reale.

systemd attiva il target predefinito e le sue dipendenze. Mount locali, device, socket e servizi possono partire secondo dipendenze e ordinamento, non semplicemente nell'ordine visualizzato.

## Esempio

Mostrare kernel e release in esecuzione:

```bash
uname -a
```

Leggere la command line ricevuta dal kernel:

```bash
cat /proc/cmdline
```

Mostrare il target predefinito:

```bash
systemctl get-default
```

Mostrare durata complessiva delle fasi systemd:

```bash
systemd-analyze time
```

Mostrare la catena critica di ordinamento:

```bash
systemd-analyze critical-chain
```

Consultare errori del boot corrente:

```bash
journalctl -b -p err
```

Consultare soltanto messaggi del kernel:

```bash
journalctl -k -b
```

## Limiti

- La sequenza varia tra architetture, firmware, initramfs e sistemi init.
- Le unit systemd possono avviarsi in parallelo, quindi la durata non coincide sempre con una dipendenza bloccante.
- I log del sistema reale non includono necessariamente tutti i messaggi prodotti nell'initramfs.
- Un modello generale non sostituisce la procedura di recovery della distribuzione.

## Errori comuni

- Attribuire a systemd un errore avvenuto prima dell'avvio di PID 1.
- Confondere menu del firmware e menu del bootloader.
- Modificare parametri permanenti prima di provarli una sola volta dal menu.
- Interpretare `systemd-analyze blame` come prova della causa: mostra durata delle unit, non sempre il blocco critico.
- Ricostruire il bootloader quando manca invece un driver nell'initramfs.
- Dimenticare che il kernel in esecuzione può differire da quello appena installato.
- Nascondere messaggi con `quiet` durante il troubleshooting.

## Checklist

- Compare il firmware, il bootloader o già il kernel?
- Quale kernel e initramfs sono selezionati?
- La command line contiene root e parametri corretti?
- Il problema avviene prima o dopo lo switch root?
- PID 1 è stato avviato?
- Journal del boot e log kernel mostrano il primo errore rilevante?
- È disponibile una voce kernel precedente o un ambiente di recupero?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/UEFI e BIOS|UEFI e BIOS]]
- [[Linux/Pagine/Bootloader GRUB e systemd-boot|Bootloader GRUB e systemd-boot]]
- [[Linux/Pagine/Initramfs|Initramfs]]
- [[Linux/Pagine/systemd|systemd]]

## Fonti

- [Linux kernel - booting](https://docs.kernel.org/arch/x86/boot.html)
- [systemd bootup](https://www.freedesktop.org/software/systemd/man/latest/bootup.html)
- [systemd-analyze(1)](https://www.freedesktop.org/software/systemd/man/latest/systemd-analyze.html)
