---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note
publish: true
difficulty: intermedio
tags:
  - marlin
  - scheda-madre
  - seriale
  - pin-mapping
aliases:
  - Motherboard e pin Marlin
  - Porte seriali Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita]]"
  - "[[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware]]"
marlin-version: 2.1.2.8
title: Scheda madre, porte seriali e pin
status: non revisionato
---

# Scheda madre, porte seriali e pin

## Sintesi

La scelta della scheda madre stabilisce quale piattaforma hardware deve essere compilata e quale mappa dei pin Marlin deve usare. Le porte seriali definiscono invece i canali attraverso cui host, display intelligenti o moduli esterni comunicano con il firmware.

Queste impostazioni devono descrivere l'elettronica reale. Una build riuscita con la scheda sbagliata puo assegnare riscaldatori, ventole e motori a pin non corretti.

## Quando usarlo

Queste direttive vanno controllate:

- durante la prima configurazione;
- dopo la sostituzione della scheda;
- quando esistono piu revisioni della stessa scheda;
- quando USB o host seriale non comunicano;
- quando si collega un display seriale o un modulo esterno;
- quando una periferica e fisicamente collegata ma non riceve segnali;
- prima di qualsiasi override manuale dei pin.

## Selezione della scheda madre

Nel `Configuration.h` predefinito:

```cpp
#ifndef MOTHERBOARD
  #define MOTHERBOARD BOARD_RAMPS_14_EFB
#endif
```

`BOARD_RAMPS_14_EFB` e soltanto il valore predefinito della configurazione generica. Non indica una scelta adatta a tutte le stampanti.

Il blocco `#ifndef` definisce il valore solo se `MOTHERBOARD` non e gia stato impostato da un altro meccanismo di build.

### Come trovare il valore corretto

Il riferimento autorevole per la release `2.1.2.8` e:

```text
Marlin/src/core/boards.h
```

Il file associa un nome simbolico a ogni scheda supportata:

```cpp
#define BOARD_RAMPS_14_EFB 1020
```

In `Configuration.h` si usa il nome simbolico, non il numero:

```cpp
#define MOTHERBOARD BOARD_RAMPS_14_EFB
```

Il numero e un identificatore interno e puo cambiare tra famiglie o release. Scrivere direttamente `1020` rende la configurazione meno leggibile e piu fragile.

### Verifiche prima della scelta

- produttore e nome esatto della scheda;
- revisione stampata sul PCB;
- microcontrollore realmente montato;
- disposizione delle uscite di potenza;
- tipo di bootloader;
- tensione logica;
- presenza di driver saldati o rimovibili;
- schema elettrico o pinout del produttore.

Una differenza apparentemente piccola, come la revisione del PCB o il suffisso EFB/EEB, puo cambiare la funzione delle uscite.

## Dal nome della scheda ai pin

La risoluzione avviene in piu passaggi:

1. `MOTHERBOARD` seleziona un identificatore definito in `boards.h`.
2. `Marlin/src/pins/pins.h` include il file appropriato per quella scheda.
3. Il file `pins_BOARDNAME.h` assegna i pin alle funzioni Marlin.
4. `pins_postprocess.h` completa o riassegna alcuni pin in base alla configurazione.
5. i controlli di compilazione cercano conflitti e requisiti mancanti.

La catena e concettualmente:

```text
Configuration.h
  -> boards.h
  -> pins.h
  -> pins_BOARDNAME.h
  -> pins_postprocess.h
```

Alcune schede condividono un file dei pin comune e aggiungono soltanto differenze specifiche.

## Cosa contiene un file dei pin

Un file dei pin puo definire:

- pin `STEP`, `DIR` ed `ENABLE` dei driver;
- ingressi dei finecorsa;
- uscite per hotend, piatto e ventole;
- ingressi analogici dei sensori di temperatura;
- bus e chip select dei driver;
- connettori per display e schede SD;
- `PS_ON_PIN`;
- buzzer, LED, servo e sonde;
- nome della scheda e vincoli del microcontrollore.

Le assegnazioni sono macro C/C++:

```cpp
#define X_STEP_PIN 54
```

Il numero e significativo soltanto nel sistema di mapping della piattaforma selezionata.

## Pin digitali e analogici

Marlin usa il proprio livello FastIO per leggere e scrivere rapidamente i pin sulle varie piattaforme.

Per i pin digitali, i file ufficiali seguono normalmente il mapping Arduino previsto dalla piattaforma. Gli ingressi analogici sono invece indicati come indici analogici. Non bisogna convertire un numero analogico nel corrispondente numero digitale senza che la direttiva lo richieda.

Il valore:

```cpp
-1
```

indica generalmente un pin assente, disabilitato o da assegnare automaticamente, ma il significato preciso dipende dal contesto. Non rappresenta un pin fisico.

## Override dei pin

Alcune direttive pubbliche permettono override mirati. Per esempio:

```cpp
//#define Z_MIN_PROBE_PIN -1
```

Il commento ufficiale consiglia di modificare questo valore soltanto quando la sonda non puo usare il pin predefinito della scheda.

Prima di un override bisogna verificare:

- che il pin sia esposto fisicamente;
- che non sia gia usato da un'altra funzione;
- che supporti ingresso, uscita, PWM, interrupt o ADC richiesti;
- che la tensione sia compatibile;
- che non sia riservato a USB, bootloader, memoria o debug;
- che la scheda abbia pull-up o circuiti esterni appropriati.

Un override non modifica l'elettronica del connettore. Assegnare un numero diverso non aggiunge protezioni, level shifting o capacita di corrente.

## Porte seriali

### `SERIAL_PORT`

```cpp
#define SERIAL_PORT 0
```

