---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: technical-note
publish: true
difficulty: avanzato
tags:
  - marlin
  - configuration-h
  - configuration-adv-h
  - direttive
  - riferimento
aliases:
  - Cheat sheet Marlin
  - Direttive Marlin
  - Riferimento configurazione Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/G-code per configurazione e diagnostica]]"
  - "[[Stampante 3D/Marlin/Pagine/Migrazione della configurazione tra versioni]]"
marlin-version: 2.1.2.8
title: Riferimento rapido delle direttive Marlin
status: non revisionato
---

# Riferimento rapido delle direttive Marlin

## Sintesi

Questa pagina e una mappa di consultazione delle principali direttive presenti in `Configuration.h` e `Configuration_adv.h` di Marlin 2.1.2.8.

Serve per:

- trovare il nome della direttiva associata a una parte della macchina;
- capire in quale file cercarla;
- distinguere opzioni compile-time, default runtime ed EEPROM;
- individuare il G-code utile per leggere o provare il valore;
- raggiungere la pagina che spiega dipendenze, rischi e verifica.

Non sostituisce i commenti dei file originali ne rappresenta l'elenco di ogni macro interna. Le direttive cambiano tra release: prima di usarne una verificare sempre il file della versione realmente compilata.

## Gerarchia delle fonti

Ordine consigliato:

1. `Configuration.h` e `Configuration_adv.h` della release esatta.
2. `SanityCheck.h` e condizioni di compilazione della stessa release.
3. File `pins_*.h` selezionati dalla motherboard.
4. Documentazione ufficiale Marlin.
5. Configurazione di esempio della stessa release.
6. Questa guida, come spiegazione e mappa.

Una configurazione trovata online per un'altra scheda o release non e una fonte sufficiente per scegliere pin, sensori o limiti.

## Come leggere una direttiva

### Opzione abilitata

```cpp
#define EEPROM_SETTINGS
```

La macro esiste durante il preprocessing e la funzione collegata puo essere compilata.

### Opzione disabilitata

```cpp
//#define EEPROM_SETTINGS
```

La riga e un commento. La macro non viene definita da quella posizione.

### Opzione con valore

```cpp
#define BAUDRATE 250000
```

Il valore fa parte della build.

### Booleano C++

```cpp
#define INVERT_X_DIR false
```

Commentare la direttiva non equivale necessariamente a impostarla su `false`: seguire la forma prevista dal file.

### Array

```cpp
#define DEFAULT_AXIS_STEPS_PER_UNIT { 80, 80, 400, 500 }
```

Ordine, numero degli elementi e significato dipendono dagli assi e dagli estrusori compilati.

### Stringa

```cpp
#define CUSTOM_MACHINE_NAME "Stampante 3D"
```

Usare virgolette ASCII e rispettare i limiti indicati nei commenti.

### Blocco dipendente

```cpp
#if ENABLED(EEPROM_SETTINGS)
  #define EEPROM_AUTO_INIT
#endif
```

La sotto-opzione ha effetto soltanto quando la funzione principale e abilitata.

## I livelli della configurazione

| Livello | Esempio | Durata | Precedenza pratica |
|---|---|---|---|
| Hardware | puleggia, termistore, driver | finche non viene modificato | determina quali valori sono validi |
| Direttiva compile-time | `MOTHERBOARD`, `TEMP_SENSOR_0` | fino al nuovo flash | include codice e definisce pin/funzioni |
| Default compilato | `DEFAULT_AXIS_STEPS_PER_UNIT` | incorporato nel firmware | caricato da `M502` |
| RAM runtime | valore impostato con `M92` | fino a reset o caricamento | usato immediatamente |
| EEPROM | valore salvato con `M500` | persiste ai riavvii | puo sovrascrivere il default compilato |
| G-code del job | `M900 K...` nello start G-code | job o sessione | puo cambiare il valore dopo l'avvio |
| Slicer | velocita, flow, retrazione | profilo o file | genera richieste entro i limiti firmware |

Esempio:

```cpp
#define DEFAULT_AXIS_STEPS_PER_UNIT { 80, 80, 400, 500 }
```

Dopo il boot, una EEPROM esistente puo caricare valori differenti. Il report da usare e:

```gcode
M503
```

## File principali

