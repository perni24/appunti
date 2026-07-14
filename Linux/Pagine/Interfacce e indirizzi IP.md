---
date: 2026-07-11
area: Linux
topic: Interfacce di rete
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, networking, ip, ipv4, ipv6, interfacce]
aliases: [Indirizzi IP Linux, Interfacce di rete Linux]
prerequisites: [Architettura Linux kernel shell e user space]
related: [Routing, NetworkManager, Diagnostica con ip ss ping e traceroute]
---

# Interfacce e indirizzi IP

## Sintesi

Un'interfaccia di rete è il punto con cui lo stack del kernel invia e riceve pacchetti. Può rappresentare hardware, loopback, bridge, VLAN, tunnel o device virtuali. A ogni interfaccia possono essere assegnati più indirizzi IPv4 e IPv6 con relativo prefisso.

Lo stato amministrativo `UP` non garantisce che esista un collegamento fisico né che routing, DNS e servizi funzionino. I comandi `ip` modificano normalmente lo stato runtime; la persistenza appartiene al gestore di rete configurato.

## Quando usarlo

- Verificare link, MAC e indirizzi assegnati.
- Aggiungere temporaneamente un indirizzo per test.
- Diagnosticare DHCP, IPv6 o conflitti di rete.
- Consultare vicini ARP e Neighbor Discovery.
- Distinguere interfacce fisiche e virtuali.

## Come funziona

Un indirizzo come `192.0.2.10/24` combina host e lunghezza del prefisso. Il prefisso `/24` identifica i primi 24 bit come rete. IPv6 usa la stessa notazione, per esempio `2001:db8::10/64`.

IPv6 assegna normalmente almeno un indirizzo link-local `fe80::/10`, valido sul collegamento e spesso accompagnato dall'interfaccia nella forma `%eth0`. Gli indirizzi globali, temporanei e quelli ottenuti tramite SLAAC o DHCPv6 possono coesistere.

Stati da distinguere:

| Stato | Significato |
| --- | --- |
| amministrativo | interfaccia abilitata o disabilitata dal software |
| carrier | collegamento fisico o logico rilevato |
| operstate | stato operativo sintetizzato dal kernel |
| address scope | validità host, link o global |

## API / Sintassi

Mostrare un riepilogo dei link:

```bash
ip -brief link
```

Mostrare indirizzi IPv4 e IPv6:

```bash
ip -brief address
```

Mostrare dettagli di una interfaccia:

```bash
ip link show dev eth0
```

Mostrare indirizzi della singola interfaccia:

```bash
ip address show dev eth0
```

Abilitare temporaneamente l'interfaccia:

```bash
sudo ip link set dev eth0 up
```

Aggiungere temporaneamente un indirizzo IPv4:

```bash
sudo ip address add 192.0.2.10/24 dev eth0
```

Rimuovere l'indirizzo temporaneo:

```bash
sudo ip address del 192.0.2.10/24 dev eth0
```

Mostrare la tabella dei vicini:

```bash
ip neighbour show
```

## Esempio pratico

Controllare stato e carrier:

```bash
ip -details link show dev eth0
```

Verificare gli indirizzi effettivi:

```bash
ip address show dev eth0
```

Controllare i vicini appresi sul collegamento:

```bash
ip neighbour show dev eth0
```

Se l'indirizzo è stato assegnato da NetworkManager, analizzare anche il profilo attivo invece di correggerlo con modifiche runtime destinate a sparire.

## Varianti

- `lo` è il loopback e ospita normalmente `127.0.0.1` e `::1`.
- Bridge e bond aggregano o collegano interfacce con semantiche diverse.
- VLAN crea interfacce logiche associate a tag IEEE 802.1Q.
- Device `veth` collegano namespace e container.
- DHCP assegna indirizzi, route, DNS e altri parametri con una durata.
- SLAAC genera configurazione IPv6 da Router Advertisement.

## Errori comuni

- Confondere interfaccia `UP` con connettività funzionante.
- Usare un prefisso errato e classificare host locali come remoti o viceversa.
- Applicare `ip address add` aspettandosi persistenza al riavvio.
- Disabilitare IPv6 per aggirare un problema di DNS o routing non diagnosticato.
- Assegnare un indirizzo già usato da un altro host.
- Confondere indirizzo link-local con raggiungibilità globale.
- Modificare direttamente un device gestito da NetworkManager senza considerare il profilo attivo.

## Checklist

- Interfaccia, MAC e device fisico sono quelli attesi?
- Stato amministrativo e carrier sono entrambi attivi?
- Indirizzo, prefisso e scope sono corretti?
- La configurazione proviene da DHCP, SLAAC o profilo statico?
- Esistono indirizzi duplicati o più configurazioni concorrenti?
- Vicini e gateway sono raggiungibili sul link?
- La modifica deve essere temporanea o persistente?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Routing|Routing]]
- [[Linux/Pagine/NetworkManager|NetworkManager]]
- [[Linux/Pagine/DNS|DNS]]
- [[Linux/Pagine/Diagnostica con ip ss ping e traceroute|Diagnostica con ip, ss, ping e traceroute]]

## Fonti

- [ip-address(8)](https://man7.org/linux/man-pages/man8/ip-address.8.html)
- [ip-link(8)](https://man7.org/linux/man-pages/man8/ip-link.8.html)
- [ip-neighbour(8)](https://man7.org/linux/man-pages/man8/ip-neighbour.8.html)
- [Linux kernel networking](https://docs.kernel.org/networking/)
