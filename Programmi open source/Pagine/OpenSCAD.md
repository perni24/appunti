---
date: 2026-06-04
area: Programmi open source
topic: Modellazione 3D parametrica tramite codice
type: technical-note
status: non revisionato
difficulty: base
tags:
  - open-source
  - cad
  - modellazione-3d
  - parametrico
aliases:
  - OpenSCAD
prerequisites: []
related:
  - "[[Programmi open source/Pagine/FreeCAD]]"
title: OpenSCAD
publish: true
---

# OpenSCAD

## Sintesi

OpenSCAD è un CAD open source per descrivere solidi con uno script. È utile per pezzi tecnici, supporti, adattatori e contenitori: cambi una quota e rigeneri il modello, senza ridisegnarlo. Il sorgente `.scad` è testo e può essere versionato con Git.

## Come funziona

Si posizionano primitive geometriche come cubi, sfere e cilindri e si combinano con unione, differenza o intersezione. In `difference()` il **primo** solido è il pezzo da conservare; tutti i successivi vengono sottratti.

## Esempio pratico

Una rondella con diametro esterno 30, altezza 10 e foro passante di diametro 8. Le quote dell’esempio sono pensate in millimetri.

```scad
diametro = 30;
altezza = 10;
foro = 8;
eps = 0.01;
$fn = 96;

difference() {
    cylinder(h = altezza, d = diametro);
    translate([0, 0, -eps])
        cylinder(h = altezza + 2 * eps, d = foro);
}
```

Il cilindro da sottrarre parte sotto la base e termina sopra la faccia superiore. Questo piccolo margine evita facce coincidenti: non aumenta il diametro del foro e **non** rappresenta il gioco meccanico da lasciare per la stampa. `$fn` controlla quanti segmenti approssimano la circonferenza.

## Verifica ed esportazione

1. Apri il file `.scad` e usa `F5` per l’anteprima. Cambia `foro` mantenendolo positivo e minore di `diametro`: deve variare solo l’apertura.
2. Usa `F6` per il rendering e controlla che la console non segnali problemi con la geometria.
3. Conserva il sorgente parametrico ed esporta una copia in STL. Nello slicer verifica unità, dimensioni esterne e presenza del foro prima di stampare.

## Limiti

L’STL conserva una mesh, non le variabili né le operazioni dello script. Per forme organiche o assiemi con molti vincoli può essere più adatto un altro strumento. Se riutilizzi la stessa forma più volte, separala in un modulo parametrico.

## Collegamenti

- [[Programmi open source/Pagine/FreeCAD|FreeCAD]]
- [[Stampante 3D/Indice Stampante 3D|Appunti sulla stampa 3D]]
- [[Programmi open source/Indice Programmi Open Source|Catalogo open source]]

## Fonti

- [OpenSCAD: linguaggio, primitive e operazioni booleane](https://files.openscad.org/documentation/manual/The_OpenSCAD_Language.html)
- [OpenSCAD: interfaccia, anteprima e rendering](https://files.openscad.org/documentation/manual/The_OpenSCAD_User_Interface.html)
