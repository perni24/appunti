---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note

publish: true
difficulty: avanzato
tags: [marlin, pid, mpc, temperatura, thermal-runaway]
aliases: [PID Marlin, MPC Marlin, Protezioni termiche Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Sensori di temperatura e limiti operativi]]"
  - "[[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Ventole e raffreddamento]]"
  - "[[Stampante 3D/Marlin/Pagine/Limiti di estrusione retrazione e cambio utensile]]"
marlin-version: "2.1.2.8"
---

# Controllo PID, MPC e protezioni termiche

## Sintesi

Il controllo termico decide quanta potenza fornire a un heater; le protezioni termiche verificano invece che la risposta osservata sia compatibile con un sistema funzionante.

| Funzione | Domanda |
|---|---|
| Bang-bang | la temperatura e sopra o sotto la soglia? |
| PID | quale potenza riduce errore, accumulo e velocita di variazione? |
| MPC | quale potenza prevede il modello fisico del sistema? |
| Watch | la temperatura sta aumentando abbastanza durante il riscaldamento? |
| Thermal runaway | il sistema riesce a restare vicino al target? |
| `MINTEMP` / `MAXTEMP` | la lettura e dentro l'intervallo ammesso? |

Una buona taratura non sostituisce le protezioni. Una protezione che interviene ripetutamente non va disabilitata prima di aver escluso sensori allentati, heater insufficienti, cablaggi difettosi e flussi d'aria errati.

## Metodi di controllo dell'hotend

In `Configuration.h`:

```cpp
#define PIDTEMP
//#define MPCTEMP
```

Per l'hotend si sceglie tra:

- nessuna delle due: bang-bang;
- `PIDTEMP`: controllo PID;
- `MPCTEMP`: Model Predictive Control.

PID e MPC non rappresentano due correzioni da sommare. Sono controllori alternativi per lo stesso heater.

## Controllo bang-bang

Con PID e MPC disabilitati, l'heater viene comandato in modo acceso/spento:

```cpp
#define BANG_MAX 255
```

`BANG_MAX` limita la potenza massima, dove 255 corrisponde al duty cycle pieno.

Vantaggi:

- implementazione semplice;
- adatto a sistemi lenti;
- utile con attuatori che non devono commutare rapidamente.

Limiti:

- oscillazione attorno al target;
- risposta meno precisa sull'hotend;
- variazioni piu evidenti quando cambiano flusso d'aria e portata.

Non va usato per aggirare un PID mal tarato senza capire la causa.

## Controllo PID dell'hotend

```cpp
#define PIDTEMP
#define PID_MAX 255
#define PID_K1 0.95
```

I termini principali sono:

- **P:** reagisce all'errore istantaneo;
- **I:** accumula l'errore persistente;
- **D:** reagisce alla velocita di variazione e smorza la risposta.

Default:

```cpp
#define DEFAULT_KP 22.20
#define DEFAULT_KI 1.08
#define DEFAULT_KD 114.00
```

Sono valori di esempio, non una taratura universale.

`PID_MAX` limita il duty cycle massimo durante il controllo. Ridurlo puo limitare potenza e corrente media, ma aumenta il tempo di riscaldamento e puo provocare `Heating failed` se il sistema non sale abbastanza.

`PID_K1` applica smoothing all'interno del loop. Non va cambiato come primo tentativo di correzione.

## Parametri separati per hotend

Per hotend fisicamente differenti:

```cpp
//#define PID_PARAMS_PER_HOTEND
```

si usano liste:

```cpp
#define DEFAULT_KP_LIST { 22.20, 22.20 }
#define DEFAULT_KI_LIST { 1.08, 1.08 }
#define DEFAULT_KD_LIST { 114.00, 114.00 }
```

Se la lista contiene meno valori degli hotend, l'ultimo viene applicato ai rimanenti. Ogni hotend con heater, blocco, sensore o ventilazione differente dovrebbe essere tarato separatamente.

## PID autotune con `M303`

Prima del test:

1. montare hotend, calza e ventole nella configurazione reale;
2. assicurare il sensore;
3. allontanare materiale infiammabile;
4. controllare che la temperatura a riposo sia plausibile;
5. scegliere un target vicino all'uso abituale ma sotto i limiti;
6. sorvegliare l'intero ciclo.

Tarare E0 a 210 °C per otto cicli:

```gcode
M303 E0 C8 S210
```

Applicare direttamente il risultato nella sessione:

```gcode
M303 E0 C8 S210 U1
```

Senza `U1`, il comando stampa i valori ma non li applica automaticamente.

