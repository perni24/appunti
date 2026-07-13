---
date: 2026-07-13
area: Linux
topic: Condivisioni di rete NFS e Samba
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, server, nfs, samba, smb, filesystem]
aliases: [File server Linux, NFS e SMB]
prerequisites: [Mount e umount, Gestione utenti, Firewall con nftables]
related: [ACL e permessi avanzati, Configurazione di fstab, DNS]
---

# Condivisioni NFS e Samba

## Sintesi

NFS e SMB permettono di usare file remoti attraverso la rete, ma hanno modelli e ambienti tipici differenti. NFS e integrato nel mondo Unix/Linux e si basa fortemente su identita numeriche, mount e semantica POSIX. Samba implementa SMB e interoperabilita con client Windows, domini Active Directory, ACL e convenzioni di condivisione Windows.

La scelta non riguarda soltanto il sistema operativo del client: servono coerenza delle identita, semantica di locking, permessi, latenza, disponibilita e sicurezza. Una share di rete non sostituisce backup o replica.

## Quando usarlo

- Usare NFS per home, dati e workload Unix/Linux con identita coordinate.
- Usare Samba per client Windows o ambienti misti che richiedono SMB.
- Centralizzare directory condivise in una LAN amministrata.
- Esportare storage a server applicativi con requisiti noti.
- Applicare ACL e quote su un file server centrale.

## Come funziona

Un server NFS esporta directory dichiarate in `/etc/exports`. Il client le monta nel proprio namespace e il kernel traduce operazioni file in richieste NFS. In NFSv4 il server presenta uno pseudo-filesystem e puo usare Kerberos tramite `sec=krb5`, `krb5i` o `krb5p`; l'autenticazione tradizionale `AUTH_SYS` si affida agli UID/GID dichiarati dal client e richiede una rete fidata e identita coerenti.

`root_squash`, normalmente predefinito, mappa il root remoto su un'identita non privilegiata. Disabilitarlo con `no_root_squash` amplia molto l'impatto di un client compromesso.

Samba usa `/etc/samba/smb.conf` per sezioni globali e share. L'identita puo provenire da utenti locali, database Samba o Active Directory. Permessi Unix, ACL del filesystem e ACL SMB interagiscono: concedere accesso nel file di configurazione non supera automaticamente un diniego del filesystem sottostante.

Entrambi i protocolli mantengono stato e cache. Applicazioni che richiedono locking o consistenza specifica devono essere testate sul protocollo e filesystem reali; database e immagini di VM non vanno collocati su una share generica senza supporto esplicito.

## API / Sintassi

Mostrare gli export NFS effettivi del server:

```bash
sudo exportfs -v
```

Rileggere `/etc/exports` e aggiornare gli export:

```bash
sudo exportfs -rav
```

Mostrare opzioni e versione negoziata dei mount NFS attivi:

```bash
nfsstat -m
```

Montare temporaneamente un export NFSv4:

```bash
sudo mount -t nfs4 server.example:/dati /mnt/dati
```

Verificare il mount NFS:

```bash
findmnt /mnt/dati
```

Validare e mostrare la configurazione Samba:

```bash
testparm
```

Elencare le share SMB visibili senza montarle:

```bash
smbclient -L //server.example -U utente
```

Creare o abilitare una password Samba per un utente locale esistente:

```bash
sudo smbpasswd -a utente
```

Montare temporaneamente una share SMB con file credenziali:

```bash
sudo mount -t cifs //server.example/dati /mnt/dati -o credentials=/root/.smb-credentials
```

## Esempio pratico

Un export NFS limitato a una subnet puo essere dichiarato in `/etc/exports`:

```exports
/srv/nfs/dati 192.0.2.0/24(rw,sync,root_squash,no_subtree_check)
```

Validare e applicare gli export:

```bash
sudo exportfs -rav
```

Controllare il risultato:

```bash
sudo exportfs -v
```

Una share Samba con accesso riservato a un gruppo puo essere:

```ini
[dati]
    path = /srv/samba/dati
    browseable = yes
    read only = no
    valid users = @condivisione
    force group = condivisione
    create mask = 0660
    directory mask = 0770
```

Validare la configurazione prima del reload:

```bash
testparm
```

Il nome della unit Samba varia tra distribuzioni, per esempio `smb`, `smbd` o un target composto. Individuare la unit installata prima di ricaricarla.

## Varianti

- NFSv4 concentra il protocollo su TCP 2049 e integra funzionalita prima separate; NFSv3 dipende anche da servizi RPC aggiuntivi.
- `sec=krb5` autentica, `sec=krb5i` aggiunge integrita e `sec=krb5p` aggiunge privacy al traffico NFS.
- Samba standalone usa account locali; come member server puo integrare identita di dominio.
- Le share guest eliminano autenticazione individuale e vanno limitate a casi controllati.
- Un mount in `/etc/fstab` e semplice; una unit automount systemd evita di bloccare il boot su server irraggiungibili.
- ACL POSIX e NFSv4 ACL non sono equivalenti in ogni dettaglio alle ACL Windows.
- `autofs` monta share su richiesta e le smonta dopo inattivita.

## Errori comuni

- Usare `no_root_squash` senza una necessita e una rete strettamente controllata.
- Affidarsi ad `AUTH_SYS` su reti dove un client puo falsificare UID e GID.
- Aprire indiscriminatamente porte RPC o SMB su Internet.
- Modificare permessi Samba ignorando ownership e ACL del filesystem.
- Inserire password direttamente nelle opzioni di `/etc/fstab` leggibili da altri utenti.
- Usare nomi utente uguali ma UID/GID differenti e ottenere ownership incoerente.
- Montare una share critica al boot senza opzioni di rete o automount appropriate.
- Eseguire database o VM su una share non progettata e testata per quel workload.
- Considerare una share ridondata equivalente a una copia di backup versionata.

## Checklist

- Client, protocollo e semantica richiesta sono compatibili?
- Identita UID/GID, account Samba o dominio sono coerenti?
- Export e share sono limitati a host, subnet, utenti e gruppi necessari?
- Root remoto, guest access e privilegi amministrativi sono confinati?
- Firewall espone soltanto i servizi e le reti previste?
- Permessi Unix, ACL e policy Samba producono l'accesso desiderato?
- Credenziali e keytab sono protetti e ruotabili?
- Mount al boot gestisce dipendenze di rete e indisponibilita?
- Locking, cache e recovery sono stati testati con l'applicazione reale?
- Dati condivisi hanno backup e ripristino indipendenti?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Mount e umount|Mount e umount]]
- [[Linux/Pagine/Configurazione di fstab|Configurazione di fstab]]
- [[Linux/Pagine/Gestione utenti|Gestione utenti, gruppi e permessi]]
- [[Linux/Pagine/ACL e permessi avanzati|ACL e permessi avanzati]]
- [[Linux/Pagine/Firewall con nftables|Firewall con nftables]]
- [[Linux/Pagine/Backup e ripristino|Backup e ripristino]]

## Fonti

- [Linux man-pages - exports(5)](https://man7.org/linux/man-pages/man5/exports.5.html)
- [Linux kernel - NFS documentation](https://docs.kernel.org/filesystems/nfs/index.html)
- [Samba - smb.conf](https://www.samba.org/samba/docs/current/man-html/smb.conf.5.html)
- [Samba documentation](https://www.samba.org/samba/docs/)
