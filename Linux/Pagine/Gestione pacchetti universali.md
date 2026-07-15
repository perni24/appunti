---
date: 2026-07-11
area: Linux
topic: Distribuzione software
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, package-management, flatpak, snap, appimage]
aliases: [Pacchetti universali Linux, Flatpak Snap e AppImage]
prerequisites: [Package manager Linux]
related: [Installazione Linguaggi User-space, Indice Linux]
---

# Gestione pacchetti universali

## Sintesi

Flatpak, Snap e AppImage distribuiscono applicazioni Linux riducendo la dipendenza dal formato nativo della singola distribuzione. Non sono però equivalenti: differiscono per runtime, aggiornamenti, integrazione, sandbox e modello di distribuzione.

Questi formati non eliminano automaticamente ogni dipendenza dal sistema host e non garantiscono tutti lo stesso isolamento. La provenienza del pacchetto e i permessi concessi restano parte della sicurezza.

## Quando usarlo

- Applicazione desktop non disponibile o troppo vecchia nei repository della distribuzione.
- Necessità di usare la stessa build su distribuzioni diverse.
- Test di un'applicazione senza installare molte dipendenze nel sistema base.
- Distribuzione di software desktop con runtime controllato.

Per componenti di sistema, driver, servizi essenziali e librerie usate dal sistema operativo, preferisci normalmente il package manager nativo.

## Come funziona

### Flatpak

Flatpak separa applicazione e runtime condiviso. L'applicazione gira in una sandbox basata su namespace e Bubblewrap; l'accesso a file, dispositivi e servizi avviene tramite permessi e desktop portal.

### Snap

Uno snap è un'immagine SquashFS gestita da `snapd`. Il confinement può essere `strict`, `classic` o `devmode`; l'isolamento effettivo dipende anche dalle funzionalità disponibili nella distribuzione host.

### AppImage

Un'AppImage è principalmente un file eseguibile portabile che contiene l'applicazione e molte delle librerie necessarie. Viene montata temporaneamente, spesso tramite FUSE. Il formato non fornisce automaticamente una sandbox paragonabile a Flatpak o agli snap confinati.

## API / Sintassi

Elencare i repository Flatpak configurati:

```bash
flatpak remotes
```

Installare un'applicazione da Flathub:

```bash
flatpak install flathub org.example.App
```

Avviare l'applicazione:

```bash
flatpak run org.example.App
```

Aggiornare applicazioni e runtime:

```bash
flatpak update
```

Controllare i permessi dichiarati:

```bash
flatpak info --show-permissions org.example.App
```

Rimuovere runtime e dipendenze non più utilizzati:

```bash
flatpak uninstall --unused
```

Cercare uno snap:

```bash
snap find nome
```

Installare uno snap:

```bash
sudo snap install nome
```

Controllare le connessioni alle interfacce:

```bash
snap connections nome
```

Aggiornare gli snap installati:

```bash
sudo snap refresh
```

Rimuovere uno snap:

```bash
sudo snap remove nome
```

Rendere eseguibile un'AppImage scaricata da una fonte affidabile:

```bash
chmod +x Applicazione-x86_64.AppImage
```

Avviarla dalla directory corrente:

```bash
./Applicazione-x86_64.AppImage
```

## Esempio pratico

Prima di installare un'applicazione Flatpak, controlla origine e permessi:

Controlla prima metadati e provenienza nel remote:

```bash
flatpak remote-info flathub org.example.App
```

Installa l'applicazione:

```bash
flatpak install flathub org.example.App
```

Esamina i permessi concessi:

```bash
flatpak info --show-permissions org.example.App
```

Avvia l'applicazione soltanto dopo i controlli:

```bash
flatpak run org.example.App
```

Dopo l'installazione, concedi solo gli accessi realmente necessari. Un'applicazione sandboxata con accesso completo alla home conserva un impatto potenziale significativo sui dati dell'utente.

## Varianti

| Caratteristica | Flatpak | Snap | AppImage |
| --- | --- | --- | --- |
| Gestore richiesto | `flatpak` | `snapd` | nessun demone |
| Aggiornamenti | tramite remote | normalmente automatici | dipendono dall'app |
| Runtime condivisi | sì | base snap e contenuto incluso | normalmente librerie nel file |
| Sandbox | predefinita, configurabile | dipende dal confinement | non automatica |
| Uso tipico | desktop | desktop, server e IoT | applicazione portabile |

## Errori comuni

- Considerare ogni pacchetto dello store come ufficiale del produttore.
- Credere che AppImage sia automaticamente isolato dal sistema.
- Concedere accesso completo a home, dispositivi o socket senza necessità.
- Installare la stessa applicazione in più formati e confondere file di configurazione e versioni.
- Usare pacchetti universali per sostituire componenti fondamentali della distribuzione.
- Ignorare spazio occupato da vecchie revisioni e runtime inutilizzati.

## Checklist

- Il pacchetto proviene dal produttore o da un maintainer affidabile?
- Il formato è adatto a un'applicazione utente e non a un componente di sistema?
- I permessi della sandbox sono proporzionati?
- Il meccanismo di aggiornamento è conosciuto?
- Esiste una versione nativa meglio integrata con la distribuzione?
- Sono presenti installazioni duplicate della stessa applicazione?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Repository e package manager|Repository e package manager]]
- [[Linux/Pagine/apt dnf e pacman|apt, dnf e pacman]]
- [[Linux/Pagine/Installazione Linguaggi User-space|Installazione linguaggi in user-space]]

## Fonti

- [Flatpak Documentation](https://docs.flatpak.org/)
- [Snap Documentation](https://snapcraft.io/docs/)
- [AppImage Documentation](https://docs.appimage.org/)
