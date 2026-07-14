---
date: 2026-07-11
area: Linux
topic: IPC D-Bus
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [linux, dbus, ipc, desktop, servizi]
aliases: [D-Bus IPC, Message bus Linux]
prerequisites: [Processi PID e segnali, Porte e socket]
related: [udev, Portali desktop e applicazioni predefinite, systemd]
---

# D-Bus

## Sintesi

D-Bus è un protocollo IPC orientato a messaggi e un modello di message bus. Il system bus collega servizi di sistema e client autorizzati; il session o user bus collega applicazioni della sessione. I messaggi comprendono method call, return, error e signal.

D-Bus non è un bus di rete generico. Usa normalmente socket Unix locali, nomi, object path, interface e policy di accesso per indirizzare le richieste.

## Quando usarlo

- Ispezionare servizi esposti sul bus.
- Diagnosticare chiamate desktop o di sistema.
- Monitorare signal e cambi di proprietà.
- Comprendere attivazione on-demand di servizi.
- Sviluppare integrazioni tramite binding di alto livello.

## Come funziona

Una destinazione D-Bus è descritta da:

| Elemento | Esempio |
| --- | --- |
| bus name | `org.freedesktop.NetworkManager` |
| object path | `/org/freedesktop/NetworkManager` |
| interface | `org.freedesktop.NetworkManager` |
| member | metodo o signal specifico |

Ogni connessione riceve un unique name che inizia con `:`; un servizio può possedere un well-known name. Introspection descrive oggetti, interface, metodi, signal e property quando il servizio la supporta.

Policy D-Bus controlla accesso al bus e ai messaggi. Operazioni privilegiate possono richiedere inoltre autorizzazione Polkit; poter inviare una chiamata non implica che venga autorizzata.

## API / Sintassi

Elencare servizi sul system bus:

```bash
busctl list
```

Elencare servizi sul bus utente:

```bash
busctl --user list
```

Mostrare l'albero oggetti di un servizio:

```bash
busctl tree org.freedesktop.NetworkManager
```

Eseguire introspection su un oggetto:

```bash
busctl introspect org.freedesktop.NetworkManager /org/freedesktop/NetworkManager
```

Monitorare messaggi di una destinazione:

```bash
busctl monitor org.freedesktop.NetworkManager
```

Introspezionare tramite GDBus sul bus utente:

```bash
gdbus introspect --session --dest org.freedesktop.portal.Desktop --object-path /org/freedesktop/portal/desktop
```

Mostrare stato del socket bus utente:

```bash
systemctl --user status dbus.socket
```

## Esempio pratico

Verificare se NetworkManager possiede il nome atteso:

```bash
busctl status org.freedesktop.NetworkManager
```

Esplorare gli oggetti:

```bash
busctl tree org.freedesktop.NetworkManager
```

Introspezionare il path prima di tentare una chiamata:

```bash
busctl introspect org.freedesktop.NetworkManager /org/freedesktop/NetworkManager
```

Per script e applicazioni è preferibile una API o binding tipizzato rispetto al parsing dell'output umano di `busctl`.

## Varianti

- `dbus-daemon` e `dbus-broker` sono implementazioni del message bus con la stessa interoperabilità prevista.
- GDBus e QtDBus offrono binding integrati nei rispettivi framework.
- systemd può attivare servizi D-Bus quando viene richiesto un nome.
- Portali desktop espongono API D-Bus mediate per sandbox.
- Peer-to-peer D-Bus evita il bus daemon in casi specifici.
- ObjectManager standardizza enumerazione di alberi dinamici di oggetti.

## Errori comuni

- Confondere system bus e user bus.
- Usare un bus name corretto con object path o interface sbagliati.
- Considerare introspection una autorizzazione a chiamare ogni metodo.
- Monitorare il bus e registrare accidentalmente dati sensibili.
- Usare la API low-level quando il framework offre binding mantenuti.
- Modificare policy D-Bus per aggirare una negazione Polkit.
- Trattare signal D-Bus come eventi garantiti e persistenti.

## Checklist

- Il servizio è sul system bus o sul bus utente?
- Bus name, path, interface e member sono corretti?
- Introspection è disponibile e coerente con la versione?
- Policy D-Bus e autorizzazione Polkit sono entrambe soddisfatte?
- L'applicazione gestisce errori, timeout e scomparsa del nome?
- Il monitoraggio evita dati sensibili?
- È disponibile un binding di alto livello appropriato?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/udev|udev]]
- [[Linux/Pagine/Portali desktop e applicazioni predefinite|Portali desktop e applicazioni predefinite]]
- [[Linux/Pagine/systemd|systemd]]
- [[Linux/Pagine/Porte e socket|Porte e socket]]

## Fonti

- [D-Bus Specification](https://dbus.freedesktop.org/doc/dbus-specification.html)
- [D-Bus Tutorial](https://dbus.freedesktop.org/doc/dbus-tutorial.html)
- [busctl(1)](https://www.freedesktop.org/software/systemd/man/latest/busctl.html)
- [GDBus](https://docs.gtk.org/gio/class.DBusConnection.html)
