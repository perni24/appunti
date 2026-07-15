---
date: 2026-07-11
area: Linux
topic: Domain Name System
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, networking, dns, resolver, systemd-resolved]
aliases: [DNS Linux, Risoluzione nomi]
prerequisites: [Interfacce e indirizzi IP, Routing]
related: [NetworkManager, Diagnostica con ip ss ping e traceroute]
---

# DNS

## Sintesi

Il DNS traduce nomi di dominio in record come indirizzi, mail exchanger e alias. Su Linux le applicazioni usano normalmente il resolver della libc e le sorgenti definite in `/etc/nsswitch.conf`; `/etc/resolv.conf` descrive resolver, search domain e opzioni, ma può essere generato da NetworkManager o systemd-resolved.

Risoluzione dei nomi e connettività IP sono livelli distinti. Testare un indirizzo e un nome separatamente evita diagnosi confuse.

## Quando usarlo

- Diagnosticare nomi che non si risolvono o risolvono diversamente.
- Verificare server DNS e search domain ricevuti.
- Interrogare record A, AAAA, CNAME, MX, TXT e PTR.
- Distinguere risposta autorevole, cache e resolver locale.
- Controllare l'integrazione con NSS e `/etc/hosts`.

## Come funziona

Record comuni:

| Record | Scopo |
| --- | --- |
| `A` | indirizzo IPv4 |
| `AAAA` | indirizzo IPv6 |
| `CNAME` | alias verso un altro nome |
| `MX` | server di posta del dominio |
| `TXT` | testo usato da diversi protocolli |
| `PTR` | risoluzione inversa |
| `NS` | name server autorevoli |

`getent hosts` segue la configurazione NSS dell'applicazione locale, includendo eventualmente `/etc/hosts`, DNS, mDNS e altri moduli. `dig` interroga DNS direttamente e non riproduce necessariamente l'intero percorso NSS.

systemd-resolved può usare uno stub locale e DNS differenti per link o dominio. In quel caso leggere soltanto il contenuto di `/etc/resolv.conf` può non mostrare tutte le decisioni effettive.

## API / Sintassi

Verificare la risoluzione secondo NSS:

```bash
getent ahosts example.com
```

Interrogare record A e AAAA tramite il resolver configurato:

```bash
dig example.com
```

Interrogare un tipo specifico:

```bash
dig MX example.com
```

Interrogare un server DNS specifico:

```bash
dig @1.1.1.1 example.com
```

Eseguire una risoluzione inversa:

```bash
dig -x 192.0.2.10
```

Mostrare configurazione per-link di systemd-resolved:

```bash
resolvectl status
```

Interrogare tramite systemd-resolved:

```bash
resolvectl query example.com
```

Mostrare ordine delle sorgenti NSS:

```bash
grep '^hosts:' /etc/nsswitch.conf
```

## Esempio pratico

Verificare prima la connettività senza DNS:

```bash
ping -c 3 1.1.1.1
```

Testare il percorso usato dalle applicazioni:

```bash
getent ahosts example.com
```

Confrontare una query DNS esplicita:

```bash
dig example.com
```

Controllare resolver e domini per link:

```bash
resolvectl status
```

Differenze tra `getent` e `dig` possono indicare `/etc/hosts`, mDNS, cache o regole split-DNS, non necessariamente un guasto del server autorevole.

## Varianti

- DNS ricorsivo risolve per il client; DNS autorevole pubblica la zona.
- DNSSEC autentica dati DNS quando la catena viene validata, ma non cifra le query.
- DoT e DoH cifrano il trasporto verso un resolver compatibile.
- Split DNS restituisce o instrada query in modo diverso per rete, VPN o dominio.
- mDNS usa `.local` e multicast con strumenti come Avahi.
- Cache locali riducono latenza ma possono conservare risposte fino al TTL.

## Errori comuni

- Modificare `/etc/resolv.conf` quando è un file generato e perdere la modifica.
- Usare soltanto `dig` e ignorare NSS usato dall'applicazione.
- Confondere `NXDOMAIN`, nessun record del tipo richiesto e timeout.
- Attribuire al DNS un problema di route o firewall.
- Usare search domain troppo ampi o non fidati.
- Dimenticare che cache e TTL ritardano la visibilità delle modifiche.
- Disabilitare IPv6 perché esiste un record AAAA invece di diagnosticare il percorso IPv6.

## Checklist

- La connettività IP funziona senza risoluzione nomi?
- Quale percorso NSS usa l'applicazione?
- `/etc/resolv.conf` è statico, symlink o generato?
- Quali DNS e domini sono associati al link?
- La risposta è `NOERROR`, `NXDOMAIN`, `SERVFAIL` o timeout?
- Cache, TTL, VPN o split DNS influenzano il risultato?
- A e AAAA sono entrambi raggiungibili dal client?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Interfacce e indirizzi IP|Interfacce e indirizzi IP]]
- [[Linux/Pagine/Routing|Routing]]
- [[Linux/Pagine/NetworkManager|NetworkManager]]
- [[Linux/Pagine/Diagnostica con ip ss ping e traceroute|Diagnostica con ip, ss, ping e traceroute]]

## Fonti

- [resolv.conf(5)](https://man7.org/linux/man-pages/man5/resolv.conf.5.html)
- [nsswitch.conf(5)](https://man7.org/linux/man-pages/man5/nsswitch.conf.5.html)
- [systemd-resolved(8)](https://www.freedesktop.org/software/systemd/man/latest/systemd-resolved.html)
- [BIND 9 - dig](https://bind9.readthedocs.io/en/latest/manpages.html#dig-dns-lookup-utility)
