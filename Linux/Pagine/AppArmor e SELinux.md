---
date: 2026-07-11
area: Linux
topic: Mandatory Access Control
type: technical-note
status: "non revisionato"
publish: true
difficulty: avanzato
tags: [linux, sicurezza, apparmor, selinux, lsm]
aliases: [MAC Linux, SELinux e AppArmor]
prerequisites: [Principio del minimo privilegio, Permessi chmod chown e umask]
related: [Hardening del sistema, Audit e log di sicurezza]
---

# AppArmor e SELinux

## Sintesi

AppArmor e SELinux sono Linux Security Module che applicano Mandatory Access Control oltre ai permessi discrezionali Unix. AppArmor usa profili prevalentemente basati sui percorsi; SELinux usa label e una policy che valuta contesti di soggetto e oggetto.

Una richiesta deve superare sia DAC sia MAC. Rendere un file world-writable non supera necessariamente una negazione MAC, e disabilitare la policy nasconde il sintomo ampliando l'esposizione.

## Quando usarlo

- Confinare servizi esposti o parser di dati non fidati.
- Limitare file, capability e operazioni accessibili a un processo.
- Diagnosticare denial dopo modifiche a percorsi o deployment.
- Applicare policy di sistema mantenute dalla distribuzione.
- Ridurre l'impatto di una vulnerabilità applicativa.

## Come funziona

AppArmor associa profili a programmi e usa modalità `enforce`, `complain` e unconfined. I profili descrivono accessi a percorsi e altre operazioni; rename, mount namespace e alias richiedono comprensione del modello path-based.

SELinux assegna contesti come `user:role:type:level`; il type enforcement è centrale nelle policy comuni. Modalità `enforcing`, `permissive` e `disabled` descrivono applicazione globale, mentre singoli domini possono avere configurazioni specifiche.

I denial vengono registrati nel sistema audit o journal. Un messaggio mostra richiesta negata, soggetto, oggetto e classe; la correzione preferibile è ripristinare label o percorso previsto prima di generare nuove autorizzazioni.

## API / Sintassi

Mostrare LSM attivi:

```bash
cat /sys/kernel/security/lsm
```

Mostrare stato AppArmor:

```bash
sudo aa-status
```

Mettere temporaneamente un profilo AppArmor in complain mode:

```bash
sudo aa-complain /usr/sbin/nome-servizio
```

Riportarlo in enforce:

```bash
sudo aa-enforce /usr/sbin/nome-servizio
```

Mostrare modalità SELinux:

```bash
getenforce
```

Mostrare stato dettagliato SELinux:

```bash
sestatus
```

Mostrare contesti dei file:

```bash
ls -Z /srv/app
```

Ripristinare label previste dalla policy:

```bash
sudo restorecon -Rv /srv/app
```

## Esempio pratico

Dopo un denial, cercare eventi AVC recenti:

```bash
sudo ausearch -m AVC,USER_AVC -ts recent
```

Per AppArmor, leggere anche eventi kernel e profilo coinvolto:

```bash
journalctl -k -b
```

Per SELinux, confrontare percorso e label attesa prima di creare eccezioni:

```bash
matchpathcon /srv/app/file
```

Una regola generata automaticamente deve essere revisionata: il log può riflettere un attacco o una configurazione errata, non un accesso da autorizzare.

## Varianti

- AppArmor è comune su Ubuntu e SUSE; SELinux su Fedora e RHEL, ma la disponibilità dipende dalla distribuzione.
- SELinux boolean modifica parti previste della policy senza scrivere moduli arbitrari.
- `semanage fcontext` definisce mapping persistenti dei percorsi prima di `restorecon`.
- Profili AppArmor locali possono estendere policy di pacchetto senza modificarla direttamente.
- Seccomp filtra system call ed è complementare al MAC.
- Landlock consente sandboxing non privilegiato con un modello differente.

## Errori comuni

- Disabilitare AppArmor o SELinux per risolvere rapidamente un denial.
- Usare `chcon` come correzione persistente delle label SELinux.
- Generare e applicare automaticamente ogni regola suggerita dai log.
- Dimenticare che un servizio può risultare unconfined.
- Confondere permessi DAC corretti con autorizzazione MAC garantita.
- Cambiare percorsi applicativi senza aggiornare profili o mapping label.
- Passare l'intero sistema in permissive invece di isolare la diagnosi.

## Checklist

- Quale LSM è attivo e la policy è caricata?
- Processo o dominio è realmente confinato?
- Il denial è DAC, AppArmor, SELinux o altro?
- Percorso, label e ownership corrispondono al deployment previsto?
- Esiste una opzione o boolean ufficiale per il caso d'uso?
- La regola minima è stata revisionata e testata?
- Dopo la correzione il sistema è tornato in enforcing?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Principio del minimo privilegio|Principio del minimo privilegio]]
- [[Linux/Pagine/Hardening del sistema|Hardening del sistema]]
- [[Linux/Pagine/Audit e log di sicurezza|Audit e log di sicurezza]]
- [[Linux/Pagine/Permessi chmod chown e umask|Permessi chmod, chown e umask]]

## Fonti

- [Linux kernel - AppArmor](https://docs.kernel.org/admin-guide/LSM/apparmor.html)
- [SELinux Project](https://selinuxproject.org/page/Main_Page)
- [Fedora SELinux documentation](https://docs.fedoraproject.org/en-US/quick-docs/selinux-getting-started/)
- [AppArmor documentation](https://gitlab.com/apparmor/apparmor/-/wikis/Documentation)
