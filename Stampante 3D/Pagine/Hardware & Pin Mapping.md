---
date: 2026-03-01
tags: [marlin, hardware, pins, hal, firmware]
type: #permanent-note
status: budding
---

# Hardware & Pin Mapping

In Marlin, l'interfaccia tra la logica software e i circuiti fisici della stampante (come motori, mosfet e sensori) è gestita attraverso un'architettura a due livelli: l'**HAL** (Hardware Abstraction Layer) e i file di **Pin Mapping**.

## 1. Hardware Abstraction Layer (HAL)

L'**HAL** è lo strato di codice che astrae l'architettura del microcontrollore (MCU). Grazie all'HAL, lo stesso codice core di Marlin può essere compilato per architetture diverse come:
- **AVR** (Arduino Mega/RAMPS a 8-bit).
- **LPC176x** (Esempio: SKR v1.3/1.4).
- **STM32** (Esempio: SKR mini E3, Creality boards).

> [!INFO] Scopo dell'HAL
> L'HAL gestisce compiti specifici dell'MCU come l'accesso ai canali PWM, la configurazione degli interrupt per i timer (fondamentali per il movimento preciso), la gestione della memoria Flash/EEPROM e le comunicazioni Seriali/I2C/SPI.

## 2. Pin Mapping (pins_*.h)

Ogni scheda madre ha un proprio layout fisico dei pin. Marlin organizza queste definizioni nella cartella `Marlin/src/pins/`.

### Come funziona la selezione della scheda
Tutto parte dalla definizione in `Configuration.h`:
```cpp
#define MOTHERBOARD BOARD_BTT_SKR_V1_4_TURBO
```
Il nome della scheda richiama internamente il file corrispondente, ad esempio `pins_BTT_SKR_V1_4_TURBO.h`.

### Definizione dei Pin standard
All'interno dei file di pin mapping, troveremo definizioni che associano un nome logico a un numero di pin fisico:

| Macro | Descrizione |
| :--- | :--- |
| `X_STEP_PIN` | Pin per l'impulso di passo del motore X |
| `X_DIR_PIN` | Pin per la direzione del motore X |
| `X_ENABLE_PIN` | Pin per abilitare/disabilitare il driver |
| `HEATER_0_PIN` | Pin che controlla il MOSFET dell'Hotend |
| `FAN_PIN` | Pin per la ventola di raffreddamento pezzo |
| `TEMP_0_PIN` | Pin analogico per il termistore dell'Hotend |

## 3. Override e Personalizzazione

È possibile sovrascrivere i pin predefiniti se si desidera spostare un componente su un connettore diverso (ad esempio, se un connettore sulla scheda si è bruciato).

> [!TIP] Best Practice
> Invece di modificare i file core nella cartella `pins/`, è consigliabile gestire le modifiche hardware non standard direttamente nel file di configurazione, se possibile, oppure identificare con precisione la catena di inclusione (`pins_MYBOARD.h` -> `pins_RAMPS.h`, etc.) per capire dove applicare l'override.

---