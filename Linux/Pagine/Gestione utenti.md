---
date: 2026-07-11
area: Linux
topic: Utenti e permessi
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, utenti, gruppi, permessi, sudo]
aliases: [Gestione utenti Linux, Utenti gruppi e permessi]
prerequisites: [Terminale Linux, filesystem]
related: [Installazione Arch Linux, Indice Linux]
---

# Gestione utenti, gruppi e permessi

## Sintesi

Linux separa identità, gruppi, credenziali e autorizzazioni. Gli account sono identificati da UID e GID; i permessi tradizionali distinguono proprietario, gruppo e altri utenti, mentre `sudo` concede privilegi amministrativi secondo regole esplicite.

Gli strumenti come `useradd`, `usermod`, `passwd` e `groupmod` aggiornano in modo coordinato i database degli account. Evita di modificare direttamente `/etc/passwd`, `/etc/shadow`, `/etc/group` e `/etc/gshadow`.

## Quando usarlo

- Creazione di account personali o di servizio.
- Assegnazione di accesso amministrativo controllato.
- Gestione dell'accesso condiviso a file e directory.
- Blocco, scadenza o rimozione di un account.
- Diagnosi di errori `Permission denied`.

## Come funziona

Un utente possiede almeno:

- un nome e un UID;
- un gruppo primario e zero o più gruppi supplementari;
- una home directory opzionale;
- una shell di login;
- credenziali e policy di scadenza.

File principali:

| File | Contenuto |
| --- | --- |
| `/etc/passwd` | nome, UID, GID, home e shell |
| `/etc/shadow` | hash della password e scadenze |
| `/etc/group` | gruppi e membri supplementari |
| `/etc/gshadow` | informazioni protette sui gruppi |

I permessi classici sono espressi come lettura (`r`), scrittura (`w`) ed esecuzione (`x`) per proprietario (`u`), gruppo (`g`) e altri (`o`). Su una directory, `x` significa poterla attraversare, non eseguire un file.

## API / Sintassi

Creare un account con home directory e shell Bash:

```bash
useradd -m -s /bin/bash nomeutente
```

Assegnare la password:

```bash
passwd nomeutente
```

Visualizzare UID, GID e gruppi:

```bash
id nomeutente
```

Leggere l'account attraverso il database NSS configurato:

```bash
getent passwd nomeutente
```

Creare un gruppo:

```bash
groupadd sviluppatori
```

Aggiungere un utente senza sostituire gli altri gruppi supplementari:

```bash
usermod -aG sviluppatori nomeutente
```

Rimuovere un utente dal gruppo:

```bash
gpasswd -d nomeutente sviluppatori
```

Verificare i membri del gruppo:

```bash
getent group sviluppatori
```

L'opzione `-a` è essenziale con `usermod -G`: senza `-a`, l'elenco dei gruppi supplementari viene sostituito.

Assegnare ricorsivamente proprietario e gruppo alla directory di progetto:

```bash
chown -R nomeutente:sviluppatori /srv/progetto
```

Consentire accesso completo al proprietario, lettura e attraversamento al gruppo, applicando anche setgid:

```bash
chmod 2750 /srv/progetto
```

Impostare una `umask` restrittiva per la sessione corrente:

```bash
umask 027
```

Il bit setgid sulla directory (`2` in `2750`) fa ereditare ai nuovi file il gruppo della directory.

## Esempio pratico

Creare un amministratore appartenente a `wheel`:

```bash
useradd -m -G wheel -s /bin/bash luca
```

Assegnare la password:

```bash
passwd luca
```

Aprire un file sudoers dedicato con validazione sintattica:

```bash
EDITOR=nano visudo /etc/sudoers.d/10-wheel
```

Inserisci nel file:

```sudoers
%wheel ALL=(ALL:ALL) ALL
```

Validare la configurazione sudo:

```bash
visudo -c
```

Aprire una shell di login come nuovo utente:

```bash
su - luca
```

Verificare che `sudo` accetti le credenziali:

```bash
sudo -v
```

Controllare l'identità ottenuta tramite `sudo`:

```bash
sudo id
```

## Varianti

- **Account di servizio**: usa una home e una shell coerenti con il servizio, spesso `/usr/bin/nologin`.
- **Blocco temporaneo**: `usermod -L nomeutente`; lo sblocco usa `usermod -U nomeutente`.
- **Scadenza password**: gestibile con `chage`.
- **Rimozione account**: `userdel nomeutente`; aggiungi `-r` solo dopo aver verificato dati e ownership.
- **ACL**: `setfacl` e `getfacl` permettono autorizzazioni aggiuntive oltre al modello proprietario-gruppo-altri.
- **sudoers per singolo comando**: preferibile quando non serve accesso amministrativo completo.

## Errori comuni

- Scrivere `%wheel ALL=(ALL=(ALL)) ALL`: la sintassi corretta è `%wheel ALL=(ALL:ALL) ALL`.
- Modificare `sudoers` senza `visudo` e introdurre errori sintattici.
- Usare `usermod -G` senza `-a`, rimuovendo gruppi supplementari esistenti.
- Applicare `chmod 777` come soluzione generica a problemi di permessi.
- Eliminare una home directory senza aver verificato backup e file posseduti altrove.
- Assegnare shell interattive ad account di servizio che non devono effettuare login.
- Dimenticare che una nuova appartenenza a un gruppo richiede una nuova sessione di login o `newgrp`.

## Checklist

- UID, gruppo primario e gruppi supplementari sono corretti?
- La shell è presente in `/etc/shells` quando serve un login interattivo?
- Home e file appartengono all'utente corretto?
- I privilegi sudo sono minimi e validati con `visudo -c`?
- I permessi delle directory permettono l'attraversamento necessario?
- Sono necessarie ACL oppure bastano gruppo e setgid?
- Prima della rimozione sono stati controllati processi, file e backup dell'utente?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Installazione Arch Linux|Installazione Arch Linux]]
- [[Linux/Pagine/File directory e link|File, directory e link]]
- [[Linux/Pagine/Permessi chmod chown e umask|Permessi chmod, chown e umask]]
- [[Linux/Pagine/sudo e privilegi amministrativi|sudo e privilegi amministrativi]]
- [[Linux/Pagine/ACL e permessi avanzati|ACL e permessi avanzati]]

## Fonti

- [ArchWiki - Users and groups](https://wiki.archlinux.org/title/Users_and_groups)
- [ArchWiki - File permissions and attributes](https://wiki.archlinux.org/title/File_permissions_and_attributes)
- [ArchWiki - Sudo](https://wiki.archlinux.org/title/Sudo)