Leggere i valori correnti:

```gcode
M503
```

Impostare manualmente i parametri dell'hotend:

```gcode
M301 E0 P22.2 I1.08 D114
```

Salvare:

```gcode
M500
```

La taratura va ripetuta dopo modifiche a:

- heater;
- sensore;
- blocco o ugello;
- calza;
- ventola o convogliatore;
- alimentazione;
- configurazione fisica dell'hotend.

## `PID_FUNCTIONAL_RANGE`

```cpp
#define PID_FUNCTIONAL_RANGE 10
```

Se l'errore supera questo intervallo, Marlin usa potenza minima o massima invece del calcolo PID. Il PID opera vicino al target, dove la modulazione fine e utile.

Un valore troppo piccolo ritarda l'ingresso nel controllo fine; uno troppo grande puo rendere il riscaldamento iniziale meno diretto. Non e un limite di sicurezza.

## PID del piatto

```cpp
//#define PIDTEMPBED
```

Con PID attivo:

```cpp
#define DEFAULT_BED_KP 10.00
#define DEFAULT_BED_KI 0.023
#define DEFAULT_BED_KD 305.4
```

Tarare il piatto a 60 °C:

```gcode
M303 E-1 C8 S60
```

Impostare i coefficienti:

```gcode
M304 P10 I0.023 D305.4
```

Con PID disabilitato viene usato bang-bang. Per aggiungere isteresi:

```cpp
//#define BED_LIMIT_SWITCHING
```

In `Configuration_adv.h`:

```cpp
#define BED_CHECK_INTERVAL 5000
#define BED_HYSTERESIS 2
```

Il piatto e lento e immagazzina molta energia. Il metodo adatto dipende anche dall'attuatore. Un relè meccanico non deve essere commutato alla frequenza di un PWM per MOSFET; un SSR deve essere del tipo corretto per il carico e la rete. `SLOW_PWM_HEATERS` esiste per heater comandati da relè compatibili con commutazioni lente, ma la scelta va verificata elettricamente.

## Controllo della camera

```cpp
//#define PIDTEMPCHAMBER
//#define CHAMBER_LIMIT_SWITCHING
#define MAX_CHAMBER_POWER 255
```

Con PID:

```cpp
#define DEFAULT_CHAMBER_KP 37.04
#define DEFAULT_CHAMBER_KI 1.40
#define DEFAULT_CHAMBER_KD 655.17
```

La release indica `M303 E-2` per l'autotune della camera:

```gcode
M303 E-2 C8 S50
```

I coefficienti runtime possono essere impostati con:

```gcode
M309 P37.04 I1.40 D655.17
```

Una camera riscaldata coinvolge volumi, materiali e cablaggi esposti a temperatura prolungata. Il limite non deve essere scelto soltanto in base al materiale stampato.

## Model Predictive Control

```cpp
//#define MPCTEMP
```

MPC usa un modello fisico dell'hotend per prevedere la potenza necessaria. Nella configurazione 2.1.2.8 considera:

- potenza della cartuccia;
- capacita termica del blocco;
- risposta del sensore;
- dispersione verso l'ambiente;
- effetto della ventola;
- energia assorbita dal filamento.

Parametri principali:

```cpp
#define MPC_MAX 255
#define MPC_HEATER_POWER { 40.0f }
#define MPC_BLOCK_HEAT_CAPACITY { 16.7f }
#define MPC_SENSOR_RESPONSIVENESS { 0.22f }
#define MPC_AMBIENT_XFER_COEFF { 0.068f }
#define MPC_AMBIENT_XFER_COEFF_FAN255 { 0.097f }
#define FILAMENT_HEAT_CAPACITY_PERMM { 5.6e-3f }
```

La potenza `MPC_HEATER_POWER` deve corrispondere alla cartuccia reale alla tensione di alimentazione reale.

Leggere i parametri:

```gcode
M306
```

Impostare una cartuccia da 40 W:

```gcode
M306 P40
```

Avviare l'autotune del modello:

```gcode
M306 T
```

Nella release, la posizione di taratura e definita da:

```cpp
#define MPC_TUNING_POS { X_CENTER, Y_CENTER, 1.0f }
#define MPC_TUNING_END_Z 10.0f
```

`M306 T` puo quindi muovere la testina verso il centro del piatto e vicino alla quota del primo layer. Prima del comando bisogna liberare piatto e ugello, verificare homing e coordinate e sorvegliare il movimento.

Con:

```cpp
#define MPC_INCLUDE_FAN
```

