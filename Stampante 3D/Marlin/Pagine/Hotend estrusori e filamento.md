---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note

publish: true
difficulty: avanzato
tags: [marlin, hotend, estrusore, filamento, multi-materiale]
aliases: [Configurazione estrusori Marlin, Hotend e filamento Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin]]"
  - "[[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Limiti di estrusione retrazione e cambio utensile]]"
marlin-version: "2.1.2.8"
---

# Hotend, estrusori e filamento

## Sintesi

In Marlin un **estrusore logico** non coincide sempre con un motore, un hotend o un ugello. La relazione dipende dall'architettura:

| Configurazione | Canali di filamento | Motori E | Hotend / ugelli | Caratteristica |
|---|---:|---:|---:|---|
| Singolo estrusore | 1 | 1 | 1 | configurazione standard |
| Hotend indipendenti | 2 o piu | 2 o piu | 2 o piu | offset e temperature separate |
| Single nozzle | 2 o piu | 2 o piu | 1 | piu filamenti condividono l'ugello |
| Switching extruder | 2 o piu | 1 per coppia | dipende dal sistema | un servo seleziona il percorso |
| Switching nozzle | 2 | 2 | 2 mobili | un servo alza o abbassa gli ugelli |
| Mixing extruder | 2 o piu | 2 o piu | 1 | i motori contribuiscono alla stessa miscela |
| MMU | piu ingressi | sistema dedicato | 1 | il selettore carica un filamento per volta |
| Tool changer | piu utensili | uno o piu per utensile | piu testine | la macchina parcheggia e aggancia la testina |

Prima di modificare le direttive bisogna descrivere l'hardware reale: quanti filamenti entrano, quanti motori li spingono, quanti heater e sensori esistono, quanti ugelli depositano materiale e quale meccanismo seleziona l'utensile.

## Terminologia

- **Estrusore:** meccanismo che spinge il filamento, normalmente composto da motore, riduzione e ruota dentata.
- **Hotend:** insieme termico che fonde il materiale.
- **Ugello:** parte terminale che determina il diametro nominale del flusso in uscita.
- **Tool:** utensile logico selezionato con `T0`, `T1` e comandi successivi.
- **Canale di filamento:** percorso fisico di uno specifico materiale.
- **Asse E:** coordinata di estrusione usata dai movimenti G-code.

La distinzione e importante: un mixing hotend puo avere piu motori E ma un solo heater; un sistema single-nozzle puo esporre piu tool logici pur usando un solo ugello; un tool changer puo avere hotend fisicamente separati e richiedere movimenti di docking.

## Numero di estrusori

In `Configuration.h`:

```cpp
#define EXTRUDERS 1
```

Nella release 2.1.2.8 il valore ammesso e compreso tra 0 e 8. Il numero deve rappresentare gli estrusori logici gestiti dalla configurazione, non essere aumentato per ottenere genericamente "piu funzioni".

Cambiare `EXTRUDERS` influenza:

- driver e pin E richiesti;
- sensori e heater disponibili;
- array di steps/mm, velocita e accelerazioni;
- comandi tool `T0`...`T7`;
- offset degli hotend;
- menu e funzionalita multi-estrusore;
- controlli di coerenza eseguiti durante la compilazione.

Per ogni motore fisico bisogna anche configurare il relativo driver, per esempio:

```cpp
#define E0_DRIVER_TYPE TMC2209
```

Un secondo motore indipendente richiede normalmente `E1_DRIVER_TYPE`, pin compatibili sulla scheda e valori dinamici adatti. La sola modifica di `EXTRUDERS` non crea le uscite elettriche mancanti.

## Fattori E distinti

Con piu estrusori, motori e riduzioni possono essere differenti:

```cpp
//#define DISTINCT_E_FACTORS
```

Abilitando `DISTINCT_E_FACTORS`, ciascun estrusore puo avere valori propri per impostazioni di movimento come:

- steps/mm E;
- velocita massima E;
- accelerazione massima E;
- fattori Linear Advance, quando l'opzione correlata usa valori distinti.

Esempio concettuale:

```cpp
#define DEFAULT_AXIS_STEPS_PER_UNIT { 80, 80, 400, 415, 690 }
```

