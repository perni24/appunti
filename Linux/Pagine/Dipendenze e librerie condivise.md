---
date: 2026-07-11
area: Linux
topic: Linking e dipendenze
type: technical-note
status: "non revisionato"
publish: true
difficulty: intermedio
tags: [linux, dipendenze, librerie, linker, elf, pkg-config]
aliases: [Librerie condivise Linux, Dynamic linking]
prerequisites: [Repository e package manager, Filesystem Hierarchy Standard]
related: [Compilazione da sorgente, apt dnf e pacman]
---

# Dipendenze e librerie condivise

## Sintesi

Una dipendenza può indicare un pacchetto richiesto dal package manager, un header necessario alla compilazione o una libreria caricata a runtime. Questi livelli sono collegati ma non equivalenti: un pacchetto di sviluppo può servire per compilare, mentre il programma installato richiede soltanto la libreria runtime compatibile.

Nei binari ELF dinamici, il dynamic linker carica le librerie condivise richieste e risolve i simboli. Il nome ABI, spesso espresso dal `SONAME`, permette di distinguere versioni compatibili e incompatibili.

## Quando usarlo

- Diagnosticare l'errore `cannot open shared object file`.
- Capire perché una build non trova header o librerie.
- Verificare quali `.so` richiede un eseguibile.
- Integrare dipendenze native con `pkg-config`.
- Distinguere linking statico e dinamico.

## Come funziona

| Elemento | Ruolo |
| --- | --- |
| header `.h` | dichiarazioni usate durante la compilazione |
| libreria statica `.a` | codice copiato nel binario dal linker |
| libreria condivisa `.so` | codice caricato e condiviso a runtime |
| `SONAME` | identità ABI registrata nella libreria |
| dynamic linker | carica oggetti e risolve simboli all'avvio o su richiesta |
| cache `ld.so` | indice delle librerie disponibili nei percorsi configurati |

Una famiglia può avere file come `libesempio.so.2.4`, un collegamento `libesempio.so.2` corrispondente al `SONAME` e un collegamento non versionato `libesempio.so` usato in fase di sviluppo. Le distribuzioni separano spesso il collegamento e gli header in un pacchetto `-dev` o `-devel`.

Il loader considera informazioni incorporate nel binario, variabili d'ambiente ammesse, cache e directory predefinite secondo regole definite da `ld.so`. `RUNPATH` e `RPATH` non sono sinonimi perfetti e hanno precedenze e propagazione differenti.

## API / Sintassi

Mostrare il tipo di un eseguibile:

```bash
file /usr/bin/grep
```

Elencare le dipendenze dinamiche di un binario fidato:

```bash
ldd /usr/bin/grep
```

Leggere le voci `NEEDED`, `SONAME`, `RPATH` e `RUNPATH` senza avviare il programma:

```bash
readelf -d /usr/bin/grep
```

Mostrare interprete ELF e program header:

```bash
readelf -l /usr/bin/grep
```

Consultare la cache del dynamic linker:

```bash
ldconfig -p
```

Aggiornare collegamenti e cache dopo una modifica amministrativa ai percorsi configurati:

```bash
sudo ldconfig
```

Mostrare flag di compilazione forniti da una dipendenza:

```bash
pkg-config --cflags libcurl
```

Mostrare flag di linking:

```bash
pkg-config --libs libcurl
```

## Esempio pratico

Verificare una dipendenza non risolta:

```bash
ldd ./applicazione
```

Individuare il nome richiesto dal binario:

```bash
readelf -d ./applicazione
```

Cercare il nome nella cache:

```bash
ldconfig -p
```

Chiedere al package manager quale pacchetto fornisce il file, usando gli strumenti specifici della distribuzione, è preferibile alla copia manuale di una `.so` trovata online.

## Varianti

- Linking statico semplifica alcune distribuzioni ma aumenta dimensione, duplicazione e responsabilità sugli aggiornamenti di sicurezza.
- `dlopen` carica plugin o librerie a runtime che potrebbero non apparire tra le voci `NEEDED` iniziali.
- `LD_LIBRARY_PATH` modifica temporaneamente la ricerca ed è utile per test, ma è fragile come configurazione globale.
- `LD_DEBUG=libs` mostra la ricerca del loader su eseguibili fidati.
- `pkg-config` legge file `.pc`; `PKG_CONFIG_PATH` aggiunge directory non standard per la sessione.
- Container e bundle possono includere librerie proprie, restando comunque dipendenti da ABI del kernel e da parti dell'host.

## Errori comuni

- Usare `ldd` su un eseguibile non fidato: alcune condizioni o implementazioni possono comportare l'esecuzione di codice.
- Creare manualmente un symlink verso una versione ABI incompatibile per eliminare un errore.
- Aggiungere directory globali a `LD_LIBRARY_PATH`, alterando programmi non correlati.
- Confondere nome del pacchetto, nome della libreria e nome usato da `pkg-config`.
- Installare soltanto la libreria runtime quando la build richiede header e metadati di sviluppo.
- Eseguire `ldconfig` aspettandosi che installi librerie mancanti.
- Copiare `.so` direttamente in `/usr/lib`, fuori dal controllo del package manager.

## Checklist

- Il problema avviene in compilazione, linking o caricamento runtime?
- Quale `SONAME` richiede realmente il binario?
- Architettura e ABI della libreria sono compatibili?
- La libreria proviene da un pacchetto della distribuzione?
- Serve il pacchetto runtime oppure quello `-dev`/`-devel`?
- `RPATH`, `RUNPATH`, cache e percorsi configurati sono stati ispezionati?
- Il binario è fidato prima di usare strumenti che possono eseguirlo?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Repository e package manager|Repository e package manager]]
- [[Linux/Pagine/apt dnf e pacman|apt, dnf e pacman]]
- [[Linux/Pagine/Compilazione da sorgente|Compilazione da sorgente]]
- [[Linux/Pagine/Installazione Linguaggi User-space|Installazione linguaggi in user-space]]

## Fonti

- [Linux man-pages - ld.so(8)](https://man7.org/linux/man-pages/man8/ld.so.8.html)
- [Linux man-pages - ldconfig(8)](https://man7.org/linux/man-pages/man8/ldconfig.8.html)
- [Linux man-pages - ldd(1)](https://man7.org/linux/man-pages/man1/ldd.1.html)
- [Guide to pkg-config](https://people.freedesktop.org/~dbn/pkg-config-guide.html)