| File | Contenuto |
|---|---|
| `Configuration.h` | hardware, cinematica, sensori, movimento base, probe, leveling, UI e funzioni comuni |
| `Configuration_adv.h` | driver avanzati, compensazioni, buffer, accessori e opzioni specialistiche |
| `Version.h` | versione firmware e metadati della build |
| `boards.h` | identificatori `BOARD_*` |
| `pins.h` e `pins_*.h` | selezione e assegnazione dei pin |
| `Conditionals_*.h` | valori derivati e dipendenze |
| `SanityCheck.h` | controlli che rifiutano configurazioni incoerenti |
| `platformio.ini` e `ini/` | ambienti di compilazione |
| `config.ini` | modifiche preprocessate alla configurazione, se usato |

## Versione e identita

| Direttiva | File | Funzione |
|---|---|---|
| `CONFIGURATION_H_VERSION` | `Configuration.h` | identifica il formato atteso del file |
| `CONFIGURATION_ADV_H_VERSION` | `Configuration_adv.h` | identifica il formato delle opzioni avanzate |
| `STRING_CONFIG_H_AUTHOR` | `Configuration.h` | annota autore o variante della configurazione |
| `CUSTOM_MACHINE_NAME` | `Configuration.h` | nome macchina mostrato da UI e firmware |
| `CUSTOM_VERSION_FILE` | `Configuration.h` | usa un file versione personalizzato |

In Marlin 2.1.2.8 i due file distribuiti riportano il codice configurazione `02010206`. Il numero non va dedotto dal nome del tag e non va cambiato per silenziare un errore.

Verificare la build installata:

```gcode
M115
```

Approfondimento: [[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita|Introduzione a Marlin 2.1.2.8 e compatibilita]].

## Scheda e comunicazione

| Direttiva | File | Funzione |
|---|---|---|
| `MOTHERBOARD` | `Configuration.h` | seleziona motherboard, MCU e catena dei file pin |
| `SERIAL_PORT` | `Configuration.h` | porta host primaria |
| `BAUDRATE` | `Configuration.h` | velocita della porta primaria |
| `SERIAL_PORT_2` | `Configuration.h` | seconda interfaccia seriale |
| `BAUDRATE_2` | `Configuration.h` | velocita della seconda interfaccia |
| `SERIAL_PORT_3` | `Configuration.h` | terza interfaccia, se supportata |
| `BAUDRATE_3` | `Configuration.h` | velocita della terza interfaccia |
| `BAUD_RATE_GCODE` | `Configuration_adv.h` | consente modifica runtime del baud rate |
| `EMERGENCY_PARSER` | `Configuration_adv.h` | intercetta alcuni comandi urgenti nel flusso seriale |

La motherboard non e una semplice etichetta: determina pin, processore e ambienti PlatformIO.

Approfondimento: [[Stampante 3D/Marlin/Pagine/Scheda madre porte seriali e pin|Scheda madre porte seriali e pin]].

## Cinematica e geometria

| Direttiva | Funzione |
|---|---|
| `COREXY`, `COREXZ`, `COREYZ` | cinematiche Core e relative varianti |
| `DELTA` | cinematica Delta |
| `MORGAN_SCARA`, `MP_SCARA` | varianti SCARA |
| `POLARGRAPH` | cinematica a cavi |
| `X_BED_SIZE`, `Y_BED_SIZE` | dimensioni nominali del piatto |
| `X_MIN_POS`, `Y_MIN_POS`, `Z_MIN_POS` | coordinate minime |
| `X_MAX_POS`, `Y_MAX_POS`, `Z_MAX_POS` | coordinate massime |
| `BED_CENTER_AT_0_0` | origine XY al centro |
| `MIN_SOFTWARE_ENDSTOPS` | limiti software minimi |
| `MAX_SOFTWARE_ENDSTOPS` | limiti software massimi |

Per Delta e SCARA sono presenti ulteriori parametri geometrici specifici. Non trasferire valori cartesiani a una cinematica differente.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Tipo di stampante e cinematica|Tipo di stampante e cinematica]]
- [[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti|Dimensioni del piatto area di lavoro e limiti]]

## Motori e driver

Usare `X` come modello; le varianti si applicano agli altri assi e agli estrusori.

