---
date: 2026-07-11
area: Linux
topic: Secure Shell
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, networking, ssh, sicurezza, chiavi]
aliases: [OpenSSH, Accesso remoto SSH]
prerequisites: [Porte e socket, Gestione utenti]
related: [Trasferimento file con scp e rsync, Firewall con nftables]
---

# SSH

## Sintesi

SSH crea un canale cifrato per login remoto, esecuzione di comandi, forwarding e trasferimento file. OpenSSH comprende client `ssh`, server `sshd`, strumenti per chiavi e sottosistemi come SFTP.

La host key autentica il server al client; una chiave utente autentica l'utente al server. Confonderle porta a ignorare avvisi importanti o a distribuire credenziali nel posto sbagliato.

## Quando usarlo

- Amministrare sistemi remoti tramite canale cifrato.
- Eseguire un comando senza sessione interattiva.
- Autenticarsi con chiavi invece di password ripetute.
- Attraversare un bastion host.
- Creare tunnel controllati per servizi specifici.

## Come funziona

Il client negozia algoritmi, verifica la host key rispetto a `known_hosts`, stabilisce chiavi di sessione e presenta uno o più metodi di autenticazione. Il server applica configurazione globale, eventuali blocchi `Match`, policy PAM e autorizzazioni dell'account.

File comuni:

| File | Ruolo |
| --- | --- |
| `~/.ssh/config` | profili client |
| `~/.ssh/known_hosts` | identità note dei server |
| `~/.ssh/authorized_keys` | chiavi utente autorizzate sul server |
| `/etc/ssh/ssh_config` | configurazione client globale |
| `/etc/ssh/sshd_config` | configurazione server |

Una private key deve restare segreta e può essere protetta da passphrase. `ssh-agent` conserva temporaneamente chiavi sbloccate; l'agent forwarding estende la possibilità di usarle sul percorso remoto e va limitato.

## API / Sintassi

Aprire una sessione remota:

```bash
ssh utente@server.example
```

Usare una porta non standard:

```bash
ssh -p 2222 utente@server.example
```

Eseguire un comando remoto:

```bash
ssh utente@server.example 'uname -a'
```

Mostrare diagnostica dettagliata del client:

```bash
ssh -vvv utente@server.example
```

Generare una chiave Ed25519 protetta da passphrase:

```bash
ssh-keygen -t ed25519 -a 100 -C 'luca@client'
```

Installare la chiave pubblica usando un accesso già autenticato:

```bash
ssh-copy-id utente@server.example
```

Mostrare il fingerprint della chiave pubblica:

```bash
ssh-keygen -lf ~/.ssh/id_ed25519.pub
```

Verificare la configurazione effettiva del client:

```bash
ssh -G server.example
```

## Esempio pratico

Definire un profilo in `~/.ssh/config`:

```sshconfig
Host produzione
    HostName server.example
    User deploy
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes
```

Proteggere la directory SSH:

```bash
chmod 700 ~/.ssh
```

Proteggere la configurazione privata:

```bash
chmod 600 ~/.ssh/config
```

Usare il profilo:

```bash
ssh produzione
```

Prima di disabilitare password o login amministrativi, mantenere aperta una sessione e verificare in una seconda connessione che la chiave funzioni realmente.

## Varianti

- `ProxyJump` o `ssh -J bastion destinazione` attraversano un host intermedio senza configurare tunnel manuali.
- `ssh -L porta_locale:host:porta` crea local forwarding.
- `ssh -R` espone un endpoint dal lato remoto e richiede policy server consapevoli.
- Certificate Authority SSH permette di firmare chiavi host e utente riducendo liste statiche.
- Le chiavi hardware FIDO, tipi `ed25519-sk` o `ecdsa-sk`, richiedono presenza del dispositivo secondo configurazione.
- `Match` applica direttive server soltanto a utenti, gruppi o origini selezionate.

## Errori comuni

- Accettare una host key cambiata senza verificarne il fingerprint tramite un canale indipendente.
- Copiare la private key sul server invece della pubblica.
- Disabilitare l'autenticazione esistente prima di aver provato la nuova.
- Abilitare agent forwarding verso host non pienamente fidati.
- Usare `StrictHostKeyChecking=no` come impostazione permanente.
- Esporre `sshd` su Internet senza aggiornamenti, rate limiting e policy di autenticazione.
- Modificare `sshd_config` senza validarlo prima del reload.

## Checklist

- Il fingerprint della host key è stato verificato?
- La private key ha passphrase e permessi appropriati?
- `authorized_keys` appartiene all'utente corretto?
- La configurazione effettiva del client è stata controllata?
- Il server limita utenti, metodi e forwarding al necessario?
- `sshd -t` passa prima del reload?
- Esiste un accesso di recupero prima di modifiche remote?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Porte e socket|Porte e socket]]
- [[Linux/Pagine/Trasferimento file con scp e rsync|Trasferimento file con scp e rsync]]
- [[Linux/Pagine/Firewall con nftables|Firewall con nftables]]
- [[Linux/Pagine/Gestione utenti|Gestione utenti, gruppi e permessi]]

## Fonti

- [OpenBSD - ssh(1)](https://man.openbsd.org/ssh)
- [OpenBSD - ssh_config(5)](https://man.openbsd.org/ssh_config)
- [OpenBSD - sshd_config(5)](https://man.openbsd.org/sshd_config)
- [OpenSSH release notes](https://www.openssh.com/releasenotes.html)
