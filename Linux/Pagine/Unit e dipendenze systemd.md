---
date: 2026-07-11
area: Linux
topic: Unit systemd
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, systemd, unit, service, dipendenze]
aliases: [Unit systemd, Service unit systemd]
prerequisites: [systemd, Processi PID e segnali]
related: [Timer systemd, Logging con journalctl]
---

# Unit e dipendenze systemd

## Sintesi

Una unit è una risorsa gestita da systemd e descritta da un file dichiarativo. Il suffisso identifica il tipo, per esempio `.service`, `.socket`, `.timer`, `.target`, `.mount` o `.path`. Le direttive definiscono dipendenze, ordinamento, condizioni e comportamento specifico del tipo.

Le dipendenze di attivazione e l'ordine sono indipendenti: `Requires=` non implica `After=`, e `After=` non avvia automaticamente l'altra unit.

## Quando usarlo

- Creare un servizio supervisionato dal sistema.
- Dichiarare prerequisiti e ordine di avvio.
- Personalizzare una unit fornita da un pacchetto con drop-in.
- Definire restart policy e ambiente di esecuzione.
- Diagnosticare cicli o dipendenze mancanti.

## Come funziona

Sezioni comuni:

| Sezione | Scopo |
| --- | --- |
| `[Unit]` | descrizione, dipendenze, ordinamento e condizioni |
| `[Service]` | processo, tipo, utente, ambiente e restart policy |
| `[Install]` | collegamenti creati da `enable` |

Relazioni principali:

- `Wants=` attiva anche le unit indicate, ma una loro mancata partenza non rende necessariamente fallita questa unit;
- `Requires=` introduce un requisito più forte;
- `After=` e `Before=` ordinano l'avvio e l'arresto senza creare da soli una dipendenza;
- `PartOf=` propaga operazioni come stop e restart dalla unit indicata;
- `WantedBy=` in `[Install]` definisce dove `enable` crea il collegamento.

Per `Type=simple`, il processo configurato è considerato avviato subito dopo la creazione. `Type=exec` attende che l'esecuzione del binario riesca; `notify` richiede una notifica esplicita; `oneshot` attende il completamento; `forking` è destinato a daemon che si staccano con fork.

Le righe `ExecStart=` non vengono interpretate da una shell, salvo avviare esplicitamente una shell. Pipe, ridirezioni, `&&` e variabili con sintassi shell non funzionano automaticamente.

## API / Sintassi

Mostrare il file e tutti i drop-in applicati:

```bash
systemctl cat esempio.service
```

Mostrare dipendenze in forma ad albero:

```bash
systemctl list-dependencies esempio.service
```

Mostrare anche le dipendenze inverse:

```bash
systemctl list-dependencies --reverse esempio.service
```

Creare o modificare un drop-in:

```bash
sudo systemctl edit esempio.service
```

Ricaricare le definizioni delle unit:

```bash
sudo systemctl daemon-reload
```

Verificare staticamente un file di unit:

```bash
systemd-analyze verify /etc/systemd/system/esempio.service
```

Mostrare proprietà specifiche già risolte:

```bash
systemctl show esempio.service -p Requires -p Wants -p After
```

Ripristinare la versione del fornitore rimuovendo override locali:

```bash
sudo systemctl revert esempio.service
```

## Esempio pratico

Una service unit essenziale:

```ini
[Unit]
Description=Applicazione di esempio
After=network-online.target
Wants=network-online.target

[Service]
Type=exec
User=app
Group=app
WorkingDirectory=/srv/app
ExecStart=/srv/app/bin/server --config /etc/app/config.toml
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
```

Salvare la definizione in `/etc/systemd/system/applicazione.service`, quindi verificarla:

```bash
systemd-analyze verify /etc/systemd/system/applicazione.service
```

Ricaricare il manager:

```bash
sudo systemctl daemon-reload
```

Abilitare e avviare il servizio:

```bash
sudo systemctl enable --now applicazione.service
```

`network-online.target` è utile solo quando il servizio richiede davvero una rete configurata; non va aggiunto indiscriminatamente a ogni unit che usa la rete.

## Varianti

- Le template unit usano un nome come `worker@.service` e istanze come `worker@1.service`; `%i` espone il nome dell'istanza.
- `Environment=` definisce valori semplici; `EnvironmentFile=` legge assegnazioni da file, ma non usa l'intera sintassi Bash.
- Un drop-in in `nome.service.d/*.conf` sovrascrive o amplia direttive senza duplicare il file originale.
- Alcune direttive lista richiedono prima un'assegnazione vuota per eliminare i valori precedenti.
- Socket e path activation avviano servizi quando arriva una connessione o cambia un percorso.
- Direttive di sandboxing come `NoNewPrivileges=`, `ProtectSystem=` e `PrivateTmp=` riducono l'esposizione del servizio.

## Errori comuni

- Scrivere `After=network.target` credendo che avvii o garantisca una rete utilizzabile.
- Inserire pipe, ridirezioni o `&&` in `ExecStart=` senza una shell esplicita.
- Usare `Type=forking` per un'applicazione che può restare in foreground.
- Copiare l'intera unit del pacchetto quando basta un drop-in.
- Dimenticare `daemon-reload` dopo aver modificato la definizione.
- Confondere `Restart=always` con la garanzia che errori di configurazione vengano risolti.
- Inserire segreti direttamente nella unit, visibile tramite file e proprietà del manager.

## Checklist

- Il tipo di unit e il `Type=` del servizio corrispondono al comportamento reale?
- Dipendenza e ordinamento sono entrambi dichiarati quando necessari?
- Il binario resta in foreground e segnala correttamente la readiness?
- Utente, directory di lavoro e percorsi sono assoluti e validi?
- La restart policy evita loop inutili?
- È stato usato un drop-in per personalizzare unit di pacchetto?
- `systemd-analyze verify` e il journal non mostrano errori?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/systemd|systemd]]
- [[Linux/Pagine/Timer systemd|Timer systemd]]
- [[Linux/Pagine/Logging con journalctl|Logging con journalctl]]
- [[Linux/Pagine/Processi PID e segnali|Processi, PID e segnali]]

## Fonti

- [systemd - systemd.unit(5)](https://www.freedesktop.org/software/systemd/man/latest/systemd.unit.html)
- [systemd - systemd.service(5)](https://www.freedesktop.org/software/systemd/man/latest/systemd.service.html)
- [systemd - systemd.exec(5)](https://www.freedesktop.org/software/systemd/man/latest/systemd.exec.html)
- [systemd - systemd-analyze(1)](https://www.freedesktop.org/software/systemd/man/latest/systemd-analyze.html)
