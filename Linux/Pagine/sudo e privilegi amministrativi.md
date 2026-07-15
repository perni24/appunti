---
date: 2026-07-11
area: Linux
topic: Privilegi amministrativi
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, sudo, sudoers, privilegi, sicurezza]
aliases: [Sudo, Privilegi amministrativi Linux]
prerequisites: [Gestione utenti, Permessi chmod chown e umask]
related: [ACL e permessi avanzati, Principio del minimo privilegio]
---

# sudo e privilegi amministrativi

## Sintesi

`sudo` consente a un utente autenticato di eseguire un comando con l'identità di un altro utente, normalmente `root`, se una policy lo autorizza. La configurazione più comune è `sudoers`, letta da `/etc/sudoers` e dagli eventuali file inclusi in `/etc/sudoers.d/`.

L'obiettivo non è trasformare stabilmente l'utente in amministratore, ma delegare operazioni precise, applicare controlli e registrare l'uso dei privilegi. Le regole devono seguire il principio del minimo privilegio.

## Quando usarlo

- Installare pacchetti o modificare configurazioni di sistema.
- Gestire servizi, utenti e risorse protette.
- Delegare a un gruppo un insieme limitato di comandi.
- Eseguire un comando come account di servizio senza condividerne la password.
- Modificare in sicurezza file amministrativi con `sudoedit`.

## Come funziona

Quando viene invocato, `sudo` determina l'utente chiamante, consulta la policy, verifica comando, argomenti, host e identità di destinazione, quindi applica l'autenticazione prevista. Se autorizzato, prepara l'ambiente secondo la configurazione ed esegue il comando con le credenziali richieste.

Una regola essenziale segue questo schema:

```sudoers
utente host = (runas_user:runas_group) tag: comando
```

Esempio per concedere al gruppo `wheel` tutti i comandi:

```sudoers
%wheel ALL=(ALL:ALL) ALL
```

`ALL` è un valore molto ampio, non una misura di sicurezza. Per deleghe applicative è preferibile indicare percorsi assoluti e comandi strettamente necessari. Anche gli argomenti fanno parte della corrispondenza di una regola quando vengono specificati.

## API / Sintassi

Elencare i privilegi dell'utente corrente:

```bash
sudo -l
```

Aggiornare la credenziale memorizzata senza eseguire un comando:

```bash
sudo -v
```

Invalidare la credenziale memorizzata della sessione:

```bash
sudo -k
```

Eseguire un comando come `root`:

```bash
sudo systemctl restart nginx
```

Eseguire un comando come un altro utente:

```bash
sudo -u postgres psql
```

Aprire una shell di login di `root` quando è realmente necessario:

```bash
sudo -i
```

Modificare la configurazione principale con controllo sintattico:

```bash
sudo visudo
```

Modificare un file dedicato in `sudoers.d`:

```bash
sudo visudo -f /etc/sudoers.d/gestione-nginx
```

Validare l'intera configurazione:

```bash
sudo visudo -c
```

## Esempio pratico

Creare una regola dedicata tramite `visudo`:

```bash
sudo visudo -f /etc/sudoers.d/gestione-nginx
```

Inserire una regola che consenta al gruppo `operatori-web` di riavviare soltanto `nginx`:

```sudoers
%operatori-web ALL=(root) /usr/bin/systemctl restart nginx
```

Verificare la sintassi prima di chiudere la sessione amministrativa:

```bash
sudo visudo -c
```

Controllare i privilegi effettivamente riconosciuti:

```bash
sudo -l
```

Il percorso di `systemctl` deve corrispondere a quello reale della distribuzione. Una delega basata su un programma molto flessibile, su wildcard ampie o su file modificabili dall'utente può permettere operazioni ulteriori rispetto a quelle apparenti.

## Varianti

- `sudoedit /etc/file.conf` copia temporaneamente il file, lo apre con l'editor dell'utente e lo reinstalla con privilegi dopo i controlli.
- `su - utente` avvia una sessione come altro account e usa normalmente le credenziali dell'account di destinazione; non sostituisce una policy di delega.
- `sudo -u utente comando` cambia l'utente di esecuzione senza richiedere una shell interattiva.
- `NOPASSWD` elimina la richiesta di password per la regola: va limitato a casi motivati e comandi non abusabili.
- Alias di utenti, host e comandi rendono gestibili policy estese, ma possono nascondere la portata reale di una regola se usati eccessivamente.

## Errori comuni

- Modificare `/etc/sudoers` con un editor generico invece di `visudo`.
- Concedere `ALL` quando basta un comando specifico.
- Consentire editor, shell, interpreti o strumenti capaci di eseguire comandi come scorciatoia per una delega limitata.
- Scrivere `sudo echo valore > /file`: la ridirezione viene eseguita dalla shell non privilegiata.
- Eseguire applicazioni grafiche generiche come `root`, creando file nella home con proprietà errata o ampliando il rischio.
- Affidarsi soltanto al nome del comando senza verificare percorso, argomenti, file controllati e possibilità di escape.
- Tenere aperta a lungo una shell `sudo -i`, perdendo la separazione tra attività normali e amministrative.

## Checklist

- Il comando richiede davvero privilegi elevati?
- La regola usa il percorso assoluto corretto?
- Utenti, gruppi, host, identità di destinazione e argomenti sono limitati?
- Il comando può avviare una shell, caricare plugin o modificare file eseguiti da `root`?
- La configurazione è stata modificata e validata con `visudo`?
- `sudo -l` mostra soltanto i privilegi attesi?
- È preferibile `sudoedit` alla scrittura diretta come `root`?
- Dopo l'attività conviene invalidare la cache con `sudo -k`?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Gestione utenti|Gestione utenti, gruppi e permessi]]
- [[Linux/Pagine/Permessi chmod chown e umask|Permessi chmod, chown e umask]]
- [[Linux/Pagine/ACL e permessi avanzati|ACL e permessi avanzati]]

## Fonti

- [Sudo project - sudoers(5)](https://www.sudo.ws/docs/man/1.9.14/sudoers.man.pdf)
- [Sudo project - repository ufficiale](https://github.com/sudo-project/sudo)
- [ArchWiki - sudo](https://wiki.archlinux.org/title/Sudo)
