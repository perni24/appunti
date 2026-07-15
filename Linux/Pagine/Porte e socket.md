---
date: 2026-07-11
area: Linux
topic: Socket di rete
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, networking, socket, tcp, udp, porte]
aliases: [Socket Linux, Porte TCP e UDP]
prerequisites: [Interfacce e indirizzi IP, Processi PID e segnali]
related: [Firewall con nftables, SSH, Diagnostica con ip ss ping e traceroute]
---

# Porte e socket

## Sintesi

Un socket è un endpoint di comunicazione. Per IP è descritto da protocollo, indirizzo e porta; una connessione TCP è identificata dalle coppie locale e remota. TCP offre un flusso affidabile e con stato, UDP invia datagrammi senza stabilire una connessione equivalente.

Una porta aperta significa che un socket è in ascolto su un indirizzo raggiungibile. Non basta che il processo esista: bind, route, firewall e namespace determinano l'accessibilità.

## Quando usarlo

- Verificare quale processo ascolta su una porta.
- Capire se un servizio è esposto solo in locale o su tutte le interfacce.
- Diagnosticare connessioni TCP e socket UDP.
- Analizzare socket Unix locali.
- Distinguere errore applicativo, bind e firewall.

## Come funziona

Le porte hanno intervallo 0-65535 e namespace separato per protocollo. La stessa porta numerica può quindi essere usata contemporaneamente da TCP e UDP.

Bind comuni:

| Indirizzo locale | Esposizione |
| --- | --- |
| `127.0.0.1` | loopback IPv4 |
| `::1` | loopback IPv6 |
| indirizzo specifico | soltanto quella interfaccia/indirizzo |
| `0.0.0.0` | tutti gli indirizzi IPv4 locali |
| `::` | wildcard IPv6; relazione con IPv4 dipende da opzioni e sistema |

Le porte inferiori a 1024 sono storicamente privilegiate; Linux può autorizzare il bind tramite root, capability come `CAP_NET_BIND_SERVICE` o un service manager. I servizi in `/etc/services` associano nomi convenzionali a porte, ma non dimostrano quale programma sia attivo.

## API / Sintassi

Mostrare socket TCP e UDP in ascolto con processi:

```bash
sudo ss -lntup
```

Mostrare connessioni TCP senza risoluzione dei nomi:

```bash
ss -tn
```

Filtrare i listener sulla porta 22:

```bash
sudo ss -lntp 'sport = :22'
```

Mostrare socket Unix in ascolto:

```bash
ss -lx
```

Mostrare statistiche riassuntive:

```bash
ss -s
```

Verificare una connessione TCP applicativa con netcat:

```bash
nc -vz 192.0.2.10 443
```

Mostrare il nome convenzionale associato a una porta:

```bash
getent services 22/tcp
```

## Esempio pratico

Controllare se il servizio ascolta:

```bash
sudo ss -lntp 'sport = :8080'
```

Verificare l'indirizzo di bind. Se appare `127.0.0.1:8080`, il servizio non è raggiungibile direttamente da altri host. Se appare `0.0.0.0:8080`, resta comunque necessario verificare firewall e route.

Testare localmente:

```bash
nc -vz 127.0.0.1 8080
```

Testare da un altro host è necessario per valutare il percorso reale; un successo locale non attraversa rete e firewall esterni.

## Varianti

- Socket Unix usano pathname o abstract namespace e permessi locali invece di porte IP.
- TCP attraversa stati come `LISTEN`, `SYN-SENT`, `ESTABLISHED`, `TIME-WAIT`.
- UDP può essere “connected” a livello API pur restando senza handshake TCP.
- `SO_REUSEPORT` permette scenari con più socket sullo stesso endpoint secondo regole specifiche.
- Namespace di rete isolano interfacce, route, firewall e porte.
- Socket activation systemd può mantenere il listener e avviare il servizio su richiesta.

## Errori comuni

- Confondere una voce in `/etc/services` con un processo in ascolto.
- Considerare `0.0.0.0` un indirizzo remoto invece di un bind wildcard.
- Credere che `ping` verifichi una porta TCP.
- Controllare soltanto TCP quando il protocollo usa UDP.
- Dimenticare namespace o container in cui vive il socket.
- Esporre un servizio su wildcard per risolvere un problema locale senza applicare autenticazione e firewall.
- Interpretare `TIME-WAIT` come processo bloccato da terminare.

## Checklist

- Protocollo, porta e indirizzo di bind sono corretti?
- Il socket è nel namespace atteso?
- Quale PID e processo lo possiedono?
- Il test locale funziona?
- Route e firewall consentono il percorso remoto?
- Il servizio usa IPv4, IPv6 o entrambi?
- L'esposizione è limitata al minimo necessario?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Interfacce e indirizzi IP|Interfacce e indirizzi IP]]
- [[Linux/Pagine/Firewall con nftables|Firewall con nftables]]
- [[Linux/Pagine/SSH|SSH]]
- [[Linux/Pagine/Diagnostica con ip ss ping e traceroute|Diagnostica con ip, ss, ping e traceroute]]

## Fonti

- [socket(7)](https://man7.org/linux/man-pages/man7/socket.7.html)
- [tcp(7)](https://man7.org/linux/man-pages/man7/tcp.7.html)
- [udp(7)](https://man7.org/linux/man-pages/man7/udp.7.html)
- [ss(8)](https://man7.org/linux/man-pages/man8/ss.8.html)
