---
date: 2026-03-02
tags: [calibration, marlin, steps-per-mm, setup]
type: #permanent-note
status: budding
---

# Taratura degli Assi (Steps/mm)

La taratura degli assi è un passaggio fondamentale per garantire che le dimensioni degli oggetti stampati corrispondano esattamente al modello digitale. Si basa sulla precisione dei passi che il motore deve compiere per muovere un asse di esattamente 1 millimetro.

## 1. Il Concetto di Steps/mm

Ogni motore passo-passo (solitamente 1.8° per passo, quindi 200 passi per giro completo) è accoppiato a una meccanica (cinghie o barre filettate) e pilotato da driver con microstepping (es. 1/16).

> [!INFO] Formula Teorica (XYZ)
> I valori predefiniti si calcolano matematicamente in base ai componenti hardware:
> - **Cinghie (X, Y):** $(\text{Passi motore} \times \text{Microstepping}) / (\text{Passo cinghia} \times \text{Denti puleggia})$
> - **Vite senza fine (Z):** $(\text{Passi motore} \times \text{Microstepping}) / \text{Passo della vite}$

---

## 2. Taratura dell'Estrusore (E-Steps)

La taratura più frequente è quella dell'estrusore, poiché il diametro effettivo della puleggia di trascinamento può variare leggermente.

### Procedura di Calibrazione
1. Rimuovere il nozzle o staccare il tubo Bowden per eliminare la contropressione.
2. Segnare il filamento a 120mm dall'ingresso dell'estrusore.
3. Estrudere 100mm di filamento tramite menu o comando `G1 E100 F100`.
4. Misurare quanto filamento è rimasto rispetto al segno:
   - Se rimangono 25mm, hai estruso 95mm ($120 - 25 = 95$).
5. Calcolare il nuovo valore:
   $$\text{Nuovo valore} = (\text{E-Steps correnti} \times 100) / \text{Distanza estrusa effettiva}$$

---

## 3. Applicazione dei Valori

Una volta calcolati i nuovi passi per mm, vanno comunicati alla stampante:

### Comandi G-Code
- **M92**: Imposta i nuovi valori (es. `M92 X80.12 Y80.05 Z400.00 E95.5`).
- **M500**: Salva permanentemente i valori nella EEPROM.
- **M503**: Verifica i valori attualmente in uso.

> [!WARNING] Attenzione
> Non tarare gli assi X, Y e Z basandosi sulla dimensione di un cubo stampato per compensare il ritiro del materiale (Shrinkage). La taratura degli assi deve essere puramente meccanica. Il ritiro del materiale va gestito nello slicer tramite il parametro "Flow Rate" o "Scaling".

---
