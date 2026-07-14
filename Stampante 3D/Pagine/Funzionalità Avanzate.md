---
date: 2026-03-02
tags: [advanced, marlin, linear-advance, input-shaping, quality]
type: #permanent-note
status: budding
---

# Funzionalità Avanzate (Linear Advance, Input Shaping)

Marlin 2.0+ integra algoritmi avanzati, alcuni dei quali nati in ambiente Klipper, per migliorare drasticamente la qualità e la velocità di stampa.

## 1. Linear Advance (LIN_ADVANCE)

Il **Linear Advance** gestisce la pressione all'interno dell'ugello. Durante le accelerazioni e frenate, la pressione tende a non essere uniforme, causando rigonfiamenti agli angoli o sotto-estrusione nelle ripartenze.

### Come funziona
Calcola la compressione del filamento (specialmente nel tubo Bowden) e anticipa o ritarda l'estrusione per mantenere costante la portata di plastica.

> [!INFO] Valore K
> Il valore `K` determina quanto forte è la compensazione.
> - **Bowden:** Tipicamente tra 0.5 e 2.0.
> - **Direct Drive:** Più basso, solitamente sotto 0.1.

Esegui il test di calibrazione (Line Test) e imposta il valore con:
`M900 K0.1` ; Imposta il K-factor.

---

## 2. Input Shaping (Marlin 2.1+)

L'**Input Shaping** è una tecnica di riduzione delle vibrazioni. Attutisce le frequenze di risonanza della macchina che causano il "ghosting" o "ringing" (ombreggiature ripetute sulla superficie).

### Requisiti
Funziona solo su schede a **32-bit** a causa dell'alta potenza di calcolo richiesta per modellare il movimento tramite frequenze sinusoidali.

### Comandi G-Code
- `M593`: Imposta il tipo di shaper (es: MZV, EI) e la frequenza (Hz).

---

## 3. Altre Funzioni Pro

- **Arc Support (`G2`/`G3`):** Permette di descrivere i cerchi come archi invece di tanti piccoli segmenti rettilinei, riducendo il carico del buffer seriale.
- **Power Loss Recovery:** Permette di riprendere la stampa in caso di mancanza di corrente salvando continuamente lo stato sulla SD.

---