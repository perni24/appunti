---
date: 2026-07-27
area: Stampante 3D
topic: Fondamenti
type: theory-note
status: non revisionato
publish: true
difficulty: base
tags:
  - stampante-3d
  - fdm
  - componenti
aliases:
  - Parti di una stampante 3D
  - Componenti stampante FDM
prerequisites: []
related:
  - "[[Stampante 3D/Marlin/Indice Marlin]]"
title: Componenti di una stampante FDM
---

# Componenti di una stampante FDM

## Sintesi

Una stampante FDM deposita filamento termoplastico fuso lungo percorsi calcolati dallo slicer. Meccanica, estrusione, temperatura e firmware devono lavorare insieme: correggere un parametro software non risolve necessariamente un difetto meccanico.

## Problema che risolve

Questa mappa serve a riconoscere quale parte della macchina interviene in un problema e a scegliere la nota di configurazione pertinente.

## Concetto chiave

Il flusso e: modello CAD, mesh esportata, elaborazione nello slicer, G-code, esecuzione del firmware. Il modello descrive la forma; il G-code descrive movimenti e comandi compatibili con la macchina configurata.

## Componenti

| Parte | Responsabilita | Approfondimento |
|---|---|---|
| Telaio e cinematica | Mantengono geometria e rigidita; definiscono come si muovono testina e piatto | [[Stampante 3D/Marlin/Pagine/Tipo di stampante e cinematica\|Cinematica]] |
| Piatto | Supporta il primo strato; il riscaldamento influenza adesione e deformazioni | [[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti\|Area di lavoro]] |
| Estrusore | Trascina il filamento; non e il componente che lo fonde | [[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento\|Estrusione]] |
| Hotend | Riscaldatore, blocco, heatbreak, dissipatore e ugello gestiscono fusione e percorso del materiale | [[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento\|Hotend]] |
| Sensore termico | Misura la temperatura; il firmware regola il riscaldatore usando quella misura | [[Stampante 3D/Marlin/Pagine/Sensori di temperatura e limiti operativi\|Sensori]] |
| Motori e driver | Producono e controllano il movimento degli assi e dell'estrusore | [[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro\|Motori e passi]] |
| Endstop e sonda | Forniscono riferimenti per homing e misura del piano | [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing\|Homing]] |
| Scheda di controllo | Esegue Marlin, legge ingressi e pilota le uscite | [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin\|Scheda e pin]] |
| Alimentatore | Fornisce energia ai carichi, entro i limiti elettrici dell'hardware | [[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware\|Alimentazione]] |
| Ventole | Raffreddano hotend, elettronica o pezzo secondo ruoli distinti | [[Stampante 3D/Marlin/Pagine/Ventole e raffreddamento\|Raffreddamento]] |

## Esempio

Un primo strato irregolare puo dipendere da piatto non allineato, mesh assente o offset Z errato. Non sono la stessa regolazione: prima verificare la meccanica, poi il riferimento della sonda e infine la compensazione. La procedura completa segue un ordine per evitare di compensare un difetto con un altro parametro.

## Limiti

Questa nota riguarda FDM, non stampanti a resina. Le temperature, correnti e velocita corrette dipendono dall'hardware e dal materiale: non esiste un valore universale da copiare.

## Errori comuni

- Confondere estrusore e hotend.
- Attribuire al termistore il controllo del riscaldatore: il sensore misura, il firmware controlla.
- Cambiare passi per millimetro per correggere indiscriminatamente ogni errore dimensionale.
- Disattivare protezioni termiche per far sparire un allarme.
- Scambiare una mesh del piano con l'allineamento fisico degli assi.

## Collegamenti

- [[Stampante 3D/Indice Stampante 3D|Indice Stampante 3D]]
- [[Stampante 3D/Marlin/Pagine/Procedura completa di taratura e verifica|Taratura e verifica]]
- [[Programmi open source/Pagine/FreeCAD|FreeCAD]]
- [[Programmi open source/Pagine/OpenSCAD|OpenSCAD]]

## Fonti

- [Marlin: configurazione e componenti della macchina](https://marlinfw.org/docs/configuration/configuration.html)