| Direttiva | File | Funzione |
|---|---|---|
| `X_DRIVER_TYPE` | `Configuration.h` | tipo di driver asse X |
| `E0_DRIVER_TYPE` | `Configuration.h` | tipo di driver estrusore 0 |
| `INVERT_X_DIR` | `Configuration.h` | inverte il verso X |
| `INVERT_E0_DIR` | `Configuration.h` | inverte il verso E0 |
| `X_ENABLE_ON` | `Configuration.h` | livello logico di enable |
| `DISABLE_X` | `Configuration.h` | disabilita X quando non richiesto |
| `DEFAULT_AXIS_STEPS_PER_UNIT` | `Configuration.h` | steps per unita predefiniti |
| `X_CURRENT` | `Configuration_adv.h` | corrente runtime/configurata per driver Trinamic |
| `X_MICROSTEPS` | `Configuration_adv.h` | microstepping Trinamic |
| `STEALTHCHOP_XY` | `Configuration_adv.h` | abilita stealthChop sul gruppo XY |
| `HYBRID_THRESHOLD` | `Configuration_adv.h` | cambio modalita in base alla velocita |
| `MONITOR_DRIVER_STATUS` | `Configuration_adv.h` | monitora errori dei driver compatibili |

G-code principali:

| G-code | Funzione | Persistenza con `M500` |
|---|---|---|
| `M92` | steps per unita | si |
| `M350` | microstepping supportato | dipende dall'hardware |
| `M569` | modalita Trinamic | si, quando previsto |
| `M906` | corrente Trinamic | si |
| `M913` | hybrid threshold | si |
| `M914` | sensibilita sensorless | si |
| `M122` | diagnostica Trinamic | report, non valore di taratura |

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro|Motori direzione e passi per millimetro]]
- [[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping|Driver stepper corrente e microstepping]]

## Endstop e homing

| Direttiva | Funzione |
|---|---|
| `USE_XMIN_PLUG`, `USE_XMAX_PLUG` | abilita il connettore endstop |
| `ENDSTOPPULLUPS` | pull-up globali |
| `ENDSTOPPULLDOWNS` | pull-down globali |
| `X_MIN_ENDSTOP_INVERTING` | inverte la logica elettrica dell'ingresso |
| `X_HOME_DIR` | lato verso cui avviene homing |
| `HOMING_FEEDRATE_MM_M` | velocita homing |
| `HOMING_BUMP_MM` | distanza di rilascio prima del secondo contatto |
| `HOMING_BUMP_DIVISOR` | riduzione velocita secondo contatto |
| `VALIDATE_HOMING_ENDSTOPS` | richiede un evento endstop valido |
| `ENDSTOP_NOISE_THRESHOLD` | filtro contro impulsi brevi |
| `SENSORLESS_HOMING` | usa StallGuard per homing |
| `X_STALL_SENSITIVITY` | soglia sensorless X |

Verificare gli stati:

```gcode
M119
```

Approfondimento: [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing|Endstop homing e Sensorless Homing]].

## Pianificazione del movimento

| Direttiva | G-code runtime | Funzione |
|---|---|---|
| `DEFAULT_MAX_FEEDRATE` | `M203` | velocita massima per asse |
| `DEFAULT_MAX_ACCELERATION` | `M201` | accelerazione massima per asse |
| `DEFAULT_ACCELERATION` | `M204 P` | accelerazione di stampa |
| `DEFAULT_RETRACT_ACCELERATION` | `M204 R` | accelerazione retrazione |
| `DEFAULT_TRAVEL_ACCELERATION` | `M204 T` | accelerazione travel |
| `CLASSIC_JERK` | seleziona interpretazione `M205` | abilita Classic Jerk |
| `DEFAULT_XJERK` e varianti | `M205 X...` | soglia Classic Jerk |
| `JUNCTION_DEVIATION_MM` | `M205 J...` | Junction Deviation |
| `S_CURVE_ACCELERATION` | nessun semplice default runtime | profilo accelerazione |
| `MINIMUM_PLANNER_SPEED` | nessuno comune | velocita minima del planner |

`CLASSIC_JERK` e Junction Deviation sono modelli alternativi. Leggere la build prima di interpretare `M205`.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Velocita accelerazioni Jerk e Junction Deviation|Velocita accelerazioni Jerk e Junction Deviation]]
- [[Stampante 3D/Marlin/Pagine/Segmentazione curve e precisione dei movimenti|Segmentazione curve e precisione dei movimenti]]

## Sensori e heater

