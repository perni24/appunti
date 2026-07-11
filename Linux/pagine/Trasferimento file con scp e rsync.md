---
date: 2026-07-11
area: Linux
topic: Trasferimento file remoto
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, networking, scp, rsync, ssh]
aliases: [scp e rsync, Copia file via SSH]
prerequisites: [SSH, File directory e link]
related: [Pipe e ridirezioni, Permessi chmod chown e umask]
---

# Trasferimento file con scp e rsync

## Sintesi

`scp` copia file tra host usando SSH e nelle versioni OpenSSH moderne usa normalmente il protocollo SFTP. `rsync` confronta sorgente e destinazione, trasferisce differenze e offre controllo su attributi, esclusioni e cancellazioni.

Nessuno dei due sostituisce automaticamente un backup versionato. Una sincronizzazione con cancellazione può replicare immediatamente errori o rimozioni.

## Quando usarlo

- Copiare rapidamente uno o pochi file tramite SSH.
- Sincronizzare alberi di directory aggiornando soltanto differenze.
- Preservare attributi selezionati.
- Riprendere trasferimenti parziali.
- Simulare una sincronizzazione prima di applicarla.

## Come funziona

`scp` usa la sintassi `[utente@]host:percorso`. Il carattere `:` distingue un percorso remoto, quindi nomi ambigui richiedono attenzione.

Con `rsync`, lo slash finale della sorgente cambia il significato:

| Sorgente | Risultato concettuale |
| --- | --- |
| `dir` | copia la directory `dir` dentro la destinazione |
| `dir/` | copia il contenuto di `dir` nella destinazione |

`rsync -a` abilita modalità archivio e conserva molti attributi, ma non include automaticamente ACL, extended attribute, hard link o ownership utilizzabile senza permessi. Le opzioni vanno scelte secondo i dati.

## API / Sintassi

Copiare un file verso il server:

```bash
scp documento.txt utente@server.example:/srv/dati/
```

Scaricare un file remoto:

```bash
scp utente@server.example:/srv/dati/documento.txt .
```

Copiare ricorsivamente una directory con `scp`:

```bash
scp -r progetto utente@server.example:/srv/dati/
```

Sincronizzare il contenuto di una directory:

```bash
rsync -av progetto/ utente@server.example:/srv/progetto/
```

Simulare una sincronizzazione:

```bash
rsync -av --dry-run progetto/ utente@server.example:/srv/progetto/
```

Mostrare avanzamento e preservare file parziali:

```bash
rsync -av --partial --info=progress2 immagine.iso utente@server.example:/srv/dati/
```

Escludere una directory:

```bash
rsync -av --exclude='.git/' progetto/ utente@server.example:/srv/progetto/
```

Usare una porta SSH diversa:

```bash
rsync -av -e 'ssh -p 2222' progetto/ utente@server.example:/srv/progetto/
```

## Esempio pratico

Simulare una replica che rimuove dalla destinazione i file assenti nella sorgente:

```bash
rsync -av --delete --dry-run sorgente/ utente@server.example:/srv/replica/
```

Leggere attentamente tutte le righe, verificando slash finali e direzione. Applicare soltanto dopo la simulazione:

```bash
rsync -av --delete sorgente/ utente@server.example:/srv/replica/
```

Per dati importanti aggiungere snapshot o versioning indipendenti: `--delete` rende la destinazione più simile alla sorgente, non più protetta.

## Varianti

- `sftp` offre una sessione o modalità batch basata sul sottosistema SFTP.
- `rsync -aHAX` aggiunge hard link, ACL ed extended attribute quando supportati e autorizzati.
- `--numeric-ids` evita traduzione dei nomi utente e gruppo, utile in ripristini controllati.
- `--link-dest` crea snapshot hard-link efficienti con vincoli specifici.
- `--checksum` confronta contenuti invece di dimensione e timestamp, aumentando letture e CPU.
- Tar via SSH può trasferire stream, ma richiede gestione esplicita di errori e attributi.

## Errori comuni

- Invertire sorgente e destinazione.
- Ignorare lo slash finale della sorgente `rsync`.
- Usare `--delete` senza `--dry-run`, backup e verifica del percorso.
- Credere che `-a` preservi ogni attributo possibile.
- Sincronizzare file in uso e aspettarsi uno snapshot applicativamente coerente.
- Usare opzioni SSH che disabilitano la verifica della host key.
- Supporre che una copia conclusa garantisca integrità applicativa e ripristinabilità.

## Checklist

- Direzione, host e percorsi sono corretti?
- Lo slash finale produce la struttura desiderata?
- Attributi, hard link, ACL e xattr devono essere preservati?
- `--dry-run` è stato eseguito con le stesse opzioni pericolose?
- La destinazione contiene dati non presenti nella sorgente che devono restare?
- I file sorgente sono in uno stato coerente?
- Esiste verifica o backup indipendente dalla sincronizzazione?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/SSH|SSH]]
- [[Linux/Pagine/File directory e link|File, directory e link]]
- [[Linux/Pagine/Permessi chmod chown e umask|Permessi chmod, chown e umask]]
- [[Linux/Pagine/Pipe e ridirezioni|Pipe e ridirezioni]]

## Fonti

- [OpenBSD - scp(1)](https://man.openbsd.org/scp)
- [OpenBSD - sftp(1)](https://man.openbsd.org/sftp)
- [rsync documentation](https://rsync.samba.org/documentation.html)
- [rsync(1)](https://download.samba.org/pub/rsync/rsync.1)
