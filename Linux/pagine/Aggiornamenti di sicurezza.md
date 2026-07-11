---
date: 2026-07-11
area: Linux
topic: Patch management
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, sicurezza, aggiornamenti, cve, patch-management]
aliases: [Security updates Linux, Gestione patch Linux]
prerequisites: [Repository e package manager, Hardening del sistema]
related: [apt dnf e pacman, Audit e log di sicurezza]
---

# Aggiornamenti di sicurezza

## Sintesi

Il patch management identifica componenti, valuta advisory, applica aggiornamenti da repository attendibili e verifica che i processi usino il nuovo codice. Installare un pacchetto aggiornato non sostituisce automaticamente processi già in memoria, container, firmware o software installato fuori dal package manager.

La priorità dipende da esposizione, sfruttabilità, impatto e controlli compensativi, non soltanto dal punteggio CVSS. Anche il ritardo operativo e il rischio della modifica devono essere gestiti con test e rollback.

## Quando usarlo

- Mantenere sistemi entro una release supportata.
- Rispondere ad advisory e vulnerabilità sfruttate.
- Automatizzare patch su classi di host controllate.
- Verificare riavvii di kernel e servizi.
- Inventariare software fuori repository o non più supportato.

## Come funziona

Un ciclo completo:

1. inventario di OS, kernel, pacchetti, container, firmware e software manuale;
2. fonti advisory ufficiali e mapping alle versioni della distribuzione;
3. valutazione di esposizione e priorità;
4. test e backup o snapshot con ripristino verificato;
5. distribuzione graduale;
6. riavvio o reload dei componenti necessari;
7. verifica tecnica e monitoraggio;
8. registrazione di eccezioni e scadenze.

Le distribuzioni spesso backportano correzioni mantenendo numeri di versione upstream apparentemente vecchi. Un confronto ingenuo con la versione pubblicata dal progetto può quindi produrre falsi positivi.

## API / Sintassi

### Debian e derivate

Aggiornare i metadati:

```bash
sudo apt update
```

Mostrare pacchetti aggiornabili:

```bash
apt list --upgradable
```

Applicare aggiornamenti compatibili:

```bash
sudo apt upgrade
```

Simulare unattended-upgrades quando installato:

```bash
sudo unattended-upgrade --dry-run --debug
```

### Fedora e DNF

Mostrare advisory di sicurezza applicabili:

```bash
dnf updateinfo list --security
```

Applicare aggiornamenti classificati di sicurezza:

```bash
sudo dnf upgrade --security
```

### Arch Linux

Aggiornare repository e intero sistema:

```bash
sudo pacman -Syu
```

## Esempio pratico

Prima dell'aggiornamento registrare kernel e release:

```bash
uname -r
```

```bash
cat /etc/os-release
```

Applicare la procedura del package manager, quindi verificare unit fallite:

```bash
systemctl --failed
```

Controllare errori del boot dopo il riavvio pianificato:

```bash
journalctl -b -p err
```

Confrontare il kernel in esecuzione con quello installato e verificare i servizi critici tramite test applicativi, non soltanto tramite stato `active`.

## Varianti

- Aggiornamenti automatici riducono tempo di esposizione ma richiedono canary, finestre, reboot e alert sui fallimenti.
- Live patch copre soltanto modifiche kernel supportate e non elimina ogni necessità di riavvio.
- Container image devono essere ricostruite da base aggiornata e ridistribuite; aggiornare l'host non modifica l'immagine.
- Firmware e microcode seguono canali differenti dai normali pacchetti.
- Software compilato da sorgente o installato in user space richiede inventario e aggiornamento propri.
- Scanner vulnerabilità deve conoscere backport e stato della distribuzione.

## Errori comuni

- Applicare soltanto pacchetti etichettati security e lasciare dipendenze o fix necessari non aggiornati.
- Eseguire `pacman -Sy` senza aggiornamento completo.
- Non riavviare processi che mantengono librerie vulnerabili in memoria.
- Restare su una release end-of-life confidando nei repository vecchi.
- Automatizzare senza monitorare errori, prompt e reboot richiesti.
- Considerare uno snapshot un backup sufficiente per ogni guasto.
- Valutare CVE soltanto dal numero di versione upstream.

## Checklist

- Release e tutti i componenti sono ancora supportati?
- Advisory provengono dalla distribuzione o dal fornitore corretto?
- Esposizione e priorità sono state valutate?
- Backup, snapshot e rollback sono stati provati?
- Aggiornamento è distribuito gradualmente e monitorato?
- Servizi, kernel, container e firmware sono stati riavviati o ridistribuiti quando necessario?
- La verifica include test applicativi e registrazione dell'esito?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Repository e package manager|Repository e package manager]]
- [[Linux/Pagine/apt dnf e pacman|apt, dnf e pacman]]
- [[Linux/Pagine/Hardening del sistema|Hardening del sistema]]
- [[Linux/Pagine/Audit e log di sicurezza|Audit e log di sicurezza]]
- [[Linux/Pagine/GPG|GPG]]

## Fonti

- [Debian Security](https://www.debian.org/security/)
- [Fedora Security](https://docs.fedoraproject.org/en-US/security/)
- [Arch Linux Security Tracker](https://security.archlinux.org/)
- [unattended-upgrades(8)](https://manpages.debian.org/unattended-upgrades/unattended-upgrade.8.en.html)
