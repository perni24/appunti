---
date: 2026-03-02
tags: [kinematics, jerk, acceleration, marlin, performance]
type: #permanent-note
status: budding
---

# Cinematica, Jerk e Accelerazioni

La dinamica del movimento in Marlin è regolata da tre componenti principali: la cinematica (come i motori si muovono insieme), le accelerazioni e il Jerk (o Junction Deviation).

## 1. Cinematica

Marlin supporta diverse architetture di movimento:

- **Cartesiana (Standard):** Ogni asse è indipendente (X, Y, Z).
- **CoreXY / H-Bot:** I motori X e Y lavorano insieme per muovere la testina sul piano orizzontale.
- **Delta:** Tre bracci disposti verticalmente controllano la posizione.

> [!INFO] Configurazione
> `#define COREXY`: Abilita questa architettura specifica.
> `#define DELTA`: Abilita la cinematica delta.

---

## 2. Accelerazioni

L'accelerazione definisce quanto velocemente la stampante raggiunge la velocità di crociera (feedrate). Una corretta gestione evita:
- **Ringing/Ghosting:** Vibrazioni visibili sui bordi.
- **Perdita di passi:** Se l'accelerazione è troppo alta per la coppia dei motori.

### Comandi G-Code
- `M201`: Imposta l'accelerazione massima (per asse).
- `M204`: Imposta l'accelerazione di stampa (`P`) e di viaggio (`T`).
- `M205`: Imposta i valori di Jerk.

---

## 3. Jerk vs Junction Deviation

Sono due metodi per gestire la velocità dell'ugello quando cambia direzione (es. a un angolo di 90°).

### Classic Jerk
Il Jerk è la velocità istantanea minima che l'ugello mantiene in un angolo. Valori alti velocizzano la stampa ma aumentano le vibrazioni e gli impatti meccanici.

### Junction Deviation (JD)
Marlin 2.0+ introduce lo JD come alternativa al Classic Jerk. Calcola la velocità basandosi sull'angolo tra i segmenti e un raggio immaginario.
- `#define JUNCTION_DEVIATION`: Abilita questo metodo matematicamente più fluido.

---

## 4. Configurazioni Critiche

In `Configuration.h`:
- `DEFAULT_ACCELERATION`: Tipicamente tra 500 e 1500 per stampanti entry-level.
- `DEFAULT_XJERK`: Solitamente tra 5 e 10.

> [!TIP] Optimizzazione
> Per stampanti ad alta velocità (es: Klipper-style), è fondamentale bilanciare masse in movimento e rigidità strutturale prima di aumentare questi parametri via firmware.

---