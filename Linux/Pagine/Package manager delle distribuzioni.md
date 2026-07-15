---
date: 2026-07-13
area: Linux
topic: Ecosistemi dei package manager
type: theory-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, distribuzioni, package-manager, pacchetti, repository]
aliases: [Gestori pacchetti delle distribuzioni, Ecosistemi package manager]
prerequisites: [Distribuzioni Linux, Repository e package manager]
related: [apt dnf e pacman, Gestione pacchetti universali, Dipendenze e librerie condivise]
---

# Package manager delle distribuzioni

## Sintesi

Ogni distribuzione combina un formato di pacchetto, un database locale, repository, strumenti di risoluzione delle dipendenze e proprie policy di manutenzione. Il package manager non e quindi soltanto un comando per installare software: e il punto attraverso cui la distribuzione mantiene coerente il sistema.

Distribuzioni diverse possono condividere il formato `.rpm` o `.deb` senza rendere intercambiabili i rispettivi pacchetti. Versioni delle librerie, nomi, patch, script di installazione, struttura dei repository e ciclo di rilascio restano specifici della distribuzione.

## Problema che risolve

Installare manualmente file e librerie non registra in modo affidabile:

- quali file appartengono a un componente;
- quali dipendenze sono obbligatorie o opzionali;
- da quale repository proviene una versione;
- quali aggiornamenti di sicurezza la sostituiscono;
- quali script devono essere eseguiti durante installazione o rimozione;
- quali file di configurazione devono essere conservati.

L'ecosistema di packaging fornisce una transazione controllata e permette alla distribuzione di aggiornare componenti collegati senza trattarli come file indipendenti.

## Concetto chiave

Un ecosistema di pacchetti ha normalmente piu livelli:

```text
comando usato dall'amministratore
        |
solver e gestione repository
        |
database e formato dei pacchetti
        |
file, script e configurazioni installati
```

| Famiglia o distribuzione | Strumento principale | Livello o formato sottostante | Caratteristica da ricordare |
| --- | --- | --- | --- |
| Debian e derivate | APT | `dpkg`, pacchetti `.deb` | APT risolve repository e dipendenze; `dpkg` gestisce il singolo pacchetto locale |
| Fedora e famiglia RPM | DNF | RPM, pacchetti `.rpm` | DNF esegue transazioni e usa metadati dei repository RPM |
| openSUSE | Zypper | libzypp e RPM | condivide RPM, ma usa repository e strumenti diversi da Fedora |
| Arch Linux | pacman | pacchetti `.pkg.tar.zst` | sincronizza repository e database locale con un modello rolling release |
| Alpine Linux | apk | pacchetti `.apk` | progettato per un sistema minimale e non compatibile con pacchetti Debian o RPM |
| Gentoo | Portage | ebuild e compilazione da sorgente | risolve dipendenze e opzioni di build attraverso il modello ports-like |

La pagina [[Linux/Pagine/apt dnf e pacman|apt, dnf e pacman]] raccoglie i comandi operativi dei tre strumenti piu comuni nel vault; questa nota ne descrive invece il ruolo nell'architettura della distribuzione.

## Dettagli importanti

### Formato e gestore non sono la stessa cosa

RPM definisce un formato e un database usati da piu distribuzioni. DNF e Zypper aggiungono risoluzione delle dipendenze e gestione dei repository secondo ecosistemi differenti. Allo stesso modo, `dpkg` installa pacchetti `.deb`, mentre APT pianifica operazioni che possono coinvolgere molti pacchetti.

### Il nome di un pacchetto puo cambiare

La stessa libreria o applicazione puo avere nomi differenti, essere divisa in sottopacchetti diversi o includere file diversi. I pacchetti di sviluppo possono terminare in `-dev` nelle distribuzioni Debian e in `-devel` in molte distribuzioni RPM.

### I repository fanno parte del contratto

Un pacchetto e costruito rispetto alle librerie e alle policy di una determinata release. Installare un pacchetto destinato a un'altra distribuzione o release puo superare il controllo del formato ma fallire a runtime, sovrascrivere file o rendere impossibile un aggiornamento coerente.

### Installazione e attivazione sono operazioni distinte

Un pacchetto puo installare una unita systemd senza abilitarla. Alcune distribuzioni applicano preset o script differenti, quindi non si deve presumere che un servizio sia gia attivo dopo l'installazione.

### I file locali hanno regole di conservazione

Durante gli aggiornamenti, i gestori possono preservare una configurazione locale, proporre una nuova versione o creare file con suffissi specifici. Prima di sostituirli bisogna confrontare la configurazione locale con quella distribuita dal nuovo pacchetto.

### I frontend non sostituiscono il database nativo

Software center e interfacce grafiche possono semplificare la ricerca, ma lo stato installato resta registrato dal gestore nativo. Cancellare manualmente file appartenenti a un pacchetto crea divergenza tra filesystem e database.

## Esempio

Identificare prima la distribuzione:

```bash
grep -E '^(ID|ID_LIKE|VERSION_ID)=' /etc/os-release
```

Su un sistema Debian, trovare quale pacchetto possiede un file:

```bash
dpkg-query --search /usr/bin/ssh
```

Su un sistema RPM, interrogare il database locale:

```bash
rpm --query --file /usr/bin/ssh
```

Su Arch Linux, interrogare pacman:

```bash
pacman --query --owns /usr/bin/ssh
```

Questi comandi rispondono alla stessa domanda, ma interrogano database e modelli di packaging diversi.

## Limiti

- Il package manager non protegge automaticamente da repository esterni non affidabili.
- Una firma valida prova la provenienza rispetto a una chiave configurata, non la qualita assoluta del software.
- I gestori non controllano tutti i file creati dall'applicazione in `/var`, nella home o su storage esterno.
- Flatpak, Snap, AppImage e container riducono alcune dipendenze dal sistema host, ma introducono altri repository, runtime e cicli di aggiornamento.
- Uno strumento disponibile su piu distribuzioni puo avere versioni, plugin e comportamenti differenti.

## Errori comuni

- Installare un `.rpm` di Fedora su openSUSE solo perche il formato coincide.
- Usare `dpkg -i` o `rpm -i` ignorando dipendenze e repository della distribuzione.
- Mescolare repository di release diverse per ottenere una singola versione piu recente.
- Cancellare manualmente file installati da un pacchetto.
- Rimuovere dipendenze automatiche senza leggere il piano della transazione.
- Confondere il nome del comando con l'intero ecosistema di packaging.
- Automatizzare analizzando output pensato per la lettura umana quando esiste un'interfaccia piu stabile.

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Distribuzioni Linux|Distribuzioni Linux]]
- [[Linux/Pagine/Repository e package manager|Repository e package manager]]
- [[Linux/Pagine/apt dnf e pacman|apt, dnf e pacman]]
- [[Linux/Pagine/Dipendenze e librerie condivise|Dipendenze e librerie condivise]]
- [[Linux/Pagine/Gestione pacchetti universali|Gestione pacchetti universali]]
- [[Linux/Pagine/Configurazioni specifiche delle distribuzioni|Configurazioni specifiche delle distribuzioni]]

## Fonti

- [Debian Reference - Package management](https://www.debian.org/doc/manuals/debian-reference/ch02.en.html)
- [DNF5 documentation](https://dnf5.readthedocs.io/en/latest/)
- [Arch Linux - pacman(8)](https://man.archlinux.org/man/pacman.8)
- [openSUSE Reference - Zypper](https://doc.opensuse.org/documentation/leap/reference/html/book-reference/cha-sw-cl.html)
