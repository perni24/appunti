---
date: 2026-07-13
area: Linux
topic: Package manager nativi
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, apt, dnf, pacman, pacchetti]
aliases: [APT DNF pacman, Comandi package manager]
prerequisites: [Repository e package manager, sudo e privilegi amministrativi]
related: [Package manager delle distribuzioni, Dipendenze e librerie condivise, Compilazione da sorgente]
---

# apt, dnf e pacman

## Sintesi

APT, DNF e pacman gestiscono rispettivamente ecosistemi basati su pacchetti Debian, RPM e Arch. Le operazioni concettuali sono simili, ma comandi, database, policy di aggiornamento e distinzione tra dipendenze automatiche e pacchetti espliciti non sono intercambiabili.

Prima di confermare una transazione bisogna leggere pacchetti installati, aggiornati e rimossi. Comandi copiati tra distribuzioni senza comprenderne il modello possono causare rimozioni o aggiornamenti parziali.

## Quando usarlo

- Cercare e installare pacchetti dai repository configurati.
- Aggiornare il sistema in modo coerente.
- Consultare metadati e file installati.
- Rimuovere pacchetti e dipendenze non più necessarie.
- Diagnosticare dipendenze o provenienza di una versione.

## Come funziona

| Operazione | APT | DNF | pacman |
| --- | --- | --- | --- |
| aggiorna metadati | `apt update` | automatico o `dnf makecache` | incluso in `pacman -Syu` |
| aggiorna sistema | `apt upgrade` / `full-upgrade` | `dnf upgrade` | `pacman -Syu` |
| installa | `apt install` | `dnf install` | `pacman -S` |
| rimuove | `apt remove` | `dnf remove` | `pacman -R` |
| cerca | `apt search` | `dnf search` | `pacman -Ss` |

`apt` è un'interfaccia interattiva pratica; `apt-get` e `apt-cache` mantengono interfacce più orientate a script e compatibilità. DNF integra transazioni RPM e cronologia. pacman distingue pacchetti installati esplicitamente e come dipendenze.

Arch Linux supporta aggiornamenti completi del sistema: `pacman -Sy` aggiorna soltanto i database e, seguito dall'installazione di un pacchetto senza `-u`, può creare un aggiornamento parziale non supportato.

## API / Sintassi

### APT

Aggiornare i metadati:

```bash
sudo apt update
```

Aggiornare i pacchetti senza rimuoverne altri:

```bash
sudo apt upgrade
```

Consentire al solver anche rimozioni necessarie all'aggiornamento completo:

```bash
sudo apt full-upgrade
```

Installare un pacchetto:

```bash
sudo apt install nome-pacchetto
```

Rimuovere pacchetto e file di configurazione gestiti:

```bash
sudo apt purge nome-pacchetto
```

Rimuovere dipendenze automatiche non più necessarie:

```bash
sudo apt autoremove
```

### DNF

Aggiornare il sistema:

```bash
sudo dnf upgrade
```

Cercare un pacchetto:

```bash
dnf search termine
```

Installare un pacchetto:

```bash
sudo dnf install nome-pacchetto
```

Rimuovere un pacchetto con le dipendenze non più richieste secondo la policy:

```bash
sudo dnf remove nome-pacchetto
```

Mostrare la cronologia delle transazioni:

```bash
dnf history
```

### pacman

Sincronizzare database e aggiornare l'intero sistema:

```bash
sudo pacman -Syu
```

Cercare nei repository:

```bash
pacman -Ss termine
```

Installare un pacchetto dopo aver mantenuto il sistema aggiornato:

```bash
sudo pacman -S nome-pacchetto
```

Rimuovere pacchetto, dipendenze non più necessarie e file di configurazione non protetti:

```bash
sudo pacman -Rns nome-pacchetto
```

Elencare dipendenze orfane:

```bash
pacman -Qdt
```

## Esempio pratico

Prima di installare, consultare i dettagli del candidato APT:

```bash
apt show nome-pacchetto
```

Con DNF, mostrare informazioni e repository di provenienza:

```bash
dnf info nome-pacchetto
```

Con pacman, mostrare metadati del pacchetto nel repository:

```bash
pacman -Si nome-pacchetto
```

Dopo l'installazione, verificare i file con il database nativo invece di dedurli dalla posizione dell'eseguibile.

## Varianti

- `apt remove` conserva alcuni file di configurazione; `purge` rimuove quelli gestiti dal pacchetto, non dati arbitrari nella home.
- `apt-mark manual` impedisce che un pacchetto sia considerato dipendenza automatica rimovibile.
- DNF5 mantiene i casi d'uso principali ma alcune opzioni e plugin differiscono da DNF4.
- `dnf repoquery --whatrequires` interroga dipendenze inverse con il supporto appropriato.
- `pacman -Q` interroga pacchetti installati; `-S` interroga o modifica lo stato rispetto ai repository.
- Wrapper e frontend possono semplificare l'uso, ma il database nativo resta la fonte di verità.

## Errori comuni

- Eseguire `pacman -Sy` senza `-u` e poi installare pacchetti.
- Usare `autoremove` o rimozioni ricorsive senza leggere il piano proposto.
- Confondere `apt update` con l'aggiornamento dei pacchetti installati.
- Automatizzare analizzando l'output umano di `apt`, non garantito stabile per gli script.
- Cancellare cache o database per risolvere un errore senza comprenderne la causa.
- Interrompere una transazione durante modifiche critiche al database.
- Presumere che `remove`, `purge` e rimozione delle dipendenze abbiano la stessa semantica nei tre sistemi.

## Checklist

- Il comando appartiene alla distribuzione e versione in uso?
- I metadati e il sistema sono aggiornati in modo coerente?
- Il piano mostra rimozioni o downgrade inattesi?
- Il pacchetto proviene dal repository previsto?
- Configurazioni e dati applicativi che devono restare sono noti?
- Le dipendenze orfane sono state esaminate prima della rimozione?
- Per gli script è usata un'interfaccia adatta e non output umano fragile?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Package manager delle distribuzioni|Package manager delle distribuzioni]]
- [[Linux/Pagine/Repository e package manager|Repository e package manager]]
- [[Linux/Pagine/Dipendenze e librerie condivise|Dipendenze e librerie condivise]]
- [[Linux/Pagine/Compilazione da sorgente|Compilazione da sorgente]]
- [[Linux/Pagine/Gestione pacchetti universali|Gestione pacchetti universali]]

## Fonti

- [APT User's Guide](https://www.debian.org/doc/manuals/apt-guide/)
- [Debian Reference - Package management](https://www.debian.org/doc/manuals/debian-reference/ch02.en.html)
- [DNF Command Reference](https://dnf.readthedocs.io/en/stable/command_ref.html)
- [Arch Linux - pacman(8)](https://man.archlinux.org/man/pacman.8)
