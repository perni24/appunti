---
date: 2026-03-02
tags: [mechanics, marlin, limits, software-endstops]
type: #permanent-note
status: budding
---

# Limiti Meccanici (Travel Limits e Software Endstops)

I limiti meccanici proteggono la stampante da collisioni fisiche contro la propria struttura. Marlin gestisce questi confini combinando i finecorsa fisici e i limiti software.

## 1. Travel Limits

I **Travel Limits** definiscono l'area di lavoro utile della stampante (Volume di stampa). Sono espressi in coordinate relative all'origine (Home).

In `Configuration.h`:
- `X_MIN_POS`: Posizione minima di X (solitamente 0).
- `X_MAX_POS`: Posizione massima (es. 235 per una Ender 3).
- `BED_SIZE_X / BED_SIZE_Y`: Dimensioni effettive del piatto di stampa.

> [!TIP] Oltre il piatto
> Spesso l'estrusore può uscire leggermente dal piatto per pulire l'ugello. In questo caso, `X_MIN_POS` può essere un valore negativo (es. -10).

---

## 2. Software Endstops

I **Software Endstops** impediscono via codice che l'ugello si muova oltre i limiti definiti sopra, anche se l'utente impartisce un comando G-Code errato.

- `#define MIN_SOFTWARE_ENDSTOPS`: Blocca il movimento sotto lo zero.
- `#define MAX_SOFTWARE_ENDSTOPS`: Blocca il movimento oltre la fine corsa massima.

> [!WARNING] Disabilitazione
> A volte è necessario disabilitare i limiti software temporaneamente (es: durante la taratura dello Z-Offset) tramite il comando:
> `M211 S0` ; Disabilita i software endstops
> `M211 S1` ; Li riabilita

---

## 3. Configurazione Proattiva

Le impostazioni più importanti per la sicurezza meccanica sono:
- `Z_MAX_POS`: L'altezza massima della rampa Z.
- `Z_MIN_POS`: Fondamentale per evitare che l'ugello sfondi il piatto (`Z_MIN_PROBE_REPEATABILITY_TEST` può essere utile).

---