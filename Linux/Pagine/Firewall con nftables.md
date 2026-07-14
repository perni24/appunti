---
date: 2026-07-11
area: Linux
topic: Firewall nftables
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, networking, nftables, firewall, netfilter]
aliases: [nftables, Firewall Linux]
prerequisites: [Porte e socket, Routing, sudo e privilegi amministrativi]
related: [SSH, Diagnostica con ip ss ping e traceroute]
---

# Firewall con nftables

## Sintesi

nftables configura il framework Netfilter del kernel tramite regole, chain e table. Supporta filtraggio stateful, NAT, set e map con una sintassi comune per IPv4 e IPv6. Il comando `nft` modifica il ruleset runtime; la persistenza dipende dal servizio e dai file configurati dalla distribuzione.

Un firewall riduce traffico consentito, ma non sostituisce autenticazione, aggiornamenti e configurazione sicura dei servizi.

## Quando usarlo

- Applicare una policy di ingresso predefinita restrittiva.
- Consentire soltanto servizi e sorgenti necessari.
- Filtrare traffico inoltrato tra interfacce.
- Implementare NAT quando l'architettura lo richiede.
- Usare set dinamici e contatori per regole mantenibili.

## Come funziona

Gerarchia:

| Oggetto | Ruolo |
| --- | --- |
| table | contiene chain, set e altri oggetti per una famiglia |
| base chain | collegata a un hook del percorso pacchetto |
| regular chain | richiamata da altre chain |
| rule | confronta espressioni ed esegue statement |
| set/map | collezione efficiente di valori o associazioni |

La famiglia `inet` permette regole condivise IPv4/IPv6. Le base chain specificano hook come `input`, `forward` e `output`, priorità e policy. Conntrack classifica flussi con stati come `new`, `established`, `related` e `invalid`.

Il firewall vede il traffico nel namespace in cui è configurato. Container manager, firewalld e altri strumenti possono creare o modificare regole: serve un unico modello di ownership chiaro.

## API / Sintassi

Mostrare l'intero ruleset:

```bash
sudo nft list ruleset
```

Mostrare una table specifica:

```bash
sudo nft list table inet filter
```

Controllare la sintassi di un file senza applicarlo:

```bash
sudo nft --check --file /etc/nftables.conf
```

Applicare il file validato:

```bash
sudo nft --file /etc/nftables.conf
```

Monitorare modifiche e trace secondo configurazione:

```bash
sudo nft monitor
```

Mostrare contatori nel ruleset:

```bash
sudo nft --numeric list ruleset
```

## Esempio pratico

Ruleset essenziale per un host SSH, da adattare prima dell'uso:

```nftables
flush ruleset

table inet filter {
    chain input {
        type filter hook input priority filter; policy drop;

        iifname "lo" accept
        ct state invalid drop
        ct state established,related accept
        meta l4proto icmp accept
        meta l4proto ipv6-icmp accept
        tcp dport 22 ct state new accept
    }

    chain forward {
        type filter hook forward priority filter; policy drop;
    }

    chain output {
        type filter hook output priority filter; policy accept;
    }
}
```

Validarlo senza applicarlo:

```bash
sudo nft --check --file /etc/nftables.conf
```

Su host remoto mantenere una sessione di recupero e predisporre rollback automatico prima dell'applicazione. La direttiva `flush ruleset` elimina anche regole create da altri strumenti e non è appropriata senza ownership esclusiva.

## Varianti

- Table `ip` e `ip6` separano le famiglie; `inet` consente molte regole comuni.
- NAT usa chain con hook e tipo `nat`, distinti dalle chain di filtro.
- Set e interval set compattano grandi elenchi di indirizzi o porte.
- `limit rate` applica rate limiting a eventi selezionati.
- Logging va limitato per evitare flooding e consumo disco.
- firewalld può usare nftables come backend e deve restare il punto di gestione se configurato.

## Errori comuni

- Applicare policy `drop` da remoto prima di consentire la sessione amministrativa.
- Usare `flush ruleset` cancellando regole di container, VPN o altri manager.
- Bloccare ICMPv6 e interrompere funzioni essenziali di IPv6.
- Configurare soltanto IPv4 lasciando esposizione IPv6 inattesa.
- Confondere chain `input` con traffico `forward` o destinato a container.
- Salvare un ruleset runtime senza configurarne il caricamento al boot.
- Affidarsi al firewall mentre il servizio ascolta più ampiamente del necessario.

## Checklist

- Quale strumento possiede il ruleset: nftables diretto, firewalld o altro?
- IPv4 e IPv6 sono entrambi considerati?
- SSH o il canale di gestione restano consentiti?
- Traffico established/related e ICMP necessario sono gestiti?
- Input, forward e output hanno policy intenzionali?
- Il file passa `nft --check` e dispone di rollback?
- Persistenza e interazioni con container/VPN sono state verificate?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Porte e socket|Porte e socket]]
- [[Linux/Pagine/Routing|Routing]]
- [[Linux/Pagine/SSH|SSH]]
- [[Linux/Pagine/Diagnostica con ip ss ping e traceroute|Diagnostica con ip, ss, ping e traceroute]]

## Fonti

- [nftables man page](https://netfilter.org/projects/nftables/manpage.html)
- [nftables wiki](https://wiki.nftables.org/)
- [Netfilter project](https://www.netfilter.org/)
