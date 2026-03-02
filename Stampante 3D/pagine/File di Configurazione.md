---
date: 2026-03-01
tags: [marlin, configuration, firmware, 3d-printing]
type: #permanent-note
status: budding
---

# File di Configurazione Marlin

In Marlin, la configurazione del firmware avviene quasi esclusivamente attraverso due file header C++: `Configuration.h` e `Configuration_adv.h`. Questi file definiscono come il codice core interagisce con l'hardware specifico della stampante.

## 1. Meccanismo di Configurazione

Marlin utilizza le direttive del preprocessore C per abilitare o disabilitare le funzionalità.

> [!INFO] Sintassi di base
> - `#define FEATURE_NAME`: Abilita una funzionalità o imposta un valore.
> - `// #define FEATURE_NAME`: Disabilita (commenta) una funzionalità.

## 2. Configuration.h

Questo file contiene le impostazioni fondamentali necessarie per far muovere la stampante in sicurezza.

### Informazioni Hardware
- **Motherboard**: Definisce il PIN mapping (`#define MOTHERBOARD BOARD_RAMPS_14_EFB`).
- **Serial Ports**: Imposta la velocità di comunicazione (Baudrate) e le porte seriali attive.

### Settaggi Termici
- **Temp Sensors**: Specifica il tipo di termistore per Hotend e Bed (es. `1` per 100k termistore standard).
- **PID Tuning**: Impostazioni per il controllo preciso della temperatura.
- **Thermal Runaway**: Parametri di sicurezza critici.

### Cinematica e Movimento
- **Endstops**: Configurazione della logica (NC/NO) e pullup dei finecorsa.
- **Steps per Unit**: Definisce quanti impulsi servono per muovere di 1mm ogni asse.
- **Feedrate & Acceleration**: Limiti massimi di velocità e accelerazione.

---

## 3. Configuration_adv.h

Contiene le impostazioni per funzionalità avanzate, ottimizzazioni e controller specifici.

### Driver TMC (Trinamic)
Configurazione dei driver intelligenti via UART o SPI:
- Corrente dei motori (`RMS Current`).
- **StealthChop**: Per una stampa ultra-silenziosa.
- **SpreadCycle**: Per maggiore coppia ad alte velocità.
- **Sensorless Homing**: Rilevamento degli urti senza finecorsa fisici.

### Funzioni di Qualità di Stampa
- **Linear Advance**: Compensa la pressione nel nozzle per evitare accumuli di materiale negli angoli.
- **Input Shaping**: Algoritmo per ridurre le vibrazioni e il "ghosting" ad alte velocità.

### Varie
- Gestione avanzata delle ventole.
- Impostazioni per l'interfaccia LCD e il menu.
- Funzionalità di recupero in caso di mancanza di corrente (Power Loss Recovery).

---