---
date: 2026-07-11
area: Linux
topic: Access Control List
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, acl, permessi, setfacl, getfacl]
aliases: [ACL Linux, POSIX ACL]
prerequisites: [Permessi chmod chown e umask, Gestione utenti]
related: [sudo e privilegi amministrativi, File directory e link]
---

# ACL e permessi avanzati

## Sintesi

Le POSIX ACL estendono i permessi tradizionali permettendo di assegnare autorizzazioni a utenti e gruppi aggiuntivi senza cambiare proprietario o gruppo principale del file. Ogni ACL di accesso può contenere voci per proprietario, utenti nominati, gruppo proprietario, gruppi nominati, mask e altri.

Le directory possono avere anche una ACL predefinita, usata come base per gli oggetti creati al loro interno. La mask limita i permessi effettivi delle voci per utenti nominati, gruppo proprietario e gruppi nominati.

## Quando usarlo

- Concedere accesso a un singolo utente esterno al gruppo proprietario.
- Gestire directory condivise da più gruppi con diritti diversi.
- Ereditare una policy di accesso sui nuovi file di una directory.
- Evitare gruppi aggiuntivi creati soltanto per una singola eccezione.
- Diagnosticare permessi apparentemente corretti ma limitati dalla mask ACL.

## Come funziona

Un'ACL estesa tipica contiene:

```text
user::rwx
user:mario:r-x
group::r-x
group:revisori:r--
mask::r-x
other::---
```

`user::` indica il proprietario, mentre `user:mario:` è una voce nominata. `group::` identifica il gruppo proprietario. La `mask::` rappresenta il massimo accesso effettivo per tutte le voci di gruppo e per gli utenti nominati; non limita il proprietario né `other`.

Nei permessi mostrati da `ls -l`, un `+` dopo i bit segnala normalmente la presenza di ACL estese. Quando esiste un'ACL estesa, i bit del gruppo visualizzati rappresentano la mask, non necessariamente la sola voce del gruppo proprietario.

Una default ACL si applica soltanto alle directory e viene ereditata dai nuovi oggetti. Non modifica retroattivamente quelli già presenti e interagisce con il modo richiesto dal programma che crea il file.

## API / Sintassi

Visualizzare ACL e permessi effettivi:

```bash
getfacl documento.txt
```

Concedere lettura e scrittura a un utente nominato:

```bash
setfacl -m u:mario:rw- documento.txt
```

Concedere lettura a un gruppo nominato:

```bash
setfacl -m g:revisori:r-- documento.txt
```

Impostare esplicitamente la mask:

```bash
setfacl -m m::rw- documento.txt
```

Rimuovere la voce di un utente nominato:

```bash
setfacl -x u:mario documento.txt
```

Rimuovere tutte le voci ACL estese mantenendo i permessi di base:

```bash
setfacl -b documento.txt
```

Impostare una voce predefinita su una directory:

```bash
setfacl -m d:u:mario:rwx /srv/progetto
```

Visualizzare l'ACL senza attraversare link simbolici passati come argomento:

```bash
getfacl -h documento.txt
```

## Esempio pratico

Concedere al gruppo `sviluppatori` accesso completo alla directory esistente:

```bash
sudo setfacl -m g:sviluppatori:rwx /srv/progetto
```

Definire per lo stesso gruppo l'accesso ereditato dai nuovi oggetti:

```bash
sudo setfacl -m d:g:sviluppatori:rwx /srv/progetto
```

Assicurare una mask di accesso coerente sulla directory:

```bash
sudo setfacl -m m::rwx /srv/progetto
```

Assicurare una mask coerente anche nella default ACL:

```bash
sudo setfacl -m d:m::rwx /srv/progetto
```

Controllare ACL di accesso, ACL predefinita e permessi effettivi:

```bash
getfacl /srv/progetto
```

Queste modifiche non aggiornano automaticamente i file già contenuti nella directory. Prima di un'applicazione ricorsiva occorre stabilire se file e sottodirectory richiedono diritti differenti.

## Varianti

- `setfacl -R` applica modifiche ricorsive, ma richiede attenzione a link, mount point e differenze tra file e directory.
- `setfacl --mask` ricalcola la mask; `--no-mask` evita il ricalcolo automatico quando si vuole gestirla esplicitamente.
- `getfacl -R` può produrre un backup testuale ripristinabile con `setfacl --restore`.
- Gruppo proprietario più setgid è spesso più semplice quando tutti i collaboratori hanno gli stessi diritti.
- SELinux, AppArmor, attributi immutabili e opzioni di mount sono controlli distinti e possono ancora negare l'accesso.

## Errori comuni

- Dimenticare la mask: una voce può mostrare `rwx` ma avere permessi effettivi inferiori.
- Configurare soltanto la default ACL e aspettarsi che cambi la directory o i file già esistenti.
- Configurare soltanto l'ACL di accesso e aspettarsi che venga ereditata.
- Usare `chmod` senza controllare l'ACL risultante: la modifica dei bit del gruppo può cambiare la mask e quindi i permessi effettivi.
- Applicare ACL ricorsive senza distinguere il bit `x` necessario alle directory.
- Usare ACL dove un gruppo Unix e setgid offrirebbero una policy più semplice da comprendere.
- Diagnosticare l'accesso guardando solo il file finale e non tutte le directory del percorso.

## Checklist

- I permessi tradizionali e i gruppi non sono sufficienti?
- L'ACL riguarda un oggetto esistente, i nuovi oggetti o entrambi?
- La mask consente i permessi richiesti?
- `getfacl` mostra commenti `effective` inattesi?
- Le directory del percorso sono attraversabili dall'utente?
- File e directory richiedono modalità differenti prima di un'operazione ricorsiva?
- Esistono controlli ulteriori come SELinux, AppArmor o attributi del filesystem?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/File directory e link|File, directory e link]]
- [[Linux/Pagine/Gestione utenti|Gestione utenti, gruppi e permessi]]
- [[Linux/Pagine/Permessi chmod chown e umask|Permessi chmod, chown e umask]]
- [[Linux/Pagine/sudo e privilegi amministrativi|sudo e privilegi amministrativi]]

## Fonti

- [Linux man-pages - acl(5)](https://man7.org/linux/man-pages/man5/acl.5.html)
- [Linux man-pages - setfacl(1)](https://man7.org/linux/man-pages/man1/setfacl.1.html)
- [Linux man-pages - getfacl(1)](https://man7.org/linux/man-pages/man1/getfacl.1.html)
