---
date: 2026-07-11
area: Linux
topic: NetworkManager
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, networking, networkmanager, nmcli, wifi]
aliases: [nmcli, Gestione rete con NetworkManager]
prerequisites: [Interfacce e indirizzi IP, Routing, DNS]
related: [Diagnostica con ip ss ping e traceroute, systemd]
---

# NetworkManager

## Sintesi

NetworkManager gestisce device e profili di connessione per Ethernet, Wi-Fi, VPN, bridge, VLAN e altre tecnologie. Un profilo contiene configurazione persistente; una connessione attiva è l'applicazione di un profilo a un device.

`nmcli` interroga e modifica NetworkManager tramite D-Bus. Usarlo evita conflitti con modifiche manuali runtime eseguite tramite `ip`, che il manager può sostituire alla successiva riattivazione.

## Quando usarlo

- Configurare DHCP o indirizzi statici persistenti.
- Gestire Wi-Fi e VPN senza interfaccia grafica.
- Controllare profili attivi e autoconnect.
- Diagnosticare DNS e route ricevuti per connessione.
- Automatizzare configurazioni con output stabile e campi espliciti.

## Come funziona

Un **device** è un'interfaccia presente; una **connection** è un profilo salvato. Più profili possono riferirsi allo stesso device, ma l'attivazione seleziona quello compatibile e applica indirizzi, route, DNS e proprietà di livello link.

Metodi IPv4/IPv6 comuni:

| Metodo | Significato |
| --- | --- |
| `auto` | configurazione automatica, DHCP o SLAAC secondo famiglia |
| `manual` | indirizzi e route statici |
| `disabled` | famiglia disabilitata nel profilo |
| `link-local` | soltanto configurazione link-local dove supportata |

I profili keyfile sono normalmente conservati sotto `/etc/NetworkManager/system-connections/` con permessi restrittivi, ma posizione e plugin possono variare per distribuzione.

## API / Sintassi

Mostrare lo stato generale:

```bash
nmcli general status
```

Mostrare device e stato:

```bash
nmcli device status
```

Elencare profili configurati:

```bash
nmcli connection show
```

Mostrare soltanto connessioni attive:

```bash
nmcli connection show --active
```

Mostrare dettagli IP e DNS di un device:

```bash
nmcli device show eth0
```

Creare un profilo Ethernet DHCP:

```bash
sudo nmcli connection add type ethernet ifname eth0 con-name lan-dhcp ipv4.method auto ipv6.method auto
```

Creare un profilo IPv4 statico:

```bash
sudo nmcli connection add type ethernet ifname eth0 con-name lan-static ipv4.method manual ipv4.addresses 192.0.2.10/24 ipv4.gateway 192.0.2.1 ipv4.dns 192.0.2.53
```

Attivare un profilo:

```bash
sudo nmcli connection up lan-static
```

## Esempio pratico

Clonare un profilo prima di modificarlo:

```bash
sudo nmcli connection clone lan-dhcp lan-test
```

Impostare indirizzo statico sul clone:

```bash
sudo nmcli connection modify lan-test ipv4.method manual ipv4.addresses 192.0.2.10/24 ipv4.gateway 192.0.2.1 ipv4.dns 192.0.2.53
```

Attivarlo soltanto con un accesso di recupero disponibile:

```bash
sudo nmcli connection up lan-test
```

Verificare stato effettivo con `nmcli`, `ip address`, `ip route` e resolver. Su una macchina remota, cambiare indirizzo o route può interrompere immediatamente SSH.

## Varianti

- `nmtui` offre un'interfaccia testuale interattiva.
- `nmcli --ask device wifi connect SSID` evita di lasciare la password nella cronologia del comando.
- `nmcli -t -f ...` produce output terse per script; conviene usare nomi completi di comandi e campi.
- Dispatcher script reagiscono a eventi, ma devono essere brevi, sicuri e idempotenti.
- Profili VPN richiedono plugin specifici e gestione consapevole dei segreti.
- Alcuni server usano systemd-networkd o configurazioni native della distribuzione invece di NetworkManager.

## Errori comuni

- Confondere nome del profilo con nome dell'interfaccia.
- Modificare `ip address` e aspettarsi che NetworkManager salvi il cambiamento.
- Disattivare una connessione remota senza accesso alternativo.
- Inserire password Wi-Fi direttamente nella riga di comando e nella history.
- Configurare gateway multipli senza metriche e route coerenti.
- Modificare file keyfile senza ricaricare i profili.
- Usare abbreviazioni `nmcli` negli script, che possono diventare ambigue in futuro.

## Checklist

- NetworkManager è il gestore effettivo del device?
- Device e profilo sono stati distinti?
- DHCP, indirizzi, gateway, DNS e metriche sono coerenti?
- Il profilo è persistente e ha autoconnect appropriato?
- Esiste un accesso di recupero prima di cambiare rete remota?
- La configurazione attiva coincide con quella salvata?
- Segreti e permessi dei profili sono protetti?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Interfacce e indirizzi IP|Interfacce e indirizzi IP]]
- [[Linux/Pagine/Routing|Routing]]
- [[Linux/Pagine/DNS|DNS]]
- [[Linux/Pagine/Diagnostica con ip ss ping e traceroute|Diagnostica con ip, ss, ping e traceroute]]

## Fonti

- [NetworkManager - nmcli](https://networkmanager.dev/docs/api/latest/nmcli.html)
- [NetworkManager settings](https://networkmanager.dev/docs/api/latest/nm-settings-nmcli.html)
- [nmcli examples](https://networkmanager.dev/docs/api/latest/nmcli-examples.html)