| Direttiva | Funzione |
|---|---|
| `TEMP_SENSOR_0` | tipo sensore hotend 0 |
| `TEMP_SENSOR_BED` | tipo sensore piatto |
| `TEMP_SENSOR_CHAMBER` | tipo sensore camera |
| `HEATER_0_MINTEMP`, `HEATER_0_MAXTEMP` | limiti lettura hotend |
| `BED_MINTEMP`, `BED_MAXTEMP` | limiti lettura piatto |
| `PREHEAT_1_TEMP_HOTEND`, `PREHEAT_1_TEMP_BED` | preset UI |
| `THERMAL_PROTECTION_HOTENDS` | protezione hotend |
| `THERMAL_PROTECTION_BED` | protezione piatto |
| `WATCH_TEMP_PERIOD`, `WATCH_TEMP_INCREASE` | controllo salita hotend |
| `WATCH_BED_TEMP_PERIOD`, `WATCH_BED_TEMP_INCREASE` | controllo salita piatto |

Il numero di `TEMP_SENSOR_*` seleziona una tabella o un tipo di interfaccia, non una temperatura.

Leggere temperature e target:

```gcode
M105
```

Approfondimento: [[Stampante 3D/Marlin/Pagine/Sensori di temperatura e limiti operativi|Sensori di temperatura e limiti operativi]].

## Controllo termico

| Direttiva | G-code | Funzione |
|---|---|---|
| `PIDTEMP` | `M301`, `M303` | PID hotend |
| `MPCTEMP` | `M306` | Model Predictive Control hotend |
| `PIDTEMPBED` | `M304`, `M303 E-1` | PID piatto |
| `BANG_MAX` | nessuno comune | limite potenza bang-bang |
| `PID_MAX` | nessuno comune | limite potenza PID hotend |
| `MAX_BED_POWER` | nessuno comune | potenza massima piatto |
| `PID_PARAMS_PER_HOTEND` | `M301 E...` | coefficienti distinti per hotend |

`PIDTEMP` e `MPCTEMP` non vanno usati insieme per lo stesso hotend.

Approfondimento: [[Stampante 3D/Marlin/Pagine/Controllo PID MPC e protezioni termiche|Controllo PID MPC e protezioni termiche]].

## Ventole

| Direttiva | Funzione |
|---|---|
| `FAN_SOFT_PWM` | PWM software per ventole |
| `SOFT_PWM_SCALE` | scala/frequenza del PWM software |
| `E0_AUTO_FAN_PIN` | uscita ventola automatica hotend E0 |
| `EXTRUDER_AUTO_FAN_TEMPERATURE` | soglia ventola automatica |
| `EXTRUDER_AUTO_FAN_SPEED` | velocita ventola automatica |
| `USE_CONTROLLER_FAN` | ventola elettronica |
| `CONTROLLER_FAN_PIN` | uscita controller fan |
| `CONTROLLERFAN_SPEED_ACTIVE` | velocita durante attivita |
| `CONTROLLERFAN_SPEED_IDLE` | velocita in idle |
| `E0_FAN_TACHO_PIN` e varianti | ingressi tachimetrici delle ventole hotend |

Comando ventola pezzo:

```gcode
M106 S<0_255>
```

Spegnimento:

```gcode
M107
```

Approfondimento: [[Stampante 3D/Marlin/Pagine/Ventole e raffreddamento|Ventole e raffreddamento]].

## Estrusori e sicurezza di estrusione

| Direttiva | Funzione |
|---|---|
| `EXTRUDERS` | numero di estrusori logici |
| `HOTENDS` | derivato/configurato in base all'architettura |
| `DEFAULT_NOMINAL_FILAMENT_DIA` | diametro nominale |
| `SINGLENOZZLE` | piu estrusori su un solo nozzle |
| `DISTINCT_E_FACTORS` | parametri movimento distinti per E |
| `PREVENT_COLD_EXTRUSION` | blocca estrusione a freddo |
| `EXTRUDE_MINTEMP` | temperatura minima di estrusione |
| `PREVENT_LENGTHY_EXTRUDE` | limita estrusioni singole eccessive |
| `EXTRUDE_MAXLENGTH` | lunghezza massima del comando |
| `FWRETRACT` | retrazione gestita dal firmware |
| `LIN_ADVANCE` | controllo pressione nel nozzle |
| `ADVANCE_K` | K predefinito |

G-code:

