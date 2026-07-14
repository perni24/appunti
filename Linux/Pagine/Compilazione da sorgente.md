---
date: 2026-07-11
area: Linux
topic: Build da sorgente
type: technical-note
status: "non revisionato"
difficulty: intermedio
tags: [linux, compilazione, build, cmake, make, meson]
aliases: [Compilare software su Linux, Build from source]
prerequisites: [Repository e package manager, Dipendenze e librerie condivise]
related: [apt dnf e pacman, Installazione Linguaggi User-space]
---

# Compilazione da sorgente

## Sintesi

Compilare da sorgente trasforma codice e risorse in binari installabili tramite una toolchain e un build system. La procedura corretta dipende dal progetto: `README`, `INSTALL`, release notes e file di build sono la fonte primaria, non una sequenza universale di comandi.

Il software installato direttamente sotto `/usr/local` non viene normalmente tracciato dal package manager della distribuzione. Per sistemi mantenibili è preferibile creare un pacchetto nativo o almeno usare staging e registrare versione, opzioni e file installati.

## Quando usarlo

- Il software non è disponibile in un repository attendibile.
- Serve una versione o funzionalità non ancora pacchettizzata.
- Occorre sviluppare o modificare il progetto.
- Si deve costruire un pacchetto riproducibile.
- Si stanno valutando opzioni di compilazione specifiche.

## Come funziona

Fasi tipiche:

1. ottenere una release o un commit identificabile;
2. verificare firma o checksum tramite un canale attendibile;
3. installare compilatore, build system e dipendenze di sviluppo;
4. configurare opzioni, prefisso e tipo di build;
5. compilare fuori dall'albero sorgente quando supportato;
6. eseguire test senza privilegi;
7. installare tramite staging o creare un pacchetto;
8. conservare manifest e procedura di aggiornamento/rimozione.

Build system comuni:

| Sistema | Configurazione | Build |
| --- | --- | --- |
| Autotools | `./configure` | `make` |
| CMake | `cmake -S . -B build` | `cmake --build build` |
| Meson | `meson setup build` | `meson compile -C build` |

`--prefix` definisce i percorsi finali registrati nella build. `DESTDIR` aggiunge invece una radice temporanea durante l'installazione, utile per staging e creazione di pacchetti; non sostituisce il prefisso.

## API / Sintassi

Identificare file e istruzioni del progetto:

```bash
ls
```

Configurare un progetto CMake fuori dall'albero sorgente:

```bash
cmake -S . -B build -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr/local
```

Compilare in parallelo tramite l'interfaccia CMake:

```bash
cmake --build build --parallel
```

Eseguire i test registrati da CMake:

```bash
ctest --test-dir build --output-on-failure
```

Installare in una directory di staging:

```bash
DESTDIR="$PWD/stage" cmake --install build
```

Configurare un progetto Meson:

```bash
meson setup build --buildtype=release --prefix=/usr/local
```

Compilare con Meson:

```bash
meson compile -C build
```

Testare con Meson:

```bash
meson test -C build
```

## Esempio pratico

Verificare il checksum pubblicato di un archivio già scaricato:

```bash
sha256sum progetto-1.2.3.tar.xz
```

Estrarre l'archivio in una directory dedicata:

```bash
tar -xf progetto-1.2.3.tar.xz
```

Configurare la release con CMake:

```bash
cmake -S progetto-1.2.3 -B build-progetto -DCMAKE_BUILD_TYPE=Release -DCMAKE_INSTALL_PREFIX=/usr/local
```

Compilare:

```bash
cmake --build build-progetto --parallel
```

Eseguire i test:

```bash
ctest --test-dir build-progetto --output-on-failure
```

Creare uno staging ispezionabile:

```bash
DESTDIR="$PWD/stage-progetto" cmake --install build-progetto
```

Ispezionare lo staging prima di creare un pacchetto o installare evita di concedere privilegi amministrativi a script di build non verificati.

## Varianti

- Autotools usa spesso `./configure --prefix=/usr/local`, `make`, `make check` e `make install`.
- `ninja` può essere il backend scelto da CMake o Meson.
- Build containerizzate isolano dipendenze, ma richiedono comunque versioni e immagini fissate.
- `checkinstall` non sostituisce una ricetta di packaging mantenuta per la distribuzione.
- Le distribuzioni forniscono strumenti propri come `debuild`, `rpmbuild` e `makepkg`.
- Un prefisso nella home permette test non privilegiati, ma va integrato consapevolmente nel `PATH` e nei percorsi delle librerie.

## Errori comuni

- Eseguire uno script remoto o una build come `root` senza ispezione.
- Installare in `/usr` sovrascrivendo file gestiti dalla distribuzione.
- Saltare test, verifica della release o lettura delle opzioni di build.
- Confondere dipendenze runtime con pacchetti di sviluppo.
- Usare `sudo make install` senza manifest o procedura di rimozione.
- Ricompilare nella directory sorgente e rendere difficile una build pulita.
- Considerare una build riuscita automaticamente compatibile con ABI e policy del sistema.

## Checklist

- Versione o commit sono fissati e verificati?
- Dipendenze e toolchain sono documentati e riproducibili?
- La build avviene senza privilegi e fuori dall'albero sorgente?
- Prefisso finale e `DESTDIR` hanno ruoli corretti?
- Test e controlli del progetto sono passati?
- I file nello staging sono stati ispezionati?
- Aggiornamento, rollback e rimozione sono gestiti dal package manager o documentati?

## Collegamenti

- [[Linux/Indice Linux|Indice Linux]]
- [[Linux/Pagine/Repository e package manager|Repository e package manager]]
- [[Linux/Pagine/apt dnf e pacman|apt, dnf e pacman]]
- [[Linux/Pagine/Dipendenze e librerie condivise|Dipendenze e librerie condivise]]
- [[Linux/Pagine/Installazione Linguaggi User-space|Installazione linguaggi in user-space]]

## Fonti

- [CMake - User Interaction Guide](https://cmake.org/cmake/help/latest/guide/user-interaction/)
- [Meson - Running Meson](https://mesonbuild.com/Running-Meson.html)
- [GNU Make Manual](https://www.gnu.org/software/make/manual/make.html)
- [GNU Coding Standards - Installation Directories](https://www.gnu.org/prep/standards/html_node/Directory-Variables.html)
