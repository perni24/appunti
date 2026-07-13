---
date: 2026-07-13
area: Linux
topic: Web server su Linux
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, server, http, https, nginx, apache]
aliases: [Server HTTP Linux, Nginx e Apache]
prerequisites: [Porte e socket, DNS, systemd]
related: [Reverse proxy, Firewall con nftables, Logging con journalctl]
---

# Web server

## Sintesi

Un web server accetta richieste HTTP o HTTPS, seleziona un sito in base a indirizzo, porta e hostname e restituisce contenuti statici oppure inoltra la richiesta a un'applicazione. Nginx e Apache HTTP Server sono implementazioni diffuse, con modelli di configurazione e moduli differenti.

La messa in servizio non termina quando appare una pagina: DNS, TLS, permessi sui file, firewall, log, limiti, aggiornamenti e test di configurazione sono parte dello stesso servizio.

## Quando usarlo

- Pubblicare file statici e documentazione.
- Ospitare piu siti sullo stesso indirizzo mediante virtual host.
- Terminare connessioni TLS.
- Servire asset davanti a un'applicazione dinamica.
- Applicare header, redirect, compressione e limiti comuni.

## Come funziona

Il processo master apre le porte configurate e coordina worker o processi figli. Il server seleziona la configurazione in base all'indirizzo locale, alla porta e al campo `Host`; con HTTPS, il nome SNI interviene gia durante la negoziazione TLS.

Un virtual host Nginx e normalmente espresso da un blocco `server`; Apache usa `<VirtualHost>`. Il `document root` mappa gli URI su file locali. La mappatura deve impedire traversal, esposizione di file di configurazione e accesso a directory non previste.

Per contenuti dinamici, il web server puo usare reverse proxy HTTP, FastCGI o altri gateway. Codice applicativo e web server dovrebbero eseguire con utenti e privilegi separati. Le chiavi private TLS devono essere leggibili solo dal servizio che ne ha necessita.

## API / Sintassi

Verificare la configurazione Nginx:

```bash
sudo nginx -t
```

Mostrare la configurazione Nginx espansa:

```bash
sudo nginx -T
```

Verificare la configurazione Apache:

```bash
sudo apachectl configtest
```

Mostrare il mapping dei virtual host Apache:

```bash
sudo apachectl -S
```

Verificare le porte in ascolto:

```bash
sudo ss -ltnp
```

Richiedere soltanto gli header HTTP:

```bash
curl -I http://example.test
```

Provare un virtual host prima che il DNS sia aggiornato:

```bash
curl -I --resolve example.test:80:127.0.0.1 http://example.test/
```

Ricaricare Nginx dopo un test riuscito:

```bash
sudo systemctl reload nginx
```

Leggere i log Nginx del boot corrente:

```bash
sudo journalctl -u nginx -b
```

## Esempio pratico

Una configurazione Nginx minima per contenuti statici puo essere:

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name example.test;

    root /srv/www/example;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }
}
```

Creare la directory del sito con ownership amministrativa e lettura per il server:

```bash
sudo install -d -o root -g root -m 0755 /srv/www/example
```

Dopo avere inserito il contenuto, verificare la sintassi:

```bash
sudo nginx -t
```

Ricaricare soltanto se il test e riuscito:

```bash
sudo systemctl reload nginx
```

Provare il virtual host localmente:

```bash
curl -I --resolve example.test:80:127.0.0.1 http://example.test/
```

In produzione aggiungere HTTPS con una procedura di emissione e rinnovo verificata, quindi redirigere HTTP verso HTTPS senza rendere irraggiungibili challenge o endpoint necessari.

## Varianti

- Nginx usa un modello event-driven con processi worker.
- Apache supporta diversi Multi-Processing Module e un ecosistema ampio di moduli.
- Caddy integra automazione HTTPS e una configurazione orientata ai siti.
- Un sito statico legge file dal filesystem; un'app dinamica usa un gateway o reverse proxy.
- I virtual host name-based condividono indirizzo e porta ma differiscono per hostname.
- HTTP/2 e HTTP/3 cambiano il trasporto, non eliminano la necessita di corretti virtual host, TLS e limiti.

## Errori comuni

- Eseguire il reload senza prima testare la configurazione.
- Credere che creare un virtual host configuri automaticamente DNS e firewall.
- Dare al processo web permessi di scrittura sull'intero document root.
- Pubblicare backup, file `.env`, repository Git o directory di upload senza regole specifiche.
- Usare il virtual host predefinito e servire il sito sbagliato per hostname inattesi.
- Ignorare IPv6 mentre il servizio ascolta anche su `[::]`.
- Terminare TLS con certificato scaduto, catena incompleta o rinnovo non monitorato.
- Abilitare directory listing o metodi HTTP non necessari.
- Conservare log senza rotazione, limiti e protezione dei dati sensibili.

## Checklist

- DNS punta agli indirizzi IPv4 e IPv6 corretti?
- Porte 80 e 443 sono in ascolto e permesse dal firewall solo dove serve?
- Il virtual host seleziona hostname e document root corretti?
- Utente del servizio e permessi sui file rispettano il minimo privilegio?
- Configurazione e mapping dei virtual host superano i test?
- Certificato, catena, rinnovo e redirect HTTPS sono verificati?
- Header, limiti di body e timeout sono coerenti con l'applicazione?
- Access log ed error log sono raccolti, ruotati e monitorati?
- Esiste una procedura di rollback della configurazione?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Porte e socket|Porte e socket]]
- [[Linux/Pagine/DNS|DNS]]
- [[Linux/Pagine/systemd|systemd]]
- [[Linux/Pagine/Firewall con nftables|Firewall con nftables]]
- [[Linux/Pagine/Reverse proxy|Reverse proxy]]
- [[Linux/Pagine/Monitoraggio del sistema|Monitoraggio del sistema]]

## Fonti

- [Nginx Beginner's Guide](https://nginx.org/en/docs/beginners_guide.html)
- [Apache HTTP Server - Virtual Hosts](https://httpd.apache.org/docs/2.4/vhosts/)
- [Apache HTTP Server - Security Tips](https://httpd.apache.org/docs/2.4/misc/security_tips.html)
- [Caddy documentation](https://caddyserver.com/docs/)
