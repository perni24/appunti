---
date: 2026-07-11
area: Linux
topic: Pluggable Authentication Modules
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, sicurezza, pam, autenticazione, account]
aliases: [Linux PAM, Pluggable Authentication Modules]
prerequisites: [Gestione utenti, Principio del minimo privilegio]
related: [SSH, Audit e log di sicurezza]
---

# PAM

## Sintesi

PAM fornisce uno stack modulare che applicazioni come login, `sudo`, `sshd` e `su` possono usare per autenticazione e gestione account. Ogni servizio PAM ha una policy che combina moduli per gruppi funzionali `auth`, `account`, `password` e `session`.

PAM non autentica automaticamente ogni applicazione: il programma deve integrarlo e usare un service name. Errori nell'ordine o nei control flag possono consentire accessi inattesi o bloccare tutti gli amministratori.

## Quando usarlo

- Configurare policy password e autenticazione.
- Applicare MFA tramite un modulo supportato.
- Gestire lockout, limiti e sessioni.
- Diagnosticare differenze tra login, sudo e SSH.
- Integrare directory o provider di identità tramite stack mantenuti.

## Come funziona

Gruppi di gestione:

| Tipo | Scopo |
| --- | --- |
| `auth` | verifica credenziali e stabilisce identità |
| `account` | controlla validità, scadenza e autorizzazione account |
| `password` | cambia o aggiorna credenziali |
| `session` | operazioni all'apertura e chiusura sessione |

Control flag comuni:

- `required`: il fallimento rende negativo il risultato, ma lo stack continua;
- `requisite`: il fallimento termina subito lo stack;
- `sufficient`: un successo può terminare positivamente se non esistono precedenti fallimenti required;
- `optional`: influenza il risultato soltanto in casi limitati;
- sintassi `[value=action]`: controllo dettagliato dei return code.

Le policy sono normalmente sotto `/etc/pam.d/`. Molte distribuzioni generano file comuni tramite strumenti propri; modifiche dirette possono essere sovrascritte.

## API / Sintassi

Elencare servizi PAM configurati:

```bash
ls /etc/pam.d
```

Leggere la policy di sudo:

```bash
sudo cat /etc/pam.d/sudo
```

Mostrare scadenze dell'account:

```bash
chage -l nomeutente
```

Mostrare tentativi falliti quando `pam_faillock` è configurato:

```bash
faillock --user nomeutente
```

Azzerare il contatore dopo aver verificato la causa:

```bash
sudo faillock --user nomeutente --reset
```

Consultare eventi di autenticazione nel journal:

```bash
journalctl -b _COMM=sshd
```

Validare accesso sudo mantenendo una sessione amministrativa aperta:

```bash
sudo -v
```

## Esempio pratico

Prima di modificare una policy, identificare il service name usato dall'applicazione e seguire lo strumento della distribuzione. Mantenere una sessione root o console di recupero.

Dopo una modifica relativa a SSH, validare la configurazione del daemon:

```bash
sudo sshd -t
```

Provare un nuovo login in una seconda sessione senza chiudere quella funzionante:

```bash
ssh utente@server.example
```

Controllare log e tutti i gruppi PAM coinvolti, non soltanto `auth`.

## Varianti

- `pam_unix` usa account e password locali.
- `pam_faillock` gestisce conteggi di fallimento secondo policy della distribuzione.
- `pam_limits` applica limiti di sessione da configurazioni dedicate.
- SSSD integra identità remote e cache con PAM e NSS.
- Moduli MFA possono richiedere rete, token o challenge e necessitano recovery.
- `pam_namespace` e altri moduli modificano l'ambiente di sessione.

## Errori comuni

- Modificare PAM da remoto senza sessione di recupero.
- Copiare uno stack da un'altra distribuzione con moduli o include differenti.
- Usare `sufficient` senza comprendere i precedenti `required`.
- Applicare lockout anche ad account di emergenza senza percorso alternativo.
- Confondere autenticazione PAM con autorizzazione applicativa.
- Dimenticare i gruppi `account` e `session` durante la diagnosi.
- Modificare file generati invece della configurazione sorgente prevista dalla distribuzione.

## Checklist

- Quale applicazione e service name usano PAM?
- Tutti i moduli referenziati sono installati?
- Ordine e control flag producono il risultato previsto?
- Auth, account, password e session sono stati considerati?
- Esiste una console o sessione di recupero?
- Login valido, invalido, scaduto e lockout sono stati provati?
- I log non espongono credenziali o codici sensibili?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Gestione utenti|Gestione utenti, gruppi e permessi]]
- [[Linux/Pagine/Principio del minimo privilegio|Principio del minimo privilegio]]
- [[Linux/Pagine/SSH|SSH]]
- [[Linux/Pagine/Audit e log di sicurezza|Audit e log di sicurezza]]

## Fonti

- [Linux-PAM documentation](https://github.com/linux-pam/linux-pam)
- [pam(8)](https://man7.org/linux/man-pages/man8/pam.8.html)
- [pam.d(5)](https://man7.org/linux/man-pages/man5/pam.d.5.html)