Gli ultimi valori rappresentano E0 ed E1 soltanto se la configurazione e costruita per fattori distinti. I numeri non vanno copiati: devono derivare dalla trasmissione e dalla calibrazione di ciascun estrusore.

## Architetture supportate

### Hotend indipendenti

Con piu hotend, ogni tool puo avere:

- motore E;
- heater;
- sensore di temperatura;
- ventola;
- posizione fisica rispetto a T0.

Gli offset sono definiti rispetto al primo hotend:

```cpp
//#define HOTEND_OFFSET_X { 0.0, 20.0 }
//#define HOTEND_OFFSET_Y { 0.0, 5.0 }
//#define HOTEND_OFFSET_Z { 0.0, 0.0 }
```

L'offset di T0 deve essere `0, 0, 0`. Per gli altri tool i valori descrivono la distanza reale da T0. Il segno deve essere ricavato dal sistema di coordinate della macchina, non dalla prospettiva dell'operatore.

Leggere gli offset attivi:

```gcode
M218
```

Impostare un offset di esempio per T1:

```gcode
M218 T1 X20 Y5 Z0
```

Un offset errato produce parti sdoppiate o collisioni. La misura va verificata con un pattern multi-materiale e non soltanto con calibro.

### Single nozzle

Per piu estrusori che condividono lo stesso ugello:

```cpp
//#define SINGLENOZZLE
```

Marlin cambia il filamento attivo senza applicare l'offset tra ugelli separati. Le opzioni:

```cpp
//#define SINGLENOZZLE_STANDBY_TEMP
//#define SINGLENOZZLE_STANDBY_FAN
```

permettono di conservare e ripristinare temperatura e velocita ventola associate ai tool logici durante il cambio. Sono utili se i materiali richiedono stati diversi, ma non eliminano la necessita di una sequenza fisica corretta di scarico, caricamento e spurgo.

### Switching extruder

```cpp
//#define SWITCHING_EXTRUDER
```

Questa configurazione usa un servo per selezionare uno dei due percorsi azionati da un singolo motore stepper:

```cpp
#define SWITCHING_EXTRUDER_SERVO_NR 0
#define SWITCHING_EXTRUDER_SERVO_ANGLES { 0, 90 }
```

Con quattro o piu estrusori logici (`EXTRUDERS > 3`) e previsto un secondo servo per la coppia E2/E3. Gli angoli devono essere misurati sul meccanismo. Un valore eccessivo puo portare il servo a fine corsa e mantenerlo sotto sforzo.

### Switching nozzle

```cpp
//#define SWITCHING_NOZZLE
```

Uno o due servo sollevano e abbassano gli ugelli:

```cpp
#define SWITCHING_NOZZLE_SERVO_NR 0
#define SWITCHING_NOZZLE_SERVO_ANGLES { 0, 90 }
#define SWITCHING_NOZZLE_SERVO_DWELL 2500
```

`SWITCHING_NOZZLE_SERVO_DWELL` e il tempo concesso al movimento meccanico. Ridurlo senza misure puo far ripartire la stampa prima che l'ugello sia in posizione.

### Parking extruder e tool changer

Marlin distingue diversi meccanismi:

```cpp
//#define PARKING_EXTRUDER
//#define MAGNETIC_PARKING_EXTRUDER
//#define SWITCHING_TOOLHEAD
//#define MAGNETIC_SWITCHING_TOOLHEAD
//#define ELECTROMAGNETIC_SWITCHING_TOOLHEAD
```

Queste opzioni richiedono coordinate di parcheggio, distanze di sicurezza, velocita di aggancio e, secondo il sistema, servo, solenoidi o elettromagneti. Non sono varianti intercambiabili.

Le coordinate di esempio presenti nei file Marlin non descrivono una stampante reale. Prima del primo cambio automatico:

1. verificare il verso degli assi;
2. fare homing;
3. raggiungere manualmente le coordinate a bassa velocita;
4. controllare le distanze di sicurezza;
5. provare aggancio e rilascio senza hotend caldo;
6. testare il rilevamento utensile, se presente;
7. eseguire il primo `T` con arresto di emergenza accessibile.

### Mixing extruder

```cpp
//#define MIXING_EXTRUDER
```

Configurazione base:

```cpp
#define MIXING_STEPPERS 2
#define MIXING_VIRTUAL_TOOLS 16
```

I motori alimentano un unico hotend in proporzioni configurabili. `M163` imposta il peso di un canale, `M164` salva la miscela come tool virtuale e `M165` puo impostare direttamente i fattori quando la funzione corrispondente e disponibile.

Esempio di miscela al 50% tra due canali:

```gcode
M163 S0 P0.5
```

```gcode
M163 S1 P0.5
```

```gcode
M164 S0
```

Il rapporto comandato non garantisce automaticamente un colore uniforme. Lunghezza della camera, viscosita, pigmenti e portata producono ritardo e transitori.

### Unita multi-materiale

```cpp
//#define MMU_MODEL PRUSA_MMU2
```

La release elenca modelli Prusa MMU e varianti emulabili. Alcuni modelli impongono un numero preciso di estrusori logici; per esempio il commento di `PRUSA_MMU2S` richiede `EXTRUDERS = 5`. E inoltre richiesto `NOZZLE_PARK_FEATURE` per parcheggiare la testina in caso di errore dell'unita.

Una MMU non equivale a un hotend multi-ugello: seleziona e carica un filamento alla volta nello stesso percorso di fusione.

## Diametro del filamento

```cpp
#define DEFAULT_NOMINAL_FILAMENT_DIA 1.75
```

Questo valore rappresenta il diametro nominale atteso ed e usato da funzioni come estrusione volumetrica e sensore di larghezza. Non cambia da solo:

- steps/mm dell'estrusore;
- diametro dell'ugello;
- flow dello slicer;
- capacita massima dell'hotend.

Un filamento venduto come 1,75 mm non ha diametro perfettamente costante. Per l'uso normale il valore nominale deve coincidere con il profilo dello slicer. La misura reale e utile per diagnosi e per funzioni volumetriche, ma non va trasformata in una correzione casuale per ogni tratto di bobina.

## Estrusione lineare e volumetrica

Nel G-code piu comune, E rappresenta millimetri lineari di filamento. In modalita volumetrica, E rappresenta invece millimetri cubi; Marlin calcola la lunghezza usando il diametro configurato.

Leggere lo stato:

```gcode
M200
```

Abilitare la modalita volumetrica per filamento da 1,75 mm:

```gcode
M200 S1 D1.75
```

Disabilitarla:

```gcode
M200 S0
```

In alternativa, `M200 D0` la disabilita. Firmware e slicer devono usare la stessa convenzione. Se lo slicer emette E lineare ma Marlin interpreta E come volume, la quantita estrusa diventa errata.

Per rimuovere completamente il supporto in una build con poco spazio:

```cpp
//#define NO_VOLUMETRICS
```

Se `NO_VOLUMETRICS` non e definita, si puo scegliere il default:

```cpp
//#define VOLUMETRIC_DEFAULT_ON
```

Lasciarla disabilitata e normalmente piu prudente quando i profili esistenti usano E lineare.

## Limite volumetrico

```cpp
//#define VOLUMETRIC_EXTRUDER_LIMIT
```

Il limite e espresso in `mm^3/s`:

```cpp
#define DEFAULT_VOLUMETRIC_EXTRUDER_LIMIT 0.00
```

Zero significa nessun limite volumetrico. Un valore non nullo limita la portata richiesta, riducendo la velocita quando necessario.

Impostare, per esempio, 12 mm³/s sul tool attivo:

```gcode
M200 L12
```

Il valore va misurato con materiale, temperatura e ugello reali. Non e la portata teorica dichiarata per l'hotend e non sostituisce i limiti nello slicer.

## Sensore di diametro del filamento

```cpp
//#define FILAMENT_WIDTH_SENSOR
```

Parametri principali:

```cpp
#define FILAMENT_SENSOR_EXTRUDER_NUM 0
#define MEASUREMENT_DELAY_CM 14
#define FILWIDTH_ERROR_MARGIN 1.0
#define MAX_MEASUREMENT_DELAY 20
```

Il sensore misura il filamento prima della camera di fusione. Marlin deve quindi ritardare la correzione fino a quando quel tratto raggiunge l'hotend:

- `FILAMENT_SENSOR_EXTRUDER_NUM`: estrusore associato;
- `MEASUREMENT_DELAY_CM`: distanza tra sensore e camera di fusione;
- `FILWIDTH_ERROR_MARGIN`: scarto massimo accettato rispetto al nominale;
- `MAX_MEASUREMENT_DELAY`: dimensione del buffer, che deve superare il ritardo espresso in centimetri.

Impostare il diametro nominale:

```gcode
M404 W1.75
```

Abilitare il sensore:

```gcode
M405
```

Leggere la misura:

```gcode
M407
```

Disabilitare la compensazione:

```gcode
M406
```

Un ritardo errato applica la correzione al tratto di filamento sbagliato. Prima di usarla in stampa bisogna verificare letture stabili e plausibili.

## Procedura di configurazione

1. Disegnare la corrispondenza tra tool, motori E, heater, sensori e ugelli.
2. Verificare che la scheda disponga delle uscite necessarie.
3. Impostare `EXTRUDERS` e i driver E.
4. Selezionare una sola architettura coerente con il meccanismo.
5. Configurare steps/mm e direzione di ciascun motore.
6. Configurare sensori e heater senza ancora comandare estrusione.
7. Verificare temperature e protezioni termiche.
8. Provare ogni motore senza filamento o con hotend in temperatura.
9. Misurare gli offset o le coordinate di docking.
10. Verificare singolarmente `T0`, `T1` e gli altri tool.
11. Allineare diametro e modalita volumetrica con lo slicer.
12. Salvare in EEPROM soltanto valori gia verificati.

## Errori comuni

- **Confondere `EXTRUDERS` con il numero di ugelli:** le architetture single-nozzle e mixing non hanno corrispondenza uno a uno.
- **Abilitare piu meccanismi di selezione:** le opzioni descrivono hardware differente.
- **Dimenticare driver o pin E:** la configurazione logica non aggiunge uscite alla scheda.
- **Usare gli stessi steps/mm per estrusori differenti:** riduzioni e diametri delle ruote possono cambiare.
- **Copiare offset di un'altra stampante:** il segno o la distanza risultano errati.
- **Usare coordinate di docking di esempio:** puo causare una collisione.
- **Scambiare diametro filamento e diametro ugello:** controllano grandezze diverse.
- **Abilitare la modalita volumetrica solo nel firmware:** il G-code viene interpretato con un'unita diversa da quella prevista.
- **Impostare un limite volumetrico teorico:** la portata reale dipende da materiale, temperatura e geometria.
- **Ignorare il ritardo del sensore di diametro:** la correzione viene applicata fuori fase.

## Checklist

- Il numero di tool logici e documentato.
- Motori, hotend, heater, sensori e ugelli sono mappati separatamente.
- La scheda dispone dei pin e dei driver richiesti.
- E0, E1 e gli altri motori hanno verso e steps/mm verificati.
- E attiva una sola architettura multi-estrusore coerente.
- Gli angoli dei servo non portano il meccanismo a fine corsa.
- Gli offset degli hotend sono misurati rispetto a T0.
- Le coordinate di parcheggio sono state provate a bassa velocita.
- Il diametro nominale coincide con il profilo materiale.
- Slicer e firmware concordano sull'unita dell'asse E.
- L'eventuale limite volumetrico e stato misurato.
- Il sensore di diametro usa distanza e buffer coerenti.
- Ogni tool e stato testato prima di una stampa multi-materiale.

## Fonti

- [Configuration.h 2.1.2.8 - Extruder and multi-material settings](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8 - Filament width and volumetrics](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [M200 - Volumetric Extrusion Diameter](https://marlinfw.org/docs/gcode/M200.html)
- [M218 - Set Hotend Offset](https://marlinfw.org/docs/gcode/M218.html)
- [M163 - Set Mix Factor](https://marlinfw.org/docs/gcode/M163.html)
- [M404-M407 - Filament Width Sensor](https://marlinfw.org/meta/gcode/)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro]]
- [[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping]]
- [[Stampante 3D/Marlin/Pagine/Linear Advance Input Shaping e compensazioni geometriche]]
- [[Stampante 3D/Marlin/Pagine/Limiti di estrusione retrazione e cambio utensile]]
