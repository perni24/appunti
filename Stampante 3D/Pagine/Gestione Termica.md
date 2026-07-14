---
date: 2026-03-02
tags: [thermal, marlin, pid, safety, 3d-printing]
type: #permanent-note
status: budding
---

# Gestione Termica (PID Tuning e Thermal Runaway)

La gestione del calore è l'aspetto più critico per la sicurezza di una stampante 3D. Marlin implementa algoritmi avanzati sia per la precisione della temperatura che per la protezione contro i guasti hardware.

## 1. PID Tuning

L'algoritmo **PID** (Proportional-Integral-Derivative) viene utilizzato per mantenere la temperatura dell'Hotend e del Piatto stabile, evitando oscillazioni che potrebbero compromettere la qualità di stampa.

> [!INFO] I tre parametri
> - **P (Proporzionale):** Determina quanto "forte" è la reazione rispetto alla distanza dal target.
> - **I (Integrale):** Corregge gli errori cumulativi nel tempo (offset residuo).
> - **D (Derivativo):** Smorza la reazione per evitare "overshoot" (superamento del target).

### Come eseguire l'autotuning
Utilizza il comando G-Code `M303`:
```gcode
M303 E0 S210 C10 ; Esegui autotune su Hotend 0 a 210°C per 10 cicli
```
Al termine, la stampante restituirà i valori di Kp, Ki e Kd. Questi vanno salvati con:
```gcode
M301 P<Kp> I<Ki> D<Kd> ; Per l'hotend
M500 ; Salva in EEPROM
```

---

## 2. Thermal Runaway Protection

Questa è la protezione software fondamentale contro gli incendi. Si attiva se il firmware nota un'incongruenza tra la potenza erogata al riscaldatore e l'aumento della temperatura letto dal termistore.

### Scenari di attivazione
*   Il termistore si stacca dall'hotend (legge la temperatura ambiente mentre l'hotend fonde).
*   Il riscaldatore scivola fuori dal blocco.
*   Il cavo del termistore è interrotto o in corto.

> [!CAUTION] Messaggio di Errore
> Se visualizzi `THERMAL RUNAWAY` o `HEATING FAILED` sul display LCD, la stampante interromperà immediatamente ogni alimentazione ai riscaldatori e spegnerà i motori. È necessario un riavvio hardware dopo aver rimosso la causa del guasto.

---

## 3. Configurazione in Marlin

In `Configuration.h`:
- `#define PIDTEMP`: Abilita il PID per l'hotend.
- `#define PIDTEMPBED`: Abilita il PID per il piatto (fortemente consigliato al posto del Bang-Bang).
- `#define THERMAL_PROTECTION_HOTENDS`: Attiva la sicurezza per gli estrusi.
- `#define THERMAL_PROTECTION_BED`: Attiva la sicurezza per il piatto.

---