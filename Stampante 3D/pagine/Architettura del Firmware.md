---
date: 2026-03-01
tags: [marlin, firmware, 3d-printing, architecture]
type: #permanent-note
status: budding
---

# Architettura del Firmware Marlin

L'architettura di **Marlin 2.0+** si basa su una struttura modulare progettata per supportare un'ampia gamma di schede madri a 8-bit (AVR) e 32-bit (LPC176x, STM32, SAMD51, ecc.). La transizione verso questa architettura ha permesso al firmware di essere portabile e facilmente estendibile.

## 1. Hardware Abstraction Layer (HAL)

Il cuore della portabilità di Marlin è l'**HAL** (Hardware Abstraction Layer). Questo strato si interpone tra il codice core di Marlin e le specifiche del microcontrollore (MCU).

> [!INFO] Definizione HAL
> L'HAL astrae funzioni comuni come l'input/output dei pin, la gestione dei timer, la comunicazione seriale e l'accesso alla memoria EEPROM, permettendo al medesimo codice logico di girare su architetture diverse.

## 2. Componenti Core

Marlin opera seguendo un flusso logico che va dalla ricezione del comando alla generazione fisica dei movimenti.

### G-Code Parser
Il parser è responsabile della ricezione delle stringhe G-Code tramite seriale, scheda SD o modulo Wi-Fi. Viene utilizzato un buffer (`ring buffer`) per memorizzare i comandi in attesa di essere elaborati.
- **File:** `gcode.cpp`, `parser.cpp`

### Planner
Il **Planner** è il cervello matematico del firmware. Calcola la velocità, l'accelerazione e il "jerk" (o junction deviation) per ogni movimento, assicurandosi che la stampante non superi i limiti fisici dei motori.
- Implementa l'algoritmo di **look-ahead**, che analizza i blocchi successivi per mantenere una velocità costante quando possibile, riducendo le brusche frenate.

### Stepper
Lo **Stepper** riceve i dati dal Planner e genera gli impulsi elettrici necessari per muovere i motori passo-passo. Questa operazione avviene tramite interrupt ad alta priorità per garantire una precisione temporale estrema.
- **HAL_Timer:** Utilizzato per scandire i passi con precisione di microsecondi.

### Temperature Control
Gestisce il monitoraggio dei termistori e il controllo dei riscaldatori (Hotend e Bed) tramite algoritmi **PID** (Proportional-Integral-Derivative) o **Bang-Bang**.
- Include protocolli di sicurezza come il **Thermal Runaway Protection** per prevenire incendi in caso di guasto dei sensori.

## 3. Configurazione Modulare

L'architettura non si limita al codice sorgente, ma si estende alla gestione delle impostazioni:
- `Configuration.h`: Contiene le opzioni principali relative all'hardware (tipo di stampante, driver, finecorsa, cinematica).
- `Configuration_adv.h`: Contiene regolazioni di precisione e funzionalità avanzate (Linear Advance, Input Shaping, configurazione dei driver Trinamic via UART/SPI).