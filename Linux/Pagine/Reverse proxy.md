---
date: 2026-07-13
area: Linux
topic: Reverse proxy HTTP
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, server, reverse-proxy, http, tls, nginx]
aliases: [Proxy inverso, HTTP gateway]
prerequisites: [Web server, Porte e socket, DNS]
related: [Firewall con nftables, Container, Monitoraggio del sistema]
---

# Reverse proxy

## Sintesi

Un reverse proxy riceve richieste per conto di uno o piu backend, sceglie la destinazione, inoltra la richiesta e restituisce la risposta al client. Il client vede il proxy come endpoint del servizio; i backend possono restare su loopback o rete privata.

Puo centralizzare TLS, routing, autenticazione, limiti e osservabilita, ma diventa anche un punto critico. Header fidati, timeout, dimensioni dei body, buffering, WebSocket e salute degli upstream devono essere configurati deliberatamente.

## Quando usarlo

- Esporre applicazioni che ascoltano solo su loopback o rete privata.
- Pubblicare piu servizi sotto hostname o percorsi differenti.
- Centralizzare certificati TLS e redirect HTTPS.
- Bilanciare richieste tra piu backend.
- Applicare autenticazione, rate limit o header comuni al bordo.

## Come funziona

Il proxy accetta la connessione client e crea una connessione separata verso l'upstream. Questo spezza il contesto di rete originale: indirizzo client, schema e hostname devono essere trasmessi con header controllati, per esempio `Forwarded` o `X-Forwarded-*`.

Il backend deve fidarsi di tali header soltanto quando la richiesta proviene da proxy noti. Se accetta direttamente traffico esterno, un client puo falsificare l'identita riportata. Firewall e bind su loopback o rete privata devono impedire il bypass del proxy.

Timeout distinti governano connessione all'upstream, invio della richiesta e attesa della risposta. Il buffering protegge backend lenti o client lenti, ma puo interferire con streaming e Server-Sent Events. WebSocket richiede il corretto upgrade della connessione per i proxy che non lo gestiscono automaticamente.

La terminazione TLS sul proxy protegge il tratto client-proxy. Il tratto proxy-backend resta separato: su reti non fidate deve usare TLS con verifica del certificato, mTLS o un canale equivalente.

## API / Sintassi

Verificare la configurazione Nginx:

```bash
sudo nginx -t
```

Verificare che il backend locale risponda direttamente:

```bash
curl -I http://127.0.0.1:8080/
```

Verificare il percorso attraverso il proxy:

```bash
curl -I --resolve app.example.test:80:127.0.0.1 http://app.example.test/
```

Seguire i log Nginx tramite systemd:

```bash
sudo journalctl -u nginx -f
```

Ricaricare Nginx dopo il test:

```bash
sudo systemctl reload nginx
```

Avviare rapidamente un reverse proxy Caddy in ascolto sulla porta 2080:

```bash
caddy reverse-proxy --from :2080 --to 127.0.0.1:8080
```

## Esempio pratico

Una configurazione Nginx di base per un'applicazione locale puo essere:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name app.example.test;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 5s;
        proxy_read_timeout 60s;
    }
}
```

Assicurarsi che il backend ascolti solo sull'indirizzo previsto:

```bash
sudo ss -ltnp
```

Provare prima il backend:

```bash
curl -I http://127.0.0.1:8080/
```

Testare la configurazione proxy:

```bash
sudo nginx -t
```

Ricaricare e provare il percorso esterno:

```bash
sudo systemctl reload nginx
```

```bash
curl -I --resolve app.example.test:80:127.0.0.1 http://app.example.test/
```

## Varianti

- Nginx, Apache HTTP Server, Caddy e HAProxy possono operare come reverse proxy con caratteristiche differenti.
- Il routing puo basarsi su hostname, percorso, header o altre proprieta della richiesta.
- Il load balancing distribuisce traffico tra upstream e richiede health check e politica di retry consapevole.
- Un Unix socket evita una porta TCP locale ma richiede ownership e permessi corretti.
- TLS passthrough conserva la terminazione sul backend; TLS termination la sposta sul proxy.
- FastCGI collega direttamente alcuni runtime applicativi e non coincide con un reverse proxy HTTP.
- Un forward proxy agisce per conto del client verso destinazioni esterne; non va confuso con il reverse proxy.

## Errori comuni

- Lasciare il backend raggiungibile pubblicamente e permettere di bypassare il proxy.
- Fidarsi di `X-Forwarded-For` proveniente da qualunque client.
- Usare HTTPS verso l'upstream disabilitando la verifica del certificato.
- Omettere hostname o SNI corretti quando l'upstream HTTPS ospita piu siti.
- Applicare retry automatici a richieste non idempotenti e duplicare operazioni.
- Usare timeout infiniti o troppo bassi senza considerare il comportamento dell'applicazione.
- Abilitare cache su risposte private, autenticate o variabili senza una chiave corretta.
- Dimenticare upgrade WebSocket, streaming o limiti del body.
- Restituire al client dettagli interni del backend negli errori.

## Checklist

- Il backend e raggiungibile soltanto dal proxy e dagli amministratori previsti?
- Hostname, percorso e regole di riscrittura preservano la semantica dell'applicazione?
- Gli header forwarded vengono sovrascritti o accettati solo da proxy fidati?
- TLS protegge entrambi i tratti che attraversano reti non fidate?
- Timeout, buffering, body size e WebSocket sono configurati per il workload?
- Retry e load balancing rispettano idempotenza e stato delle sessioni?
- Health check verifica un segnale utile senza sovraccaricare il backend?
- Access log collega richiesta esterna, upstream, latenza e codice di risposta?
- Esiste capacita e ridondanza sufficiente per evitare un singolo punto di guasto?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Web server|Web server]]
- [[Linux/Pagine/Porte e socket|Porte e socket]]
- [[Linux/Pagine/DNS|DNS]]
- [[Linux/Pagine/Firewall con nftables|Firewall con nftables]]
- [[Linux/Pagine/Container|Container]]
- [[Linux/Pagine/Monitoraggio del sistema|Monitoraggio del sistema]]

## Fonti

- [Nginx proxy module](https://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Apache HTTP Server - Reverse Proxy Guide](https://httpd.apache.org/docs/current/en/howto/reverse_proxy.html)
- [Caddy - reverse_proxy](https://caddyserver.com/docs/caddyfile/directives/reverse_proxy)