| G-code | Funzione |
|---|---|
| `M200` | modalita volumetrica e diametro |
| `M207`, `M208`, `M209` | retrazione firmware |
| `M221` | flow percentuale |
| `M302` | soglia cold extrusion |
| `M900` | fattore Linear Advance |

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Hotend estrusori e filamento|Hotend estrusori e filamento]]
- [[Stampante 3D/Marlin/Pagine/Limiti di estrusione retrazione e cambio utensile|Limiti di estrusione retrazione e cambio utensile]]

## Probe

| Direttiva | Funzione |
|---|---|
| `FIX_MOUNTED_PROBE` | probe fisso |
| `BLTOUCH` | famiglia BLTouch compatibile |
| `Z_PROBE_SERVO_NR` | probe azionato da servo |
| `USE_PROBE_FOR_Z_HOMING` | usa il probe per homing Z |
| `Z_MIN_PROBE_USES_Z_MIN_ENDSTOP_PIN` | condivide ingresso Z-min |
| `NOZZLE_TO_PROBE_OFFSET` | offset XYZ nozzle-probe |
| `PROBING_MARGIN` | margine dal bordo |
| `XY_PROBE_FEEDRATE` | velocita spostamenti XY di probing |
| `Z_PROBE_FEEDRATE_FAST` | prima misura Z |
| `Z_PROBE_FEEDRATE_SLOW` | misura lenta |
| `MULTIPLE_PROBING` | misure ripetute |
| `EXTRA_PROBING` | misure aggiuntive scartabili |
| `Z_MIN_PROBE_REPEATABILITY_TEST` | abilita `M48` |

G-code:

| G-code | Funzione |
|---|---|
| `M401`, `M402` | deploy e stow |
| `G30` | singola misura |
| `M48` | test ripetibilita |
| `M851` | offset probe |

Approfondimento: [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch|Probe Z offset e BLTouch]].

## Livellamento e asse Z

Abilitare un solo metodo principale:

| Direttiva | Metodo |
|---|---|
| `MESH_BED_LEVELING` | mesh manuale |
| `AUTO_BED_LEVELING_3POINT` | piano da tre punti |
| `AUTO_BED_LEVELING_LINEAR` | piano da griglia |
| `AUTO_BED_LEVELING_BILINEAR` | mesh bilineare |
| `AUTO_BED_LEVELING_UBL` | Unified Bed Leveling |

Opzioni collegate:

| Direttiva | Funzione |
|---|---|
| `GRID_MAX_POINTS_X` | densita griglia |
| `RESTORE_LEVELING_AFTER_G28` | ripristina lo stato dopo homing |
| `ENABLE_LEVELING_FADE_HEIGHT` | attenua la compensazione lungo Z |
| `Z_SAFE_HOMING` | homing Z in posizione raggiungibile dal probe |
| `Z2_DRIVER_TYPE`, `Z3_DRIVER_TYPE`, `Z4_DRIVER_TYPE` | abilita driver Z aggiuntivi |
| `Z_STEPPER_AUTO_ALIGN` | allineamento automatico multi-Z |
| `ASSISTED_TRAMMING` | assistente regolazione viti |

G-code:

| G-code | Funzione |
|---|---|
| `G28` | homing |
| `G29` | comportamento dipendente dal metodo |
| `M420` | stato, attivazione e parametri leveling |
| `G34` | allineamento Z |
| `G35` | tramming assistito |

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Tipi di bed leveling e configurazione della mesh|Tipi di bed leveling e configurazione della mesh]]
- [[Stampante 3D/Marlin/Pagine/Z Safe Homing e allineamento degli assi Z|Z Safe Homing e allineamento degli assi Z]]

## Compensazioni del movimento

| Direttiva | G-code | Funzione |
|---|---|---|
| `LIN_ADVANCE` | `M900` | pressione nel nozzle |
| `INPUT_SHAPING_X` | `M593 X...` | ZV Input Shaping X |
| `INPUT_SHAPING_Y` | `M593 Y...` | ZV Input Shaping Y |
| `SHAPING_FREQ_X`, `SHAPING_FREQ_Y` | `M593 F...` | frequenza risonante |
| `SHAPING_ZETA_X`, `SHAPING_ZETA_Y` | `M593 D...` | smorzamento |
| `SKEW_CORRECTION` | `M852` se abilitato | errore angolare stabile |
| `BACKLASH_COMPENSATION` | `M425` | gioco misurato |
| `BABYSTEPPING` | `M290` | microregolazione senza aggiornare posizione logica |

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Linear Advance Input Shaping e compensazioni geometriche|Linear Advance Input Shaping e compensazioni geometriche]]
- [[Stampante 3D/Marlin/Pagine/Babystepping e regolazioni dinamiche|Babystepping e regolazioni dinamiche]]