il modello include la dispersione con ventola a piena velocita. Per una sola ventola che investe piu hotend, le opzioni `MPC_FAN_0_ALL_HOTENDS` e `MPC_FAN_0_ACTIVE_HOTEND` specificano come applicare l'effetto.

I metodi `S0`, `S1` e `S2` documentati nelle versioni Marlin successive non vanno presunti nella guida 2.1.2.8: la configurazione di riferimento richiede semplicemente `M306 T`.

## PID Extrusion Scaling e Fan Scaling

Con PID si possono aggiungere termini anticipativi:

```cpp
//#define PID_EXTRUSION_SCALING
//#define PID_FAN_SCALING
```

Il primo aumenta la potenza in proporzione alla velocita di estrusione; il secondo compensa il raffreddamento della ventola. Richiedono taratura separata e possono mascherare un flusso d'aria diretto male.

Il commento MPC della release indica che, con un modello configurato correttamente, queste due compensazioni non sono necessarie.

## Protezioni termiche principali

In `Configuration.h`:

```cpp
#define THERMAL_PROTECTION_HOTENDS
#define THERMAL_PROTECTION_BED
#define THERMAL_PROTECTION_CHAMBER
#define THERMAL_PROTECTION_COOLER
```

Vanno abilitate per gli elementi realmente presenti. Le protezioni lavorano insieme ai limiti descritti nella nota sui sensori.

## Watch: mancato riscaldamento

Per hotend:

```cpp
#define WATCH_TEMP_PERIOD 40
#define WATCH_TEMP_INCREASE 2
```

Quando `M104`, `M109` o `M303` aumentano il target, Marlin verifica che la temperatura cresca di almeno `WATCH_TEMP_INCREASE` entro il periodo. In caso contrario arresta la macchina con `Heating failed`.

Per il piatto:

```cpp
#define WATCH_BED_TEMP_PERIOD 60
#define WATCH_BED_TEMP_INCREASE 2
```

Per la camera:

```cpp
#define WATCH_CHAMBER_TEMP_PERIOD 60
#define WATCH_CHAMBER_TEMP_INCREASE 2
```

Un fallimento puo indicare:

- heater scollegato o sottodimensionato;
- alimentazione insufficiente;
- sensore non solidale al corpo riscaldato;
- tabella sensore errata;
- aria diretta sul blocco;
- massa termica elevata;
- potenza limitata troppo;
- temperatura ambiente molto bassa.

La sorgente raccomanda di non portare `WATCH_*_INCREASE` sotto 2 °C. Prima di allungare il periodo bisogna misurare la pendenza reale e correggere i difetti.

## Thermal runaway: perdita del target

Per hotend:

```cpp
#define THERMAL_PROTECTION_PERIOD 40
#define THERMAL_PROTECTION_HYSTERESIS 4
```

Dopo il raggiungimento del target, Marlin osserva la stabilita. Se la temperatura resta troppo lontana dal target per troppo tempo, arresta la macchina.

Per il piatto:

```cpp
#define THERMAL_PROTECTION_BED_PERIOD 20
#define THERMAL_PROTECTION_BED_HYSTERESIS 2
```

Per la camera:

```cpp
#define THERMAL_PROTECTION_CHAMBER_PERIOD 20
#define THERMAL_PROTECTION_CHAMBER_HYSTERESIS 2
```

Un errore thermal runaway puo derivare dal distacco del sensore, ma anche da calza mancante, ventola che investe il blocco, PID errato, connettore intermittente o potenza insufficiente.

Aumentare periodo o isteresi riduce i falsi positivi ma rallenta anche il rilevamento. La modifica deve essere giustificata da un grafico della risposta termica e da una verifica hardware.

## Variance Monitor e sensore scheda

```cpp
//#define THERMAL_PROTECTION_VARIANCE_MONITOR
```

La release lo indica come sperimentale. Cerca un sensore bloccato che non aggiorna la lettura; puo produrre falsi positivi e va valutato separatamente dalle protezioni principali.

Con `TEMP_SENSOR_BOARD`:

```cpp
#define THERMAL_PROTECTION_BOARD
#define BOARD_MINTEMP 8
#define BOARD_MAXTEMP 70
```

Marlin arresta la macchina se la scheda esce dall'intervallo. La posizione del sensore deve essere rappresentativa e la temperatura massima deve considerare i componenti reali, non soltanto l'aria nel box.

## Hotend Idle Timeout

```cpp
//#define HOTEND_IDLE_TIMEOUT
```

Default della release:

