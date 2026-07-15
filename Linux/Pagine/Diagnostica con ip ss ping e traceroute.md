---
date: 2026-07-11
area: Linux
topic: Diagnostica di rete
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, networking, diagnostica, ip, ss, ping, traceroute]
aliases: [Troubleshooting rete Linux, Diagnostica networking]
prerequisites: [Interfacce e indirizzi IP, Routing, DNS, Porte e socket]
related: [NetworkManager, Firewall con nftables]
---

# Diagnostica con ip, ss, ping e traceroute

## Sintesi

Una diagnosi efficace procede per livelli: device e carrier, indirizzi, vicini, route, raggiungibilità IP, DNS, socket, firewall e protocollo applicativo. Saltare direttamente a `ping` o DNS rende difficile localizzare il guasto.

Ogni strumento osserva solo una parte. Un ping fallito può dipendere da ICMP filtrato pur con servizio funzionante; un traceroute incompleto non dimostra necessariamente che la destinazione sia irraggiungibile.

## Quando usarlo

- Assenza completa di connettività.
- DNS lento o risultati errati.
- Porta raggiungibile localmente ma non da remoto.
- Latenza, perdita o MTU sospetta.
- Route o VPN che selezionano un percorso inatteso.

## Come funziona

Sequenza pratica:

1. controllare stato e contatori dell'interfaccia;
2. verificare indirizzi e prefissi;
3. verificare vicino e gateway;
4. risolvere la route effettiva;
5. testare un indirizzo senza DNS;
6. testare la risoluzione secondo NSS;
7. verificare listener e connessioni;
8. controllare firewall;
9. provare il protocollo applicativo e leggere i log.

`traceroute` invia pacchetti con TTL crescente e osserva risposte intermedie. Router e firewall possono non rispondere, rispondere con priorità bassa o instradare diversamente il ritorno; gli asterischi non equivalgono automaticamente a perdita del traffico applicativo.

## API / Sintassi

Mostrare link e contatori:

```bash
ip -s link
```

Mostrare indirizzi in forma compatta:

```bash
ip -brief address
```

Mostrare route effettiva:

```bash
ip route get 1.1.1.1
```

Controllare vicini:

```bash
ip neighbour show
```

Inviare un numero limitato di echo request:

```bash
ping -c 4 1.1.1.1
```

Tracciare il percorso senza risoluzione nomi:

```bash
traceroute -n 1.1.1.1
```

Verificare la risoluzione usata dalle applicazioni:

```bash
getent ahosts example.com
```

Mostrare listener TCP e UDP con processi:

```bash
sudo ss -lntup
```

## Esempio pratico

Verificare prima il gestore e il device:

```bash
nmcli device status
```

Controllare la route verso il server:

```bash
ip route get 203.0.113.10
```

Testare la porta anziché soltanto ICMP:

```bash
nc -vz 203.0.113.10 443
```

Provare il protocollo reale con dettagli TLS e HTTP:

```bash
curl -v https://example.com/
```

Se il servizio è locale, controllare contemporaneamente listener e journal. Se è remoto, ripetere i test dal client e verificare il percorso di ritorno sul server.

## Varianti

- `tracepath` scopre percorso e indicazioni di Path MTU senza richiedere le stesse opzioni di traceroute.
- `mtr` combina ping e traceroute su più campioni, ma gli hop intermedi possono limitare ICMP.
- `tcpdump` osserva pacchetti sull'interfaccia e richiede filtri per ridurre dati e informazioni sensibili.
- `ethtool` espone carrier, velocità e contatori driver per Ethernet.
- `resolvectl` analizza DNS per link con systemd-resolved.
- `nft monitor trace` può seguire pacchetti soltanto dopo aver predisposto regole di tracing adeguate.

## Errori comuni

- Considerare ping riuscito prova che una porta applicativa funzioni.
- Considerare ping fallito prova che l'host sia spento.
- Lasciare risoluzione DNS attiva nei test di routing e latenza, aggiungendo ritardi confondenti.
- Ignorare IPv6 quando il nome restituisce record AAAA.
- Testare soltanto dal server o soltanto dal client.
- Catturare traffico senza limitare interfaccia, host e porta.
- Cambiare più livelli contemporaneamente e perdere la causa originale.

## Checklist

- Link e contatori mostrano carrier ed errori?
- Indirizzo e prefisso sono corretti?
- Gateway e vicino sono raggiungibili?
- `ip route get` sceglie percorso e sorgente attesi?
- Il test IP è separato dal test DNS?
- Il processo ascolta su protocollo e indirizzo corretti?
- Firewall, percorso di ritorno e protocollo applicativo sono stati verificati?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Interfacce e indirizzi IP|Interfacce e indirizzi IP]]
- [[Linux/Pagine/Routing|Routing]]
- [[Linux/Pagine/DNS|DNS]]
- [[Linux/Pagine/Porte e socket|Porte e socket]]
- [[Linux/Pagine/NetworkManager|NetworkManager]]
- [[Linux/Pagine/Firewall con nftables|Firewall con nftables]]

## Fonti

- [ip(8)](https://man7.org/linux/man-pages/man8/ip.8.html)
- [ss(8)](https://man7.org/linux/man-pages/man8/ss.8.html)
- [ping(8)](https://man7.org/linux/man-pages/man8/ping.8.html)
- [traceroute(8)](https://man7.org/linux/man-pages/man8/traceroute.8.html)
- [tcpdump documentation](https://www.tcpdump.org/manpages/tcpdump.1.html)
