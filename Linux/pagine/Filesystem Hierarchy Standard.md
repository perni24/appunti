---
date: 2026-07-11
area: Linux
topic: Filesystem Hierarchy Standard
type: technical-note
status: "non revisionato"
difficulty: base
tags: [linux, fhs, filesystem, directory]
aliases: [FHS, Gerarchia filesystem Linux]
prerequisites: [Architettura Linux]
related: [Terminale e comandi fondamentali, Variabili ambiente e PATH]
---

# Filesystem Hierarchy Standard

## Sintesi

Il Filesystem Hierarchy Standard, o FHS, descrive scopo e contenuto dei principali percorsi dei sistemi Unix-like. Aiuta software, amministratori e documentazione a trovare programmi, configurazioni, dati variabili e file temporanei in posizioni prevedibili.

FHS è una specifica, non una regola applicata dal kernel. Le distribuzioni possono adottarla con differenze, estensioni o layout moderni come merged `/usr`.

## Quando usarlo

- Capire dove cercare configurazioni, log, binari e dati applicativi.
- Scegliere dove installare software locale.
- Diagnosticare filesystem pieni o mount non disponibili.
- Scrivere script che rispettano le convenzioni Linux.
- Distinguere file persistenti, temporanei e generati a runtime.

## Come funziona

Tutto parte dalla directory radice `/`. Altri filesystem e dispositivi vengono collegati alla stessa gerarchia tramite mount point.

| Percorso | Scopo principale |
| --- | --- |
| `/` | radice dell'intera gerarchia |
| `/boot` | kernel, initramfs e file del bootloader |
| `/etc` | configurazione specifica della macchina |
| `/home` | dati e configurazioni personali degli utenti |
| `/root` | home dell'utente root |
| `/usr` | programmi, librerie e dati condivisibili in sola lettura |
| `/usr/local` | software installato localmente dall'amministratore |
| `/var` | dati variabili come log, cache, spool e database |
| `/run` | stato volatile creato dal boot corrente |
| `/tmp` | file temporanei, con policy di pulizia variabile |
| `/dev` | nodi dei dispositivi gestiti dinamicamente |
| `/proc` | vista virtuale su processi e parametri del kernel |
| `/sys` | dispositivi, driver e oggetti del kernel |
| `/mnt` | mount temporanei effettuati dall'amministratore |
| `/media` | mount di supporti rimovibili |
| `/opt` | pacchetti applicativi aggiuntivi e autocontenuti |
| `/srv` | dati serviti dalla macchina, secondo policy locale |

### Dati persistenti e volatili

- `/etc`, `/home` e gran parte di `/var` devono sopravvivere al riavvio.
- `/run` descrive lo stato del boot corrente ed è normalmente volatile.
- `/proc` e `/sys` sono filesystem virtuali alimentati dal kernel.
- `/tmp` non deve essere usato come archivio affidabile: può essere pulito automaticamente.

### Merged usr

Molte distribuzioni moderne rendono `/bin`, `/sbin` e `/lib` collegamenti verso le rispettive directory sotto `/usr`. Per esempio `/bin` può puntare a `/usr/bin`. Questo non cambia lo scopo logico dei comandi essenziali, ma evita duplicazioni tra gerarchie storiche.

## API / Sintassi

Mostrare tipo, permessi e destinazione degli eventuali link principali:

```bash
ls -ld /bin /sbin /lib /usr/bin /usr/sbin
```

Visualizzare filesystem e mount point attivi:

```bash
findmnt
```

Controllare lo spazio disponibile per filesystem:

```bash
df -h
```

Misurare lo spazio occupato dalle directory direttamente sotto `/var`:

```bash
sudo du -xhd1 /var
```

## Esempio pratico

Per diagnosticare un servizio, separa configurazione, stato runtime e log.

Controlla i file di configurazione:

```bash
ls -la /etc
```

Controlla lo stato volatile del servizio:

```bash
ls -la /run
```

Controlla log e dati variabili:

```bash
ls -la /var/log
```

Non cercare automaticamente tutto nella directory del programma: su Linux eseguibile, configurazione e dati sono spesso separati.

## Varianti

- **Software della distribuzione**: normalmente installato sotto `/usr` e gestito dal package manager.
- **Software locale dell'amministratore**: usa `/usr/local` per evitare conflitti con i pacchetti della distribuzione.
- **Applicazioni autocontenute**: possono usare una directory dedicata sotto `/opt`.
- **Dati utente conformi a XDG**: configurazione, dati e cache possono essere separati sotto `~/.config`, `~/.local/share` e `~/.cache`.
- **Container e immagini minimali**: possono contenere solo una parte della gerarchia tradizionale.
- **Layout systemd**: aggiunge convenzioni moderne senza rendere FHS identico su ogni distribuzione.

## Errori comuni

- Salvare dati persistenti in `/run` o affidarsi a `/tmp` come archivio.
- Installare manualmente file in `/usr/bin` sovrascrivendo quelli del package manager.
- Considerare `/proc`, `/sys` e `/dev` come normali directory su disco.
- Cercare ogni configurazione in `/etc`: molte applicazioni utente usano la home.
- Confondere spazio libero del filesystem root con quello di un mount separato.
- Eliminare file sotto `/var` senza capire quale servizio li gestisce.

## Checklist

- Il percorso contiene configurazione, dati, cache, log o stato runtime?
- Il file deve sopravvivere al riavvio?
- È gestito dalla distribuzione, dall'amministratore o dall'utente?
- Il percorso appartiene a un filesystem montato separatamente?
- Esiste una convenzione XDG o specifica dell'applicazione?
- Il package manager possiede già il file che vuoi modificare?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Architettura Linux kernel shell e user space|Architettura Linux]]
- [[Linux/Pagine/Terminale e comandi fondamentali|Terminale e comandi fondamentali]]
- [[Linux/Pagine/Variabili ambiente e PATH|Variabili d'ambiente e PATH]]

## Fonti

- [Linux Foundation - Filesystem Hierarchy Standard 3.0](https://refspecs.linuxfoundation.org/FHS_3.0/fhs/index.html)
- [systemd - File hierarchy](https://www.freedesktop.org/software/systemd/man/latest/file-hierarchy.html)
- [XDG Base Directory Specification](https://specifications.freedesktop.org/basedir-spec/latest/)
