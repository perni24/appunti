---
date: 2026-07-11
area: Linux
topic: Permessi filesystem
type: technical-note
status: "non revisionato"
difficulty: base
tags: [linux, permessi, chmod, chown, umask, setgid]
aliases: [Permessi Linux, chmod chown umask]
prerequisites: [File directory e link, Gestione utenti]
related: [ACL e permessi avanzati, sudo e privilegi amministrativi]
---

# Permessi chmod, chown e umask

## Sintesi

Il modello tradizionale dei permessi Linux assegna a ogni file un proprietario, un gruppo e tre insiemi di autorizzazioni: utente proprietario (`u`), gruppo (`g`) e altri (`o`). `chmod` modifica i bit di accesso, `chown` cambia proprietario o gruppo e `umask` limita i permessi iniziali dei nuovi oggetti.

I permessi su una directory hanno un significato diverso da quelli su un file: lettura consente di elencare i nomi, scrittura di creare o rimuovere voci, esecuzione di attraversare la directory e accedere agli oggetti conosciuti.

## Quando usarlo

- Rendere eseguibile uno script.
- Proteggere file personali o segreti applicativi.
- Condividere una directory tra membri di un gruppo.
- Correggere proprietà errate dopo una copia o un'operazione amministrativa.
- Definire i permessi predefiniti di una sessione o di un servizio.

## Come funziona

| Bit | File regolare | Directory | Valore |
| --- | --- | --- | --- |
| `r` | leggere il contenuto | elencare i nomi | 4 |
| `w` | modificare il contenuto | creare, rinominare e rimuovere voci | 2 |
| `x` | eseguire il file | attraversare la directory | 1 |

La forma ottale somma i valori per proprietario, gruppo e altri. `640`, per esempio, equivale a `rw-r-----`. La forma simbolica esprime modifiche come `u+x`, `g-w` o assegnazioni complete come `u=rw,go=r`.

I bit speciali sono:

- **setuid** (`4xxx`): un eseguibile parte con l'UID effettivo del proprietario;
- **setgid** (`2xxx`): su un eseguibile agisce sul GID effettivo; su una directory fa ereditare il gruppo ai nuovi oggetti;
- **sticky bit** (`1xxx`): su una directory condivisa limita la rimozione e la rinomina agli utenti autorizzati, tipicamente proprietario del file, proprietario della directory o utente privilegiato.

La `umask` non assegna permessi direttamente: rimuove bit dal modo richiesto dal programma. In genere i file partono da `666` e le directory da `777`; con `umask 027` diventano normalmente `640` e `750`.

## API / Sintassi

Leggere i permessi in forma simbolica:

```bash
ls -ld percorso
```

Leggere i permessi in forma ottale:

```bash
stat -c '%a %A %U:%G %n' percorso
```

Assegnare permessi con forma simbolica:

```bash
chmod u=rw,g=r,o= documento.txt
```

Assegnare gli stessi permessi in forma ottale:

```bash
chmod 640 documento.txt
```

Aggiungere il bit di esecuzione al proprietario:

```bash
chmod u+x script.sh
```

Cambiare proprietario e gruppo:

```bash
chown luca:sviluppatori documento.txt
```

Cambiare solo il gruppo:

```bash
chgrp sviluppatori documento.txt
```

Mostrare la `umask` corrente in forma simbolica:

```bash
umask -S
```

Impostare la `umask` della shell corrente:

```bash
umask 027
```

## Esempio pratico

Creare una directory condivisa dal gruppo:

```bash
sudo mkdir -p /srv/progetto
```

Assegnarla al gruppo di lavoro:

```bash
sudo chown root:sviluppatori /srv/progetto
```

Consentire accesso completo a proprietario e gruppo, escludendo gli altri, e attivare setgid:

```bash
sudo chmod 2770 /srv/progetto
```

Verificare il risultato:

```bash
stat -c '%A %U:%G %n' /srv/progetto
```

Il carattere `s` nella posizione di esecuzione del gruppo indica setgid. I nuovi file erediteranno il gruppo `sviluppatori`, ma i relativi bit di accesso continueranno a dipendere dal programma e dalla `umask` dell'utente.

## Varianti

- `chmod --reference=file-modello destinazione` copia i bit di permesso da un altro file.
- `install -m` crea o copia un oggetto applicando modalità e proprietà in modo esplicito.
- `find` può applicare modalità diverse a file e directory, evitando un `chmod -R` indiscriminato.
- Le ACL aggiungono autorizzazioni per utenti e gruppi specifici oltre alle tre classi tradizionali.
- SELinux e AppArmor possono negare un accesso anche quando i bit POSIX sembrano consentirlo.

## Errori comuni

- Usare `chmod 777` per aggirare un problema senza comprenderne la causa.
- Applicare ricorsivamente lo stesso modo a file e directory: i file non devono diventare tutti eseguibili.
- Confondere il permesso di scrittura sul file con la possibilità di eliminarlo, che dipende dalla directory padre.
- Dimenticare il permesso `x` su una directory presente nel percorso.
- Usare `chown -R` su una destinazione non verificata o seguendo link in modo inatteso.
- Pensare che `umask 027` produca sempre lo stesso risultato: il modo iniziale richiesto dall'applicazione rimane determinante.
- Impostare setuid su script: su Linux viene normalmente ignorato e introduce aspettative di sicurezza errate.

## Checklist

- Quale identità effettiva accede al file?
- Quali permessi servono davvero a proprietario, gruppo e altri?
- Per una directory sono presenti i bit di attraversamento necessari?
- Proprietario e gruppo sono corretti?
- La `umask` è coerente con il livello di condivisione richiesto?
- L'operazione ricorsiva distingue file e directory?
- ACL, mount option o sistemi MAC aggiungono altri vincoli?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/File directory e link|File, directory e link]]
- [[Linux/Pagine/Gestione utenti|Gestione utenti, gruppi e permessi]]
- [[Linux/Pagine/ACL e permessi avanzati|ACL e permessi avanzati]]
- [[Linux/Pagine/sudo e privilegi amministrativi|sudo e privilegi amministrativi]]

## Fonti

- [GNU Coreutils - File permissions](https://www.gnu.org/software/coreutils/manual/html_node/File-permissions.html)
- [GNU Coreutils - chmod](https://www.gnu.org/software/coreutils/manual/html_node/chmod-invocation.html)
- [GNU Coreutils - chown](https://www.gnu.org/software/coreutils/manual/html_node/chown-invocation.html)
- [Linux man-pages - umask(2)](https://man7.org/linux/man-pages/man2/umask.2.html)
