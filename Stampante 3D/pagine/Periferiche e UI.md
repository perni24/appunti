---
date: 2026-03-02
tags: [peripherals, lcd, fans, ui, marlin]
type: #permanent-note
status: budding
---

# Periferiche e UI (Configurazione LCD e Ventole)

Oltre al controllo del movimento e del calore, Marlin gestisce l'interfaccia utente (display LCD) e gli organi ausiliari come ventole di raffreddamento e sistemi di illuminazione.

## 1. Configurazioni LCD (Display)

Marlin supporta un'ampia gamma di interfacce, dai classici 2004/12864 grafici ai moderni pannelli touch a colori.

- **REPRAP_DISCOUNT_SMART_CONTROLLER:** Il classico display 20x4 a caratteri.
- **REPRAP_DISCOUNT_FULL_GRAPHIC_SMART_CONTROLLER:** Il classico display 128x64 grafico.
- **TFT35 / MKS TFT:** Schermi touch intelligenti (spesso operano in modalità Dual Mode con Marlin).

> [!INFO] Personalizzazione
> Puoi cambiare il logo di avvio (`BOOTSCREEN`) e il nome della stampante (`CUSTOM_MACHINE_NAME`) in `Configuration.h`.

---

## 2. Gestione Ventole (Fans)

In Marlin le ventole si dividono in categorie:

- **Part Cooling Fan:** La ventola che raffredda il pezzo stampato (`FAN_PIN`). Controllata dallo slicer (M106/M107).
- **Extruder Fan (E-Fan):** Raffredda il radiatore dell'hotend.
    - `#define EXTRUDER_AUTO_FAN_TEMPERATURE 50`: Si accende automaticamente quando l'hotend supera i 50°C.
- **Controller Fan:** Raffredda l'elettronica (driver TMC). Si accende solo quando i motori sono attivi.

---

## 3. Altre Periferiche

- **SD Support:** Abilita la stampa locale senza PC (`#define SDSUPPORT`).
- **Buzzer:** Feedback acustico per messaggi e allarmi (`SPEAKER` o `BUZZER`).
- **LED/NeoPixel:** Controllo integrato di strisce LED per indicare lo stato della stampante (es: rosso = riscaldamento in corso).

---