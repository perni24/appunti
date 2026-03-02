---
date: 2026-03-02
tags: [steppers, drivers, tmc, uart, marlin]
type: #permanent-note
status: budding
---

# Gestione Driver Motor (Trinamic e UART)

I driver dei motori passo-passo sono i componenti che traducono i segnali logici del firmware in alta corrente per i motori. Marlin 2.0+ eccelle nella gestione dei moderni driver **Trinamic**.

## 1. Tipi di Collegamento

- **Standalone Mode:** Regolazione manuale (Vref tramite potenziometro). Nessuna comunicazione con il firmware.
- **UART / SPI Mode:** Il driver comunica direttamente con l'MCU della scheda madre via software.

### Vantaggi dell'UART
I parametri vengono impostati in `Configuration_adv.h`, non c'è più bisogno di girare i potenziometri sulla scheda:
```cpp
#define X_CURRENT 800 // Corrente in mA (RMS)
#define X_MICROSTEPS 16 // Impostazione microstep via codice
```

---

## 2. Tecnologie Trinamic (TMC)

I driver TMC (es. TMC2208, TMC2209) offrono funzionalità avanzate integrate:

- **StealthChop:** Rende motori e driver virtualmente silenziosi.
- **SpreadCycle:** Massimizza la coppia alle alte velocità (più rumore).
- **StallGuard:** Rileva il punto in cui il motore va in stallo (usato per il **Sensorless Homing**).

> [!INFO] Monitoraggio
> Tramite il comando `M122` puoi vedere lo stato attuale di tutti i driver TMC collegati (temperature, errori, configurazione attiva).

---

## 3. Configurazione Proattiva

In `Configuration.h`:
- `#define X_DRIVER_TYPE TMC2209`: Impostare il modello corretto è fondamentale per abilitare le funzioni intelligenti.

### Hybrid Threshold
Permette di passare automaticamente da **StealthChop** (silenzioso) a **SpreadCycle** (potente) quando la stampante supera una certa velocità critica, garantendo il meglio dei due mondi.

---
