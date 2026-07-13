---
date: 2026-07-13
area: Linux
topic: Monitoraggio continuativo dei server Linux
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, server, monitoring, prometheus, alerting, osservabilita]
aliases: [Monitoring Linux, Osservabilita server]
prerequisites: [Monitoraggio delle risorse, Logging con journalctl, systemd]
related: [Cgroups, Web server, Database su Linux]
---

# Monitoraggio del sistema

## Sintesi

Il monitoraggio continuativo raccoglie nel tempo metriche, log e risultati di probe per rilevare guasti, saturazione e degradazione prima o durante l'impatto sugli utenti. Si distingue dalla diagnosi interattiva: `top` descrive il momento corrente, mentre una serie storica permette confronto, correlazione e alert.

Un sistema utile parte dagli obiettivi del servizio e collega sintomi esterni a cause interne. Dashboard senza retention adeguata o alert senza azione associata aumentano rumore senza migliorare affidabilita.

## Quando usarlo

- Conservare una baseline di CPU, memoria, disco, rete e servizi.
- Rilevare indisponibilita o lentezza da una prospettiva esterna.
- Generare alert su condizioni persistenti e azionabili.
- Correlare eventi applicativi, metriche e modifiche operative.
- Pianificare capacita e verificare obiettivi di servizio.

## Come funziona

Una pipeline tipica comprende:

1. applicazioni, kernel ed exporter producono telemetria;
2. collector o server raccolgono e normalizzano i dati;
3. un backend conserva serie temporali e log;
4. query e dashboard rendono i segnali esplorabili;
5. regole generano alert gestiti da routing, deduplicazione e silenziamenti.

Per un servizio online sono utili quattro segnali: latenza, traffico, errori e saturazione. Per l'host vanno inoltre osservati pressione PSI, memoria disponibile, swap, spazio e inode, latenza I/O, errori di rete, reboot, stato delle unit e scadenza dei certificati.

Prometheus raccoglie metriche numeriche come serie temporali etichettate, normalmente tramite pull HTTP. Node Exporter espone metriche dell'host; exporter specifici espongono database o servizi. Alertmanager riceve alert da Prometheus e applica grouping, inhibition, silenziamenti e notifiche.

I log descrivono eventi discreti e contesto. Le metriche mostrano andamento aggregato; le trace collegano passaggi di una richiesta distribuita. Nessun segnale sostituisce automaticamente gli altri.

Il monitoraggio deve avere un proprio controllo: assenza di campioni, collector fermo, disco del backend pieno o notifiche non consegnate devono essere rilevabili da un percorso indipendente.

## API / Sintassi

Controllare rapidamente le risorse correnti:

```bash
systemd-cgtop
```

Mostrare la pressione CPU, memoria e I/O:

```bash
cat /proc/pressure/cpu
```

Mostrare lo spazio occupato dal journal:

```bash
journalctl --disk-usage
```

Mostrare unit systemd fallite:

```bash
systemctl --failed
```

Verificare l'endpoint locale di Node Exporter:

```bash
curl http://127.0.0.1:9100/metrics
```

Validare una configurazione Prometheus:

```bash
promtool check config /etc/prometheus/prometheus.yml
```

Validare file di regole Prometheus:

```bash
promtool check rules /etc/prometheus/rules/*.yml
```

Controllare lo stato di Prometheus:

```bash
systemctl status prometheus
```

Leggere i log recenti di Prometheus:

```bash
sudo journalctl -u prometheus -b
```

## Esempio pratico

Una configurazione Prometheus minima per uno host con Node Exporter puo includere:

```yaml
scrape_configs:
  - job_name: linux
    static_configs:
      - targets:
          - server.example:9100
```

Prima del reload, verificare la sintassi:

```bash
promtool check config /etc/prometheus/prometheus.yml
```

Una regola deve evitare alert su picchi irrilevanti e indicare un'azione. Per esempio, una condizione sullo spazio disponibile dovrebbe durare abbastanza da filtrare transitori, includere filesystem e host e collegare una procedura di intervento.

Dopo avere installato una regola, validarla:

```bash
promtool check rules /etc/prometheus/rules/*.yml
```

Verificare infine che il target sia raggiungibile, che la serie arrivi nel backend e che una notifica di prova completi l'intero percorso fino al destinatario.

## Varianti

- Prometheus e adatto a metriche numeriche e alert basati su serie temporali.
- Grafana visualizza dati provenienti da Prometheus e altri backend, ma non e di per se il collector.
- Loki, journald e altri sistemi centralizzano log con modelli di indicizzazione differenti.
- OpenTelemetry definisce API, SDK e protocolli per metriche, log e trace.
- Grafana Alloy e OpenTelemetry Collector possono raccogliere e inoltrare piu segnali.
- Blackbox Exporter controlla servizi dall'esterno tramite HTTP, TCP, DNS o ICMP.
- `sysstat` e `sar` offrono storicizzazione locale leggera per diagnosi dell'host.
- Un servizio esterno di uptime continua a segnalare problemi anche se il monitoraggio interno e irraggiungibile.

## Errori comuni

- Allertare su ogni metrica senza collegamento a impatto o azione.
- Usare soglie istantanee e generare flapping durante picchi normali.
- Monitorare soltanto l'host e non il percorso realmente usato dall'utente.
- Esporre endpoint metriche pubblicamente con informazioni sensibili.
- Creare label ad alta cardinalita, per esempio ID richiesta o utente.
- Conservare log e metriche senza limiti di retention e saturare lo storage.
- Confondere assenza di alert con salute quando il collector e fermo.
- Usare dashboard come sostituto di alert e procedure operative.
- Raccogliere segreti, query o dati personali nei log senza minimizzazione.
- Non testare notifiche, silenziamenti, escalation e reperibilita.

## Checklist

- Gli obiettivi del servizio e i sintomi utente da rilevare sono espliciti?
- Metriche, log e probe coprono host, applicazione e dipendenze?
- Baseline, retention e frequenza di raccolta sono adeguate?
- Gli alert sono persistenti, azionabili e associati a una procedura?
- Label e log evitano cardinalita incontrollata e dati sensibili?
- Exporter e endpoint sono protetti da rete e privilegi minimi?
- Il backend ha spazio, backup e alta disponibilita coerenti con il suo ruolo?
- Assenza di campioni e guasti del monitoraggio generano un segnale indipendente?
- Notifiche e percorso di escalation vengono provati periodicamente?
- Dashboard e query permettono di passare dal sintomo alla causa?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Monitoraggio delle risorse|Monitoraggio delle risorse]]
- [[Linux/Pagine/Logging con journalctl|Logging con journalctl]]
- [[Linux/Pagine/Cgroups|Cgroups]]
- [[Linux/Pagine/systemd|systemd]]
- [[Linux/Pagine/Web server|Web server]]
- [[Linux/Pagine/Database su Linux|Database su Linux]]

## Fonti

- [Prometheus overview](https://prometheus.io/docs/introduction/overview/)
- [Prometheus alerting overview](https://prometheus.io/docs/alerting/latest/overview/)
- [Prometheus Node Exporter](https://github.com/prometheus/node_exporter)
- [Linux kernel - Pressure Stall Information](https://docs.kernel.org/accounting/psi.html)
- [Grafana Alloy documentation](https://grafana.com/docs/alloy/latest/)
- [OpenTelemetry documentation](https://opentelemetry.io/docs/)
