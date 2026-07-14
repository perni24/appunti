---
date: 2026-03-02
tags: [homing, endstops, marlin, sensorless, hardware]
type: #permanent-note
status: budding
---

# Endstops & Homing (Logica NC/NO, Sensorless Homing)

L'operazione di **Homing** è il processo con cui la stampante identifica l'origine (0,0,0) dei propri assi coordinati. Per farlo, utilizza dei sensori chiamati **Endstops** (finecorsa).

## 1. Logica dei Finecorsa fisici

I finecorsa meccanici, ottici o magnetici possono essere configurati in due modalità logiche:

- **Normally Closed (NC):** Il circuito è chiuso quando non premuto. È la configurazione più sicura (Fail-Safe): se un cavo si rompe, la stampante vede il circuito aperto e interpreta che l'endstop sia premuto, fermando il movimento.
- **Normally Open (NO):** Il circuito si chiude solo quando premuto.

> [!INFO] Configurazione in Marlin
> Si gestisce tramite le macro:
> - `X_MIN_ENDSTOP_INVERTING`: `true` per NO, `false` per NC.
> - `X_PULLUP`: Abilita la resistenza interna dell'MCU se il sensore non ha alimentazione propria.

---

## 2. Sensorless Homing

Questa tecnologia, disponibile con i driver **Trinamic** (es. TMC2209, TMC2130), permette di eliminare i finecorsa fisici sugli assi X e Y.

### Come funziona
Il driver monitora la Forza Controelettromotrice (Back-EMF) del motore. Quando l'asse urta contro la struttura meccanica, il carico aumenta bruscamente; il driver rileva questo "stallo" e invia un segnale di stop a Marlin.

### Requisiti
- Driver TMC in modalità **StallGuard**.
- Collegamento del pin `DIAG` del driver al pin dell'endstop sulla scheda madre.
- Taratura della sensibilità tramite `#define X_STALL_SENSITIVITY`.

---

## 3. Direzione e Offset

Marlin deve sapere verso quale lato deve muoversi per cercare lo zero:
- `X_HOME_DIR`: `-1` (Minimo) o `1` (Massimo).

### Z-Probe come Endstop
Se si usa un sensore di livellamento (come il BLTouch) per fare l'homing di Z, bisogna abilitare:
`#define USE_Z_MIN_PROBE_FOR_Z_HOMING`.

---