Seleziona la porta primaria usata per comunicare con l'host. Nella configurazione `2.1.2.8`, i valori documentati sono:

```text
-1, 0, 1, 2, 3, 4, 5, 6, 7
```

Il valore `-1` indica la seriale USB emulata quando disponibile. La disponibilita concreta delle porte dipende dal microcontrollore e dalla scheda.

Il commento della release specifica che la prima porta seriale, `-1` oppure `0`, viene comunque usata dal bootloader Arduino.

### `BAUDRATE`

```cpp
#define BAUDRATE 250000
```

Imposta la velocita predefinita delle porte seriali. Marlin 2.1.2.8 elenca:

```text
2400
9600
19200
38400
57600
115200
250000
500000
1000000
```

Host e firmware devono usare la stessa velocita. Un baud rate elevato puo migliorare il trasferimento, ma collegamenti, adattatori o piattaforme meno affidabili possono produrre disconnessioni, errori di checksum o dati persi.

### Porte aggiuntive

```cpp
//#define SERIAL_PORT_2 -1
```

```cpp
//#define BAUDRATE_2 250000
```

```cpp
//#define SERIAL_PORT_3 1
```

```cpp
//#define BAUDRATE_3 250000
```

`BAUDRATE_2` e `BAUDRATE_3` sovrascrivono `BAUDRATE` soltanto per la rispettiva porta.

Nella release di riferimento:

- `SERIAL_PORT_2` ammette anche `-2` per Ethernet, ma il commento lo limita a Teensy 4.1;
- la terza porta e indicata come supportata per AVR, DUE, LPC1768/9 e STM32/STM32F1;
- non si deve assegnare la stessa interfaccia a ruoli incompatibili.

## Baud rate modificabile con G-code

L'opzione:

```cpp
//#define BAUD_RATE_GCODE
```

abilita `M575`.

Esempio per impostare la porta `0` a `115200`:

```gcode
M575 P0 B115200
```

Il comando interrompe la comunicazione alla vecchia velocita. Il software host deve riconnettersi usando il nuovo valore e, su alcune piattaforme, la riconnessione puo riavviare il firmware.

## Nome e identificazione

Queste direttive non cambiano i pin, ma aiutano a identificare la build:

```cpp
//#define CUSTOM_MACHINE_NAME "3D Printer"
```

```cpp
//#define MACHINE_UUID "00000000-0000-0000-0000-000000000000"
```

`CUSTOM_MACHINE_NAME` viene mostrato nell'interfaccia e nelle informazioni della macchina. `MACHINE_UUID` puo aiutare un host a distinguere dispositivi diversi. Non usare lo stesso UUID per piu macchine quando serve un'identificazione univoca.

## Esempio di analisi

```cpp
#define MOTHERBOARD BOARD_RAMPS_14_EFB
#define SERIAL_PORT 0
#define BAUDRATE 250000
//#define SERIAL_PORT_2 -1
```

Questa configurazione dichiara:

- una scheda RAMPS 1.4 con uscite EFB;
- una porta seriale primaria identificata come `0`;
- comunicazione predefinita a `250000`;
- nessuna seconda porta seriale.

Non dichiara automaticamente:

- il microcontrollore effettivamente montato;
- il metodo di upload;
- la correttezza dei collegamenti;
- la compatibilita elettrica delle periferiche.

## Errori comuni

- **Scegliere la scheda dal nome della stampante:** produttori diversi possono usare elettroniche differenti nello stesso modello.
- **Ignorare la revisione del PCB:** il pinout puo essere cambiato.
- **Usare il valore predefinito RAMPS senza verificarlo:** il firmware puo controllare uscite sbagliate.
- **Confondere porta seriale con porta fisica USB:** il mapping dipende dalla piattaforma.
- **Impostare un baud rate diverso nell'host:** la connessione fallisce o produce dati corrotti.
- **Usare una porta gia occupata da display o modulo:** due periferiche interferiscono.
- **Forzare pin liberi soltanto perche non compaiono nella configurazione:** possono essere riservati nel file della scheda.
- **Applicare livelli a 5 V a ingressi da 3,3 V:** l'errore e elettrico e non viene corretto dal firmware.
- **Usare `M42` o il debug dei pin su uscite di potenza senza analisi:** si possono attivare carichi in modo inatteso.

## Checklist

- Nome, revisione e microcontrollore della scheda sono verificati.
- `MOTHERBOARD` esiste in `boards.h` della release `2.1.2.8`.
- E stato individuato il file dei pin effettivamente incluso.
- L'ambiente PlatformIO corrisponde alla piattaforma.
- Uscite heater, bed e fan sono mappate come previsto.
- Le porte seriali esistono fisicamente sulla piattaforma.
- Host e firmware usano lo stesso baud rate.
- Ogni override dei pin e accompagnato da verifica elettrica e controllo dei conflitti.
- Dopo il caricamento, `M115` identifica la build prevista.
- Nessun heater viene alimentato prima di verificare sensori e pin.

## Fonti

- [Configuration.h 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [boards.h 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/src/core/boards.h)
- [pins.h 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/src/pins/pins.h)
- [Documentazione ufficiale sulle schede](https://marlinfw.org/docs/hardware/boards.html)
- [M575 - Serial baud rate](https://marlinfw.org/docs/gcode/M575.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita|Introduzione a Marlin 2.1.2.8 e compatibilita]]
- [[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin|Struttura dei file di configurazione Marlin]]
- [[Stampante 3D/Marlin/Pagine/Metodo di configurazione compilazione e caricamento|Metodo di configurazione compilazione e caricamento]]
- [[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware|Alimentazione e protezioni hardware]]
