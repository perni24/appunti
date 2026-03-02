---
date: 2026-03-02
tags: [bed-leveling, marlin, abl, mesh, probe]
type: #permanent-note
status: budding
---

# Livellamento del Letto (Mesh, ABL e Probe Offsets)

Il livellamento del letto (Bed Leveling) è essenziale per garantire un primo strato perfetto. Poiché nessun piatto di stampa è perfettamente piano, Marlin offre diverse tecnologie per compensare le irregolarità meccaniche via software.

## 1. Tipi di Livellamento in Marlin

Marlin supporta diverse strategie, attivabili in `Configuration.h`:

- **Manual Mesh Leveling:** L'utente sposta l'ugello in vari punti del piatto e regola l'altezza via software (senza sensore).
- **Auto Bed Leveling (ABL):** Un sensore (come BLTouch, Induttivo o Capacitivo) misura la distanza in una griglia di punti.
    - **Bilinear:** Crea una mesh interpolata (veloce, ideale per piatti piccoli).
    - **Unified Bed Leveling (UBL):** Il sistema più avanzato, permette di salvare, caricare e modificare mesh molto dense.

> [!INFO] G-Code G29
> Il comando `G29` avvia la procedura di livellamento. Deve essere eseguito dopo l'Homing (`G28`).

---

## 2. Probe Offsets (Z-Offset)

Il sensore di livellamento non si trova quasi mai alla stessa altezza e posizione dell'ugello. Marlin deve conoscere questa distanza relativa.

- **XY Offset:** La distanza orizzontale tra il sensore e l'ugello.
- **Z-Offset:** Il valore più critico. Rappresenta la distanza verticale tra il punto in cui il sensore scatta e la punta dell'ugello.

### Regolazione dello Z-Offset
Se l'ugello è troppo alto dopo il livellamento, lo Z-Offset deve essere più negativo.
```gcode
M851 Z-1.45 ; Imposta lo Z-Offset
M500 ; Salva in EEPROM
```

---

## 3. Fade Height

Marlin può "sfumare" la compensazione del letto man mano che si sale con l'altezza di stampa. Questo evita di trascinare l'irregolarità del piatto su tutto l'oggetto.
- `#define ENABLE_LEVELING_FADE_HEIGHT`: Abilita la funzione.
- `M420 Z10`: Imposta la sfumatura fino a 10mm di altezza.

---

## 4. Configurazione in Marlin

In `Configuration.h`:
- `#define AUTO_BED_LEVELING_BILINEAR`: Esempio di scelta algoritmo.
- `#define GRID_MAX_POINTS_X 5`: Numero di punti per asse.
- `#define Z_SAFE_HOMING`: Impedisce l'homing di Z fuori dal piatto se si usa un sensore.

---