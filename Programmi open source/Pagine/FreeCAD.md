---
date: 2026-06-09
area: Programmi open source
topic: Modellazione CAD parametrica
type: technical-note
status: non revisionato
difficulty: base
tags:
  - open-source
  - cad
  - modellazione-3d
  - parametrico
aliases:
  - FreeCAD
prerequisites: []
related:
  - "[[Programmi open source/Pagine/OpenSCAD]]"
title: FreeCAD
publish: true
---

# FreeCAD

## Sintesi

FreeCAD e un CAD open source per modellazione parametrica. Un modello conserva operazioni, quote e vincoli: modificandoli si rigenera la geometria invece di ridisegnarla.

## Quando usarlo

Per parti meccaniche, contenitori e componenti con dimensioni controllate. Non e un sostituto identico di qualunque CAD commerciale: workflow e compatibilita dei formati vanno valutati.

## Come funziona

Gli ambienti di lavoro, o workbench, raggruppano strumenti per attivita diverse: schizzi, solidi, disegno, simulazione e lavorazioni. FreeCAD e estendibile anche tramite Python.

## Esempio pratico

1. Creare uno schizzo e vincolarne le dimensioni.
2. Estruderlo per ottenere un solido.
3. Aggiungere fori o altre lavorazioni.
4. Conservare il progetto nativo e poi esportare una copia per lo scopo previsto.

## Limiti

STEP e altri formati CAD scambiano geometria, ma non garantiscono di conservare la cronologia parametrica originale. STL e una mesh: non sostituisce il progetto modificabile. Per la stampa serve ancora uno slicer.

## Checklist

- Controllare unita, quote e vincoli.
- Verificare i formati supportati dall'importatore e dall'esportatore scelti.
- Conservare il file nativo prima di esportare.
- Controllare la mesh e le dimensioni nello slicer.

## Collegamenti

- [[Programmi open source/Pagine/OpenSCAD|OpenSCAD]]
- [[Stampante 3D/Indice Stampante 3D|Stampante 3D]]
- [[Programmi open source/Indice Programmi Open Source|Catalogo open source]]

## Fonti

- [FreeCAD: codice e documentazione del progetto](https://github.com/FreeCAD/FreeCAD)