```cpp
#define HOTEND_IDLE_TIMEOUT_SEC (5*60)
#define HOTEND_IDLE_MIN_TRIGGER 180
#define HOTEND_IDLE_NOZZLE_TARGET 0
#define HOTEND_IDLE_BED_TARGET 0
```

Dopo un periodo senza movimento dell'estrusore, riduce i target per evitare che il filamento resti a lungo caldo e degradi. Non e una thermal runaway e non sostituisce una procedura di pausa corretta.

## Verifica dopo la taratura

1. Portare l'hotend a un target moderato.
2. Osservare salita, overshoot e tempo di stabilizzazione.
3. Ripetere al target operativo.
4. Attivare la ventola alla velocita normalmente usata.
5. Verificare che il target venga recuperato senza oscillazioni persistenti.
6. Estrudere alla portata prevista e osservare la caduta.
7. Ripetere per ciascun hotend.
8. Testare il piatto al centro del suo intervallo operativo.
9. Controllare connettori, MOSFET e cavi durante un ciclo prolungato.
10. Verificare con `M503` i parametri effettivamente caricati.
11. Salvare con `M500` soltanto dopo il controllo.
12. Conservare valori e condizioni del test insieme alla configurazione.

Non simulare un guasto staccando sensori o heater mentre sono alimentati. La verifica delle protezioni deve essere progettata con strumenti, supervisione e una procedura che non esponga persone o macchina a energia termica incontrollata.

## Errori comuni

- **Usare PID e MPC come se fossero cumulativi:** controllano lo stesso heater.
- **Copiare Kp, Ki e Kd da un'altra macchina:** massa, heater e sensore cambiano.
- **Tarare senza ventola o calza nella configurazione reale:** il modello ottenuto non rappresenta la stampa.
- **Usare `M303` vicino a MAXTEMP:** l'autotune provoca oscillazioni intenzionali.
- **Confondere `U1` con salvataggio EEPROM:** applicare non significa necessariamente salvare.
- **Usare PID rapido con un relè meccanico:** causa usura e puo essere pericoloso.
- **Inserire una potenza MPC nominale errata:** il modello calcola energia sbagliata.
- **Avviare `M306 T` con il piatto occupato:** la testina puo muoversi nella zona di taratura.
- **Disabilitare thermal runaway per eliminare un allarme:** si rimuove una protezione vitale.
- **Allargare subito periodi e isteresi:** si rallenta il rilevamento senza correggere la causa.
- **Confondere `Heating failed` e `Thermal runaway`:** sorvegliano fasi differenti.
- **Credere che il firmware interrompa un MOSFET saldato chiuso:** puo essere necessaria una protezione hardware indipendente.

## Checklist

- Il tipo di sensore e stato verificato prima della taratura.
- Hotend, bed e camera usano il controllore appropriato.
- PID e MPC non sono abilitati insieme.
- L'autotune usa target e configurazione fisica realistici.
- Ogni hotend differente ha parametri propri.
- Potenza massima e frequenza sono compatibili con MOSFET, SSR o relè.
- La potenza dichiarata a MPC corrisponde alla cartuccia reale.
- La posizione di `M306 T` e libera e raggiungibile.
- Watch e thermal runaway sono attivi.
- Gli allarmi sono stati diagnosticati prima di modificare le soglie.
- La ventola non soffia direttamente su sensore o blocco in modo indesiderato.
- La scheda resta entro i propri limiti termici.
- `M503` mostra i parametri attesi.
- I valori validati sono stati salvati e documentati.

## Fonti

- [Configuration.h 2.1.2.8 - PID, MPC and thermal protection](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8 - Thermal protection parameters](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Thermal Protection - Marlin configuration](https://marlinfw.org/docs/configuration/configuration.html#thermal-protection)
- [M303 - PID Autotune](https://marlinfw.org/docs/gcode/M303.html)
- [M301 - Set Hotend PID](https://marlinfw.org/docs/gcode/M301.html)
- [M304 - Set Bed PID](https://marlinfw.org/docs/gcode/M304.html)
- [Model Predictive Temperature Control](https://marlinfw.org/docs/features/model_predictive_control.html)
- [M306 - Model Predictive Temperature Control](https://marlinfw.org/docs/gcode/M306.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Sensori di temperatura e limiti operativi]]
- [[Stampante 3D/Marlin/Pagine/Alimentazione e protezioni hardware]]
- [[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento]]
- [[Stampante 3D/Marlin/Pagine/Limiti di estrusione retrazione e cambio utensile]]
- [[Stampante 3D/Marlin/Pagine/Ventole e raffreddamento]]