## Display e interfaccia

| Direttiva | Funzione |
|---|---|
| `LCD_LANGUAGE` | lingua predefinita |
| `DISPLAY_CHARSET_HD44780` | charset display caratteri |
| direttiva specifica del controller | seleziona un solo display principale |
| `ENCODER_PULSES_PER_STEP` | impulsi encoder per step |
| `ENCODER_STEPS_PER_MENU_ITEM` | step per voce menu |
| `REVERSE_ENCODER_DIRECTION` | verso navigazione |
| `INDIVIDUAL_AXIS_HOMING_MENU` | homing separato da menu |
| `SPEAKER` | feedback con frequenze |
| `LCD_FEEDBACK_FREQUENCY_DURATION_MS` | durata feedback |
| `LCD_FEEDBACK_FREQUENCY_HZ` | frequenza feedback |

Una TFT puo usare una UI compilata in Marlin, emulare un display oppure inviare G-code come host. La direttiva dipende dall'architettura scelta.

Approfondimenti:

- [[Stampante 3D/Marlin/Pagine/Display controller encoder e touchscreen|Display controller encoder e touchscreen]]
- [[Stampante 3D/Marlin/Pagine/Lingua menu e feedback acustico|Lingua menu e feedback acustico]]

## EEPROM, SD ed esportazione

| Direttiva | Funzione |
|---|---|
| `EEPROM_SETTINGS` | abilita persistenza con `M500` e `M501` |
| `EEPROM_AUTO_INIT` | inizializza dati non validi secondo la logica prevista |
| `EEPROM_CHITCHAT` | messaggi sulle operazioni EEPROM |
| `DISABLE_M503` | rimuove il report per risparmiare memoria |
| `SDSUPPORT` | supporto SD |
| `SDCARD_CONNECTION` | posizione/interfaccia dello slot |
| `SD_CHECK_AND_RETRY` | ritenta operazioni SD |
| `CONFIGURATION_EMBEDDING` | incorpora la configurazione, se supportato |
| `CONFIG_EXPORT` | esporta JSON, `config.ini` o schema durante la build |

Comandi EEPROM:

```gcode
M500
```

```gcode
M501
```

```gcode
M502
```

```gcode
M503
```

```gcode
M504
```

Approfondimento: [[Stampante 3D/Marlin/Pagine/EEPROM scheda SD e salvataggio delle impostazioni|EEPROM scheda SD e salvataggio delle impostazioni]].

## Sensore filamento e pausa

| Direttiva | Funzione |
|---|---|
| `FILAMENT_RUNOUT_SENSOR` | abilita il sensore |
| `NUM_RUNOUT_SENSORS` | numero sensori |
| `FIL_RUNOUT_STATE` | stato elettrico di runout |
| `FIL_RUNOUT_PULLUP` | pull-up ingresso |
| `FILAMENT_RUNOUT_DISTANCE_MM` | distanza di conferma per motion sensor |
| `FILAMENT_MOTION_SENSOR` | rilevamento movimento |
| `ADVANCED_PAUSE_FEATURE` | procedura cambio e pausa |
| `NOZZLE_PARK_FEATURE` | parcheggio testina |

G-code:

| G-code | Funzione |
|---|---|
| `M412` | stato e distanza runout |
| `M600` | cambio filamento |
| `M603` | parametri load/unload |
| `M701`, `M702` | carico e scarico |

Approfondimento: [[Stampante 3D/Marlin/Pagine/Sensore di fine filamento e recupero dopo perdita di alimentazione|Sensore di fine filamento e recupero dopo perdita di alimentazione]].

## Alimentazione e accessori

| Direttiva | Funzione |
|---|---|
| `PSU_CONTROL` | controllo alimentatore |
| `PSU_ACTIVE_STATE` | livello attivo |
| `POWER_OFF_DELAY` | ritardo spegnimento |
| `POWER_LOSS_RECOVERY` | salvataggio stato stampa |
| `CASE_LIGHT_ENABLE` | luce macchina |
| `CASE_LIGHT_USE_NEOPIXEL` | usa NeoPixel per case light |
| `NEOPIXEL_LED` | supporto striscia compatibile |
| `NUM_SERVOS` | numero canali servo |
| `SERVO_DELAY` | attesa movimento servo |

