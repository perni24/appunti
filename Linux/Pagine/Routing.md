---
date: 2026-07-11
area: Linux
topic: Routing IP
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, networking, routing, gateway, iproute2]
aliases: [Routing Linux, Tabelle di routing]
prerequisites: [Interfacce e indirizzi IP]
related: [NetworkManager, Firewall con nftables, Diagnostica con ip ss ping e traceroute]
---

# Routing

## Sintesi

Il routing decide il prossimo hop e l'interfaccia usata per un pacchetto. Linux seleziona prima le regole di policy e poi una tabella; all'interno della tabella preferisce normalmente il prefisso più specifico e considera metriche e attributi della route.

Una default route copre le destinazioni senza percorso più specifico. Non sostituisce le route direttamente connesse né garantisce che il gateway inoltri il traffico.

## Quando usarlo

- Verificare quale percorso userà una destinazione.
- Configurare temporaneamente gateway e reti statiche.
- Diagnosticare host multihomed o VPN.
- Comprendere metriche e policy routing.
- Abilitare un host a inoltrare pacchetti tra reti.

## Come funziona

Una route contiene prefisso destinazione, next hop opzionale, interfaccia, sorgente preferita, metrica e protocollo di origine. Le reti direttamente connesse non richiedono un gateway; una route `default` equivale a `0.0.0.0/0` o `::/0`.

`ip route get` esegue una risoluzione per una destinazione specifica e mostra anche sorgente scelta. È più utile di leggere soltanto la tabella quando esistono più indirizzi, regole o tabelle.

Il forwarding tra interfacce richiede parametri kernel e policy firewall coerenti. L'abilitazione di `net.ipv4.ip_forward` da sola non configura NAT né autorizza il traffico.

## API / Sintassi

Mostrare la tabella principale IPv4:

```bash
ip route show
```

Mostrare le route IPv6:

```bash
ip -6 route show
```

Risolvere il percorso verso una destinazione:

```bash
ip route get 1.1.1.1
```

Mostrare le regole di policy routing:

```bash
ip rule show
```

Aggiungere temporaneamente una route di rete:

```bash
sudo ip route add 198.51.100.0/24 via 192.0.2.1 dev eth0
```

Rimuoverla:

```bash
sudo ip route del 198.51.100.0/24 via 192.0.2.1 dev eth0
```

Aggiungere temporaneamente una default route:

```bash
sudo ip route add default via 192.0.2.1 dev eth0 metric 100
```

Leggere il forwarding IPv4:

```bash
sysctl net.ipv4.ip_forward
```

## Esempio pratico

Controllare quale sorgente e gateway vengono selezionati:

```bash
ip route get 203.0.113.10
```

Verificare che il gateway appartenga a una rete raggiungibile dal link:

```bash
ip route show scope link
```

Controllare il vicino corrispondente:

```bash
ip neighbour show
```

Una route corretta sul client non garantisce il percorso di ritorno. Problemi asimmetrici richiedono il controllo di entrambi i lati, dei firewall e di eventuali NAT.

## Varianti

- Più default route possono coesistere con metriche differenti.
- Policy routing usa `ip rule` e tabelle multiple in base a sorgente, mark o altri criteri.
- ECMP distribuisce traffico tra più next hop secondo supporto e configurazione.
- Una VPN può installare route più specifiche o cambiare la default.
- Namespace e VRF mantengono contesti di routing separati.
- I daemon di routing dinamico apprendono e pubblicano prefissi tramite protocolli come OSPF o BGP.

## Errori comuni

- Aggiungere una default route quando manca invece una route direttamente connessa.
- Configurare un gateway fuori dal prefisso senza una route che lo renda raggiungibile.
- Leggere soltanto `ip route show` e ignorare `ip rule`.
- Confondere routing con DNS.
- Abilitare forwarding senza firewall e policy di sicurezza.
- Dimenticare il percorso di ritorno.
- Applicare route runtime e aspettarsi persistenza nel profilo di rete.

## Checklist

- Quale route restituisce `ip route get`?
- Sorgente, interfaccia, gateway e metrica sono corretti?
- Il gateway è raggiungibile a livello di link?
- Esistono regole o tabelle di policy aggiuntive?
- Il percorso di ritorno è noto?
- Firewall, NAT, VPN o namespace modificano il flusso?
- La configurazione persistente è stata aggiornata nel gestore corretto?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Interfacce e indirizzi IP|Interfacce e indirizzi IP]]
- [[Linux/Pagine/NetworkManager|NetworkManager]]
- [[Linux/Pagine/Firewall con nftables|Firewall con nftables]]
- [[Linux/Pagine/Diagnostica con ip ss ping e traceroute|Diagnostica con ip, ss, ping e traceroute]]

## Fonti

- [ip-route(8)](https://man7.org/linux/man-pages/man8/ip-route.8.html)
- [ip-rule(8)](https://man7.org/linux/man-pages/man8/ip-rule.8.html)
- [Linux kernel - IP sysctl](https://docs.kernel.org/networking/ip-sysctl.html)
