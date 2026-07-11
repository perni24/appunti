---
date: 2026-07-11
area: Linux
topic: Build del kernel Linux
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, kernel, compilazione, kbuild, configurazione]
aliases: [Compilare il kernel Linux, Kernel custom]
prerequisites: [Compilazione da sorgente, Moduli del kernel, Bootloader GRUB e systemd-boot]
related: [Initramfs, Parametri del kernel e sysctl, UEFI e BIOS]
---

# Compilazione del kernel

## Sintesi

Compilare il kernel significa selezionare una configurazione, costruire immagine e moduli, installarli e integrare initramfs e bootloader. La build riuscita non garantisce un sistema avviabile: driver di storage, root filesystem, firmware, firme e command line devono essere coerenti.

Per uso ordinario è preferibile il kernel pacchettizzato dalla distribuzione, che riceve aggiornamenti, patch e integrazione. Un kernel personalizzato è giustificato da sviluppo, hardware, feature o ricerca specifici.

## Quando usarlo

- Sviluppare o testare modifiche kernel.
- Abilitare una feature non fornita dalla distribuzione.
- Costruire per hardware o ambiente controllato.
- Riprodurre un bug su una release precisa.
- Creare pacchetti kernel con configurazione versionata.

## Come funziona

Kbuild legge `Kconfig` e `.config`, genera header e oggetti, collega l'immagine e costruisce i moduli selezionati con `=m`. `O=build` mantiene gli output fuori dall'albero sorgente.

Target di configurazione comuni:

| Target | Uso |
| --- | --- |
| `defconfig` | configurazione predefinita dell'architettura |
| `olddefconfig` | aggiorna una configurazione esistente usando default per nuove opzioni |
| `menuconfig` | interfaccia testuale di configurazione |
| `localmodconfig` | riduce in base ai moduli osservati, con rischio di escludere hardware non presente |

Driver necessari per raggiungere la root devono essere built-in oppure inclusi nell'initramfs. L'installazione deve produrre nomi univoci, moduli sotto `/lib/modules/RELEASE`, immagine, eventuale initramfs e entry di boot.

## API / Sintassi

Mostrare compilatore e versione richiesti dalla documentazione della release:

```bash
make help
```

Creare la directory di output:

```bash
mkdir -p build
```

Usare come base la configurazione del kernel corrente, se disponibile:

```bash
cp "/boot/config-$(uname -r)" build/.config
```

Aggiornare la configurazione per la nuova sorgente:

```bash
make O=build olddefconfig
```

Aprire la configurazione interattiva:

```bash
make O=build menuconfig
```

Compilare in parallelo:

```bash
make O=build -j"$(nproc)"
```

Installare i moduli della release costruita:

```bash
sudo make O=build modules_install
```

Mostrare la release generata:

```bash
make O=build kernelrelease
```

## Esempio pratico

Identificare esattamente le sorgenti:

```bash
git describe --always --dirty
```

Conservare la configurazione risultante insieme alla build:

```bash
cp build/.config config-kernel-test
```

Costruire pacchetti Debian quando il target è supportato e appropriato:

```bash
make O=build -j"$(nproc)" bindeb-pkg
```

Installare tramite pacchetti nativi rende più tracciabili file, aggiornamenti e rimozione rispetto a una copia manuale. Per altre distribuzioni usare gli strumenti di packaging previsti.

Dopo l'installazione verificare initramfs, entry di boot e presenza del vecchio kernel prima del riavvio.

## Varianti

- `LOCALVERSION=-test` distingue la release e impedisce collisioni con moduli esistenti.
- `ccache` può accelerare ricompilazioni, con configurazione esplicita.
- Cross-compilation usa `ARCH` e `CROSS_COMPILE` coerenti con il target.
- LLVM può essere selezionato con le opzioni Kbuild supportate dalla release.
- Moduli esterni usano l'interfaccia kbuild contro gli header o il tree preparato.
- QEMU e una console seriale permettono test prima dell'hardware reale.

## Errori comuni

- Sovrascrivere l'unico kernel funzionante.
- Copiare `.config` senza eseguire `olddefconfig` e rivedere le nuove opzioni.
- Rendere modulare un driver necessario prima che l'initramfs possa caricarlo.
- Usare `localmodconfig` e perdere supporto per hardware scollegato o recovery.
- Installare moduli ma non immagine, initramfs o entry del bootloader.
- Ignorare firma moduli e Secure Boot.
- Costruire e installare come root quando i privilegi servono soltanto nella fase finale.

## Checklist

- Sorgente, release e firma sono state verificate?
- `.config` è versionata e revisionata?
- Driver per storage, root e console sono built-in o nell'initramfs?
- La release ha un nome univoco?
- Build e test terminano senza errori?
- Moduli, immagine, initramfs e boot entry corrispondono?
- Il kernel precedente e un accesso di recupero restano disponibili?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Compilazione da sorgente|Compilazione da sorgente]]
- [[Linux/Pagine/Moduli del kernel|Moduli del kernel]]
- [[Linux/Pagine/Initramfs|Initramfs]]
- [[Linux/Pagine/Bootloader GRUB e systemd-boot|Bootloader GRUB e systemd-boot]]
- [[Linux/Pagine/UEFI e BIOS|UEFI e BIOS]]

## Fonti

- [Linux kernel - build system](https://docs.kernel.org/kbuild/)
- [Linux kernel - configuration targets](https://docs.kernel.org/kbuild/kconfig.html)
- [Linux kernel - compiling](https://docs.kernel.org/admin-guide/README.html)
- [Linux kernel releases](https://www.kernel.org/)