G-code:

| G-code | Funzione |
|---|---|
| `M80`, `M81` | alimentatore on/off |
| `M413` | power-loss recovery |
| `M355` | case light |
| `M150` | LED colore |
| `M280` | servo |
| `M300` | tono |

Approfondimento: [[Stampante 3D/Marlin/Pagine/Alimentatore rele LED luci buzzer e servo|Alimentatore rele LED luci buzzer e servo]].

## Buffer, memoria e precisione

| Direttiva | Risorsa o effetto |
|---|---|
| `BLOCK_BUFFER_SIZE` | mosse nel planner |
| `BUFSIZE` | righe G-code ricevute |
| `MAX_CMD_SIZE` | lunghezza massima riga |
| `TX_BUFFER_SIZE` | buffer trasmissione host |
| `RX_BUFFER_SIZE` | buffer ricezione host |
| `MIN_STEPS_PER_SEGMENT` | segmenti troppo piccoli |
| `DEFAULT_MINSEGMENTTIME` | tempo minimo dei segmenti |
| `ARC_SUPPORT` | supporto G2/G3 |
| `MIN_ARC_SEGMENT_MM` | lunghezza minima del segmento |
| `MAX_ARC_SEGMENT_MM` | lunghezza massima del segmento |
| `ARC_SEGMENTS_PER_SEC` | segmentazione dipendente dal feedrate, se abilitata |

Aumentare buffer non e sempre un miglioramento: consuma RAM e puo interagire con display, mesh e Input Shaping.

Approfondimento: [[Stampante 3D/Marlin/Pagine/Segmentazione curve e precisione dei movimenti|Segmentazione curve e precisione dei movimenti]].

## G-code di ispezione essenziali

| G-code | Domanda a cui risponde |
|---|---|
| `M115` | quale firmware e quali capacita rispondono? |
| `M503` | quali parametri runtime sono attivi? |
| `M504` | i dati EEPROM sono validi? |
| `M105` | quali temperature e target sono letti? |
| `M114` | quale posizione crede di avere Marlin? |
| `M119` | quali endstop e probe sono attivi? |
| `M122` | i driver Trinamic comunicano e riportano errori? |
| `M420 V` | quale leveling o mesh e attivo? |
| `M851` | quali offset probe sono impostati? |
| `M900` | quale fattore Linear Advance e attivo? |
| `M593` | quali parametri Input Shaping sono attivi? |

Inviare un comando alla volta e conservare la risposta completa.

Approfondimento: [[Stampante 3D/Marlin/Pagine/G-code per configurazione e diagnostica|G-code per configurazione e diagnostica]].

## Errori comuni

- Confondere una macro commentata con una macro impostata su `false`.
- Copiare direttive da `bugfix` o 2.1.3 nella 2.1.2.8.
- Modificare un valore compilato e dimenticare che la EEPROM conserva quello precedente.
- Abilitare piu display o metodi di leveling incompatibili.
- Interpretare un array senza considerare assi ed estrusori attivi.
- Copiare pin da una revisione differente della motherboard.
- Usare un G-code senza compilare la funzione richiesta.
- Trattare un valore di esempio come raccomandazione universale.
- Cambiare sotto-opzioni senza abilitare la funzione principale.
- Aggirare `SanityCheck` invece di correggere la dipendenza.

## Metodo di consultazione

Quando si incontra una direttiva:

1. cercarla nel file 2.1.2.8;
2. leggere tutto il commento e il blocco `#if`;
3. identificare hardware e pin coinvolti;
4. cercare il G-code runtime;
5. verificare se il valore e persistente;
6. leggere la nota specialistica;
7. provare con la procedura di taratura;
8. registrare la decisione.

## Riferimenti

- [Configuration.h 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Marlin Configuration Reference](https://marlinfw.org/docs/configuration/configuration.html)
- [G-code Index](https://marlinfw.org/meta/gcode/)
- [M503 - Report Settings](https://marlinfw.org/docs/gcode/M503.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin|Struttura dei file di configurazione Marlin]]
- [[Stampante 3D/Marlin/Pagine/Migrazione della configurazione tra versioni|Migrazione della configurazione tra versioni]]
- [[Stampante 3D/Marlin/Pagine/Procedura completa di taratura e verifica|Procedura completa di taratura e verifica]]
