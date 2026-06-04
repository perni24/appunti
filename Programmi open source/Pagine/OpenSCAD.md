---
date: 2026-06-04
area: Programmi open source
topic: Modellazione 3D parametrica tramite codice
type: technical-note
status: "non revisionato"
difficulty: base
tags: [open-source, cad, modellazione-3d, parametrico]
aliases: [OpenScad, OpenSCAD]
prerequisites: []
related: [FreeCAD]
---

# OpenSCAD

## Sintesi

**OpenSCAD** e un programma open source per creare modelli 3D usando codice invece di strumenti grafici tradizionali.

E particolarmente utile per progettare oggetti parametrici, pezzi tecnici, supporti, adattatori, contenitori e componenti destinati alla stampa 3D, dove le dimensioni devono essere precise e modificabili.

## Quando usarlo

- Creare modelli 3D riproducibili partendo da uno script.
- Progettare oggetti parametrici modificando variabili come altezza, diametro o spessore.
- Generare varianti dello stesso pezzo senza ridisegnarlo a mano.
- Preparare modelli semplici o tecnici per stampa 3D.
- Salvare il progetto in un formato facile da versionare con Git.

## Come funziona

In OpenSCAD il modello viene descritto con un linguaggio testuale. Si combinano primitive geometriche, come cubi, sfere e cilindri, con operazioni booleane come unione, differenza e intersezione.

Questo approccio rende il progetto molto controllabile: cambiando una variabile nello script si puo modificare l'intero modello.

## Esempio pratico

```scad
diametro = 30;
altezza = 10;
foro = 8;

difference() {
  cylinder(h = altezza, d = diametro);
  cylinder(h = altezza + 1, d = foro);
}
```

Questo esempio crea un cilindro con un foro centrale. Modificando `diametro`, `altezza` o `foro` si ottengono rapidamente varianti dello stesso pezzo.

## Punti forti

- **Parametrico**: le dimensioni possono essere controllate tramite variabili.
- **Versionabile**: i file sono testo e funzionano bene con Git.
- **Preciso**: adatto a pezzi tecnici e forme geometriche semplici.
- **Riproducibile**: lo stesso script genera sempre lo stesso modello.
- **Leggero**: non richiede un ambiente CAD complesso per modifiche semplici.

## Limiti

- Non e ideale per modellazione organica, scultura 3D o forme molto libere.
- Richiede familiarita con logica, coordinate e composizione geometrica.
- Per assiemi meccanici complessi puo essere meno comodo di un CAD parametrico come [[FreeCAD]].

## Checklist

- Definire le misure principali come variabili.
- Separare le parti ripetute in moduli.
- Usare `difference()` per fori, scassi e tagli.
- Esportare in STL solo quando il modello e pronto per la stampa.
- Controllare sempre dimensioni e tolleranze prima di stampare.
