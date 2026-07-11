---
date: 2026-07-11
area: Linux
topic: Gestione pacchetti
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, repository, package-manager, pacchetti, sicurezza]
aliases: [Repository Linux, Gestione pacchetti Linux]
prerequisites: [Distribuzioni Linux, sudo e privilegi amministrativi]
related: [apt dnf e pacman, Dipendenze e librerie condivise, Gestione pacchetti universali]
---

# Repository e package manager

## Sintesi

Un repository distribuisce pacchetti, metadati, dipendenze e informazioni di integrità per una distribuzione. Il package manager sincronizza i metadati, risolve una transazione, verifica provenienza e integrità, quindi installa, aggiorna o rimuove file mantenendo un database locale.

Usare un package manager non significa fidarsi soltanto del programma: la sicurezza dipende dalle chiavi configurate, dalla provenienza del repository e dalla correttezza dei pacchetti firmati dal soggetto considerato attendibile.

## Quando usarlo

- Installare software integrato con la distribuzione.
- Applicare aggiornamenti e correzioni di sicurezza.
- Risolvere dipendenze e conflitti tra pacchetti.
- Individuare quale pacchetto possiede un file.
- Rimuovere software mantenendo coerente il database locale.

## Come funziona

Componenti principali:

| Componente | Ruolo |
| --- | --- |
| repository | pubblica pacchetti e metadati |
| mirror | replica il contenuto del repository |
| metadata cache | indice locale di versioni e dipendenze disponibili |
| package database | registra pacchetti e file installati |
| trust store | contiene chiavi o certificati considerati attendibili |
| solver | calcola installazioni, aggiornamenti, rimozioni e conflitti |

Una firma valida dimostra che i metadati o il pacchetto provengono da una chiave fidata e non sono stati alterati dopo la firma. Non dimostra che il software sia privo di vulnerabilità o che il maintainer sia affidabile in assoluto.

I repository della distribuzione sono costruiti come insieme coerente. Mescolare release, repository di distribuzioni diverse o sorgenti non compatibili può costringere il solver a combinazioni non testate. Repository di terze parti aumentano inoltre la superficie di fiducia e possono sostituire pacchetti ufficiali in base a priorità e versioni.

## API / Sintassi

Su Debian e derivate, aggiornare i metadati configurati:

```bash
sudo apt update
```

Su Fedora e sistemi DNF, elencare i repository:

```bash
dnf repolist --all
```

Su Arch Linux, mostrare i repository e le opzioni configurate:

```bash
pacman-conf
```

Verificare quale pacchetto Debian possiede un file installato:

```bash
dpkg-query -S /usr/bin/grep
```

Verificare quale pacchetto RPM possiede un file installato:

```bash
rpm -qf /usr/bin/grep
```

Verificare il proprietario di un file con pacman:

```bash
pacman -Qo /usr/bin/grep
```

## Esempio pratico

Prima di aggiungere un repository esterno, identificare la distribuzione e la release:

```bash
cat /etc/os-release
```

Elencare le sorgenti APT configurate nei formati tradizionale e deb822:

```bash
grep -RhsE '^(deb |Types:|URIs:|Suites:)' /etc/apt/sources.list /etc/apt/sources.list.d/
```

Controllare candidati e provenienza di un pacchetto APT:

```bash
apt-cache policy nome-pacchetto
```

Esaminare sempre documentazione del fornitore, fingerprint della chiave, release supportata e priorità prima di autorizzare una nuova sorgente.

## Varianti

- APT usa `dpkg` come livello di gestione dei pacchetti Debian installati.
- DNF gestisce pacchetti RPM e usa librerie di risoluzione e database RPM.
- pacman usa `libalpm` e pacchetti Arch, con configurazione in `/etc/pacman.conf`.
- Repository sorgente pubblicano materiali per ricostruire pacchetti, distinti dai binari pronti.
- Pinning e priorità selezionano versioni tra più sorgenti, ma aumentano la complessità.
- Flatpak, Snap e AppImage hanno modelli di distribuzione diversi dal package manager nativo.

## Errori comuni

- Disabilitare la verifica delle firme per superare un errore di fiducia.
- Aggiungere chiavi globalmente quando il gestore permette di limitarle a un singolo repository.
- Mescolare release stable, testing e unstable senza una policy esplicita.
- Confondere aggiornamento dei metadati con aggiornamento dei pacchetti installati.
- Installare file `.deb` o `.rpm` casuali senza verificarne origine e compatibilità.
- Rimuovere manualmente file appartenenti a un pacchetto, rendendo incoerente il database.
- Presumere che il nome di un pacchetto sia uguale tra distribuzioni.

## Checklist

- Il repository supporta distribuzione, release e architettura in uso?
- La chiave è stata ottenuta e verificata tramite un canale attendibile?
- La fiducia è limitata al repository corretto?
- Priorità e possibili sostituzioni di pacchetti sono comprese?
- Il piano della transazione è stato letto prima di confermare?
- Esiste una procedura per rimuovere repository e pacchetti correlati?
- Il sistema rimane allineato a una combinazione supportata di repository?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/apt dnf e pacman|apt, dnf e pacman]]
- [[Linux/Pagine/Dipendenze e librerie condivise|Dipendenze e librerie condivise]]
- [[Linux/Pagine/Gestione pacchetti universali|Gestione pacchetti universali]]
- [[Linux/Pagine/Compilazione da sorgente|Compilazione da sorgente]]

## Fonti

- [Debian Administrator's Handbook - APT](https://www.debian.org/doc/manuals/debian-handbook/apt.en.html)
- [DNF Command Reference](https://dnf.readthedocs.io/en/stable/command_ref.html)
- [Arch Linux - pacman(8)](https://man.archlinux.org/man/pacman.8)
- [ArchWiki - Package signing](https://wiki.archlinux.org/title/Pacman/Package_signing)
