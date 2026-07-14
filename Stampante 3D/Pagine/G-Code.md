---
date: 2026-03-02
tags: [g-code, marlin, commands, 3d-printing]
type: #permanent-note
status: budding
---

# G-Code (Sintassi e comandi principali)

Il **G-Code** è il linguaggio standard di controllo numerico (CNC) utilizzato per impartire istruzioni alle macchine, incluse le stampanti 3D. Ogni riga di codice rappresenta un comando specifico che la stampante deve eseguire.

## 1. Sintassi del G-Code

Un tipico comando G-Code è composto da una lettera seguita da un valore numerico, eventualmente seguita da parametri addizionali.

> [!INFO] Struttura della riga
> - `G` / `M`: Il tipo di comando (Geometrico o Miscellaneo).
> - `X` `Y` `Z` `E`: Coordinate di movimento o valore per l'estrusore.
> - `F`: Feedrate (velocità di movimento in mm/min).
> - `S` / `P`: Valori specifici (es. temperatura o tempo in millisecondi).
> - `;`: Tutto ciò che segue il punto e virgola è considerato un commento.

Esempio:
```gcode
G1 X10 Y20 F3000 ; Muovi a X=10 Y=20 alla velocità di 3000 mm/min
```

---

## 2. Comandi Principali (Marlin)

### Movimento e Posizionamento
- **G0 / G1**: Movimento lineare. `G0` (rapido non di stampa), `G1` (movimento di stampa coordinato).
- **G28**: **Auto Home**. Riporta gli assi ai finecorsa fisici per definire lo zero macchina.
- **G29**: **Auto Bed Leveling**. Esegue una griglia di tastatura del piatto per compensare le irregolarità.
- **G90 / G91**: Imposta il posizionamento Assoluto (`G90`) o Relativo (`G91`).

### Controllo della Temperatura
- **M104**: Imposta la temperatura dell'Hotend senza attendere (`S<temp>`).
- **M109**: Imposta la temperatura dell'Hotend e **attende** che sia raggiunta prima di procedere.
- **M140**: Imposta la temperatura del Piatto (Bed) senza attendere.
- **M190**: Imposta la temperatura del Piatto e **attende**.

### Gestione EEPROM e Taratura
- **M500**: Salva i parametri correnti (es. Steps/mm, PID) nella EEPROM.
- **M501**: Carica i parametri salvati dalla EEPROM.
- **M503**: Mostra tutte le impostazioni correnti nel terminale.
- **M92**: Imposta gli **Steps per unit** (es. `M92 E400` per tarare l'estrusore).

### Calibrazioni Avanzate
- **M303**: Avvia il **PID Autotune** per stabilizzare la temperatura (`M303 E0 S210 C10`).
- **M900**: Imposta il valore di **Linear Advance** (`K<value>`).

---