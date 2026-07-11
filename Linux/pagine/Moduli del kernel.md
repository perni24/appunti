---
date: 2026-07-11
area: Linux
topic: Moduli kernel
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, kernel, moduli, modprobe, driver]
aliases: [Kernel modules, Driver caricabili Linux]
prerequisites: [Processo di boot, Initramfs]
related: [Compilazione del kernel, Parametri del kernel e sysctl]
---

# Moduli del kernel

## Sintesi

Un modulo è codice caricabile nel kernel in esecuzione, spesso usato per driver, filesystem e protocolli. I moduli della release corrente risiedono normalmente sotto `/lib/modules/$(uname -r)` e devono essere compatibili con il kernel.

`modprobe` è preferibile a `insmod` perché risolve alias, dipendenze e configurazione. Un componente compilato direttamente nel kernel non appare in `lsmod` e non può essere rimosso come modulo.

## Quando usarlo

- Verificare se un driver è caricato o built-in.
- Consultare parametri, alias e dipendenze.
- Caricare temporaneamente un modulo.
- Configurare opzioni o blacklist al boot.
- Diagnosticare firma, versione o simboli incompatibili.

## Come funziona

kmod usa metadata generati da `depmod` per risolvere nomi e dipendenze. Udev e altri sottosistemi possono richiedere moduli tramite alias quando rilevano hardware.

File in `/etc/modprobe.d/*.conf` possono definire `options`, `alias`, `blacklist`, `softdep` e regole `install`. La blacklist impedisce alcune risoluzioni automatiche per alias, ma non è una barriera di sicurezza assoluta e non impedisce ogni caricamento esplicito o dipendenza.

Con Secure Boot o kernel lockdown, la policy può richiedere moduli firmati da una chiave attendibile.

## API / Sintassi

Elencare moduli caricati:

```bash
lsmod
```

Mostrare informazioni su un modulo:

```bash
modinfo nome_modulo
```

Mostrare parametri accettati:

```bash
modinfo -p nome_modulo
```

Caricare modulo e dipendenze:

```bash
sudo modprobe nome_modulo
```

Rimuovere modulo e dipendenze diventate inutilizzate:

```bash
sudo modprobe -r nome_modulo
```

Simulare ciò che farebbe modprobe:

```bash
modprobe --dry-run --verbose nome_modulo
```

Rigenerare metadata delle dipendenze:

```bash
sudo depmod -a
```

Mostrare i messaggi kernel relativi al caricamento:

```bash
journalctl -k -b
```

## Esempio pratico

Identificare il driver associato a un device PCI:

```bash
lspci -k
```

Ispezionare il modulo proposto:

```bash
modinfo nome_modulo
```

Simulare caricamento e dipendenze:

```bash
modprobe --dry-run --verbose nome_modulo
```

Caricarlo e controllare i log:

```bash
sudo modprobe nome_modulo
```

Una opzione persistente va aggiunta in un file `.conf` dedicato e, se il modulo serve nell'early boot, può richiedere anche la rigenerazione dell'initramfs.

## Varianti

- Parametri built-in devono spesso essere passati nella command line del kernel.
- `/sys/module/NOME/parameters/` espone parametri correnti; solo alcuni sono scrivibili runtime.
- Moduli DKMS vengono ricompilati per nuove release del kernel secondo hook del package manager.
- `modules-load.d` richiede caricamenti statici al boot quando l'autoload non basta.
- `modprobe.d` configura risoluzione e opzioni, non è equivalente a `modules-load.d`.
- `insmod` carica un file `.ko` preciso senza risolvere automaticamente dipendenze.

## Errori comuni

- Cercare in `lsmod` un driver compilato built-in.
- Usare `insmod` e ignorare dipendenze e alias.
- Rimuovere un modulo ancora usato da device o filesystem.
- Trattare `blacklist` come controllo di sicurezza completo.
- Copiare un `.ko` costruito per un'altra release kernel.
- Dimenticare initramfs dopo modifiche a driver necessari al boot.
- Ignorare errori di firma o `vermagic` nel journal kernel.

## Checklist

- Il componente è built-in o modulare?
- La release del modulo coincide con `uname -r`?
- Alias, dipendenze e parametri sono stati ispezionati?
- Il modulo è in uso prima della rimozione?
- Secure Boot richiede una firma attendibile?
- La configurazione deve essere runtime, persistente o inclusa nell'initramfs?
- I log kernel confermano il risultato?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Initramfs|Initramfs]]
- [[Linux/Pagine/Compilazione del kernel|Compilazione del kernel]]
- [[Linux/Pagine/Parametri del kernel e sysctl|Parametri del kernel e sysctl]]
- [[Linux/Pagine/Processo di boot|Processo di boot]]

## Fonti

- [Linux kernel - modules](https://docs.kernel.org/kbuild/modules.html)
- [modprobe(8)](https://man7.org/linux/man-pages/man8/modprobe.8.html)
- [modprobe.d(5)](https://man7.org/linux/man-pages/man5/modprobe.d.5.html)
- [modinfo(8)](https://man7.org/linux/man-pages/man8/modinfo.8.html)
