---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: technical-note
status: "non revisionato"
difficulty: avanzato
tags: [marlin, z-safe-homing, g34, z-stepper, gantry-alignment]
aliases: [Z Safe Homing Marlin, G34 Marlin, Allineamento Z Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch]]"
  - "[[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing]]"
  - "[[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Tipi di bed leveling e configurazione della mesh]]"
  - "[[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti]]"
marlin-version: "2.1.2.8"
---

# Z Safe Homing e allineamento degli assi Z

## Sintesi

`Z_SAFE_HOMING` porta la probe in un punto XY sicuro prima di cercare il riferimento Z. L'allineamento multi-Z corregge invece la differenza fisica tra viti o motori Z indipendenti.

Sono problemi distinti:

| Funzione | Cosa stabilisce o corregge |
|---|---|
| `G28 Z` | il riferimento della coordinata Z |
| `Z_SAFE_HOMING` | il punto XY in cui eseguire `G28 Z` |
| `Z_MULTI_ENDSTOPS` | l'allineamento durante homing tramite endstop separati |
| `G34` con `Z_STEPPER_AUTO_ALIGN` | l'allineamento tramite probe e driver Z indipendenti |
| `G35` | la regolazione manuale delle viti del piatto |
| `G29` | il piano o la mesh di compensazione |

Nessuna di queste funzioni rende automaticamente il telaio ortogonale o elimina giochi, viti piegate e accoppiatori difettosi.

## Quando usarlo

- Quando la probe usata per l'homing Z e spostata rispetto all'ugello.
- Quando un normale `G28 Z` potrebbe portare la sonda fuori dal piatto.
- Quando due o piu motori Z perdono l'allineamento a motori disabilitati.
- Quando ogni motore Z dispone di un driver indipendente.
- Quando si vuole allineare il gantry al piano prima di creare la mesh.

## `Z_SAFE_HOMING`

In `Configuration.h`:

```cpp
//#define Z_SAFE_HOMING
```

Con la funzione attiva, Marlin:

1. richiede coordinate XY note e affidabili;
2. sposta la probe o l'ugello nel punto configurato;
3. esegue l'homing Z in quella posizione.

I punti predefiniti sono il centro:

```cpp
#define Z_SAFE_HOMING_X_POINT X_CENTER
#define Z_SAFE_HOMING_Y_POINT Y_CENTER
```

Il punto deve:

- essere raggiungibile dalla probe considerando `NOZZLE_TO_PROBE_OFFSET`;
- lasciare l'ugello entro la corsa fisica;
- trovarsi su una superficie sensibile;
- evitare fori, clip, viti e zone mobili;
- consentire deploy e stow.

Il centro geometrico non e obbligatorio. Su piani sagomati o con ostacoli va scelto un punto differente.

## Perche XY deve essere noto

Con una probe decentrata, Marlin deve conoscere la posizione del carrello per portare il sensore sopra il piatto. Se X e Y non sono stati referenziati, uno spostamento verso il punto sicuro potrebbe superare i limiti.

Sequenza completa:

```gcode
G28
```

Solo homing X e Y:

```gcode
G28 X Y
```

Poi homing Z:

```gcode
G28 Z
```

Se i driver sono stati disabilitati e gli assi possono essere stati spostati, le coordinate XY non sono piu affidabili. La release segnala che puo essere necessario ripetere l'homing XY prima di Z.

## Altezza di sicurezza

Prima degli spostamenti di homing:

```cpp
//#define Z_HOMING_HEIGHT 4
```

Dopo l'homing:

```cpp
//#define Z_AFTER_HOMING 10
```

`Z_HOMING_HEIGHT` aiuta a superare clip e irregolarita, ma non conosce magicamente la quota reale prima del riferimento. Se Z e gia vicino al massimo, un sollevamento aggiuntivo puo causare grinding. Il valore deve essere compatibile con corsa, cinematica e posizione di avvio.

## Prima prova sicura

Prima di usare `Z_SAFE_HOMING`:

1. verificare X e Y separatamente;
2. controllare la probe con `M119`;
3. provare deploy e stow lontano dal piano;
4. misurare gli offset XY;
5. simulare manualmente il trigger durante una discesa Z;
6. verificare che il punto sicuro sia raggiungibile.

Controllare gli endstop:

```gcode
M119
```

Eseguire X e Y:

```gcode
G28 X Y
```

Avviare Z sorvegliando il movimento:

```gcode
G28 Z
```

La probe deve trovarsi sopra il punto previsto prima che inizi la discesa.

## Architetture con piu motori Z

### Motori sullo stesso driver

Due motori collegati allo stesso driver ricevono sempre gli stessi impulsi. Marlin non puo muoverli separatamente e quindi non puo correggere elettronicamente la differenza tra i lati con `G34`.

Possibili conseguenze:

- correnti suddivise tra i motori;
- un lato che perde passi;
- gantry che si inclina quando i motori vengono disabilitati;
- riallineamento manuale periodico.

Una sincronizzazione meccanica a cinghia puo ridurre la deriva, ma rende i motori solidali e resta incompatibile con correzioni indipendenti.

### Driver Z indipendenti

In `Configuration.h` si dichiarano driver aggiuntivi:

```cpp
#define Z_DRIVER_TYPE A4988
//#define Z2_DRIVER_TYPE A4988
//#define Z3_DRIVER_TYPE A4988
//#define Z4_DRIVER_TYPE A4988
```

Ogni motore richiede:

- un'uscita driver realmente disponibile;
- pin `STEP`, `DIR` ed `ENABLE` compatibili;
- corrente configurata correttamente;
- direzione verificata singolarmente;
- meccanica che permetta il movimento indipendente.

Se un motore aggiuntivo gira al contrario rispetto a Z:

```cpp
//#define INVERT_Z2_VS_Z_DIR
```

Sono disponibili opzioni analoghe per Z3 e Z4. Non vanno usate per correggere un ordine dei motori non documentato.

## Due strategie di allineamento

### Endstop indipendenti

```cpp
//#define Z_MULTI_ENDSTOPS
```

Ogni asse Z aggiuntivo usa un finecorsa:

```cpp
#define Z2_USE_ENDSTOP _XMAX_
#define Z2_ENDSTOP_ADJUSTMENT 0
```

Durante `G28`, Marlin puo arrestare separatamente i motori e allinearli ai riferimenti fisici. Gli offset runtime sono gestibili con `M666` quando la configurazione lo supporta.

Questo approccio:

- non richiede una probe per l'allineamento;
- ripete un riferimento meccanico definito dagli endstop;
- richiede cablaggio e regolazione di ogni sensore;
- allinea agli endstop, non direttamente alla superficie del piano.

La configurazione dettagliata dei segnali e trattata nella nota sugli endstop.

### Auto-allineamento tramite probe

In `Configuration_adv.h`:

```cpp
//#define Z_STEPPER_AUTO_ALIGN
```

Questa funzione aggiunge `G34`. Marlin misura un punto associato a ogni motore Z e applica correzioni indipendenti finche le altezze convergono.

Requisiti:

- almeno due driver Z indipendenti;
- una probe gia affidabile;
- punti di misura raggiungibili;
- ordine Z1, Z2, Z3 e Z4 noto;
- gantry o piano liberi di correggersi senza vincoli meccanici.

`G34` non funziona come previsto se piu motori condividono il driver o sono rigidamente sincronizzati.

## Punti di misura per `G34`

Definizione esplicita:

```cpp
//#define Z_STEPPER_ALIGN_XY { { 10, 190 }, { 100, 10 }, { 190, 190 } }
```

Serve un punto XY di probe per ogni motore. I punti sono espressi in coordinate macchina e non vengono spostati da `M206`.

Devono essere:

- vicini all'influenza meccanica del relativo motore;
- dentro l'area raggiungibile dalla probe;
- lontani da ostacoli;
- elencati nello stesso ordine dei driver.

Se i punti non sono definiti, Marlin usa limiti e orientamento per calcolarli. L'orientamento puo essere dichiarato con:

```cpp
//#define Z_STEPPERS_ORIENTATION 0
```

Il numero rappresenta una delle disposizioni documentate nel commento della release. Non va scelto per tentativi: un ordine errato puo far correggere il lato sbagliato.

## Posizione reale delle viti Z

Con tre o quattro motori e possibile dichiarare anche le coordinate dei motori:

```cpp
//#define Z_STEPPER_ALIGN_STEPPER_XY { { 210.7, 102.5 }, { 152.6, 220.0 }, { 94.5, 102.5 } }
```

Marlin usa queste posizioni per calcolare meglio come una misura si traduce nella correzione della vite, accelerando la convergenza.

Se le posizioni reali non sono disponibili, usa:

```cpp
#define Z_STEPPER_ALIGN_AMP 1.0
```

Un valore maggiore di `1.0` amplifica la correzione quando vite e punto misurato non coincidono, ma il sorgente avverte che puo rendere il sistema instabile. Non e un parametro da aumentare per nascondere punti XY errati.

## Limiti e convergenza

```cpp
#define G34_MAX_GRADE 5
#define Z_STEPPER_ALIGN_ITERATIONS 5
#define Z_STEPPER_ALIGN_ACC 0.02
```

- `G34_MAX_GRADE` limita l'inclinazione massima che la procedura tentera di correggere;
- `Z_STEPPER_ALIGN_ITERATIONS` limita i cicli;
- `Z_STEPPER_ALIGN_ACC` arresta prima la procedura quando l'errore e sufficientemente piccolo.

Un errore superiore al limite non va risolto alzando subito `G34_MAX_GRADE`. Prima occorre allineare manualmente il sistema e verificare che i motori siano associati ai punti corretti.

## Stato del leveling dopo `G34`

```cpp
#define RESTORE_LEVELING_AFTER_G34
```

ripristina lo stato del leveling dopo l'allineamento.

```cpp
#define HOME_AFTER_G34
```

esegue nuovamente l'homing Z. La release indica che il nuovo riferimento puo essere piu preciso rispetto al calcolo basato sulle ultime letture, soprattutto con un piano irregolare.

L'ordine logico consigliato e:

1. homing;
2. allineamento fisico Z con `G34`;
3. nuovo homing Z, se configurato o necessario;
4. creazione o attivazione della mesh.

Una mesh misurata prima di spostare indipendentemente i motori Z puo non rappresentare piu la geometria corrente.

## Uso di `G34`

Eseguire prima l'homing:

```gcode
G28
```

Avviare l'allineamento con i default compilati:

```gcode
G34
```

Esempio con cinque iterazioni e accuratezza target di 0,02 mm:

```gcode
G34 I5 T0.02
```

Il parametro `A` modifica l'amplificazione a runtime nell'intervallo supportato:

```gcode
G34 A1.0
```

`G34 R` ricalcola i punti in base agli offset correnti della probe:

```gcode
G34 R
```

I parametri di lock e unlock dei singoli motori sono funzioni diagnostiche avanzate. Non vanno usati durante una stampa o senza conoscere l'associazione fisica dei driver.

## Regolazione runtime dei punti con `M422`

Impostare il punto di probing del motore Z1:

```gcode
M422 S1 X10 Y10
```

Impostare il punto di Z2:

```gcode
M422 S2 X190 Y10
```

Ripristinare i default compilati:

```gcode
M422 R
```

Con `Z_STEPPER_ALIGN_STEPPER_XY`, il parametro `W` modifica la posizione nota della vite:

```gcode
M422 W2 X190 Y10
```

I punti runtime devono essere provati con cautela e salvati solo dopo avere verificato l'ordine dei motori.

## Tramming assistito con `G35`

`G35` non muove indipendentemente i motori Z. Misura i punti vicino alle viti del piatto e indica come ruotarle manualmente.

Abilitazione:

```cpp
//#define ASSISTED_TRAMMING
```

Punti di esempio:

```cpp
#define TRAMMING_POINT_XY { { 20, 20 }, { 180, 20 }, { 180, 180 }, { 20, 180 } }
```

Tipo di vite M3 destrorsa:

```cpp
#define TRAMMING_SCREW_THREAD 30
```

Avvio:

```gcode
G35
```

La filettatura deve essere corretta, altrimenti le indicazioni orarie e antiorarie risultano invertite. `G35` aiuta a rendere il piatto parallelo; `G34` allinea gli azionamenti Z; `G29` misura la deviazione residua.

## Procedura completa

1. Mettere manualmente gantry e piatto in una condizione vicina all'allineamento.
2. Verificare che tutti i motori Z muovano nella stessa direzione.
3. Verificare corrente e liberta delle viti.
4. Controllare endstop e probe con `M119`.
5. Eseguire separatamente l'homing X e Y.
6. Provare `Z_SAFE_HOMING` con la testina lontana dal piatto.
7. Verificare che ogni punto `G34` corrisponda al motore previsto.
8. Avviare `G34` con parametri conservativi.
9. Controllare che l'errore diminuisca a ogni iterazione.
10. Ripetere l'homing Z.
11. Creare una nuova mesh.
12. Validare il primo layer.
13. Spegnere e riaccendere per verificare la ripetibilita del flusso.

## Errori comuni

### Il punto sicuro porta la probe fuori dal piatto

- **Causa:** coordinate, offset XY o area di lavoro incoerenti.
- **Correzione:** verificare la posizione fisica della probe, non soltanto quella dell'ugello.

### `G28 Z` viene rifiutato

- **Causa:** con `Z_SAFE_HOMING`, X e Y non sono in uno stato noto.
- **Correzione:** eseguire prima `G28 X Y` e verificare che i motori non siano stati disabilitati o mossi.

### `G34` inclina ulteriormente il gantry

- **Causa:** ordine dei motori, punti XY o direzioni errati.
- **Correzione:** interrompere, riallineare manualmente e verificare un driver alla volta.

### `G34` non cambia la differenza tra i lati

- **Causa:** motori sullo stesso driver, accoppiamento meccanico, perdita di passi o associazione errata.
- **Correzione:** verificare che i motori possano realmente essere comandati in modo indipendente.

### `G34` non converge

- **Causa:** probe rumorosa, piano mobile, gioco, punti troppo lontani dalle viti o amplificazione eccessiva.
- **Correzione:** misurare la ripetibilita, ridurre `A`, correggere i punti e controllare la meccanica.

### Dopo `G34` la vecchia mesh peggiora il primo layer

- **Causa:** l'allineamento ha cambiato il rapporto tra gantry e piano.
- **Correzione:** rifare `G29` o caricare soltanto una mesh generata nella stessa geometria.

### I lati si disallineano dopo lo spegnimento

- **Causa:** gravita, motori che rilasciano in tempi differenti o movimento manuale.
- **Correzione:** eseguire l'allineamento a ogni avvio, migliorare la sincronizzazione meccanica o impedire il movimento a motori spenti.

## Checklist

- [ ] Il punto `Z_SAFE_HOMING` e raggiungibile dalla probe.
- [ ] X e Y sono referenziati prima di `G28 Z`.
- [ ] `Z_HOMING_HEIGHT` non puo causare collisioni a Z-max.
- [ ] Ogni motore Z dispone del driver previsto.
- [ ] Tutti i motori Z muovono nello stesso verso.
- [ ] Corrente e passi per millimetro sono coerenti.
- [ ] I motori possono muoversi indipendentemente.
- [ ] L'ordine Z1-Z4 e documentato.
- [ ] I punti `Z_STEPPER_ALIGN_XY` corrispondono ai motori.
- [ ] La probe e ripetibile nei punti usati da `G34`.
- [ ] L'errore diminuisce durante le iterazioni.
- [ ] Il leveling viene ricreato dopo l'allineamento.
- [ ] Il flusso resta ripetibile dopo disabilitazione e riavvio.

## Riferimenti

- [Marlin 2.1.2.8 - Configuration.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Marlin 2.1.2.8 - Configuration_adv.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Marlin - G28 Auto Home](https://marlinfw.org/docs/gcode/G028.html)
- [Marlin - G34 Z Steppers Auto-Alignment](https://marlinfw.org/docs/gcode/G034-zsaa.html)
- [Marlin - M422 Set Z Motor XY](https://marlinfw.org/docs/gcode/M422.html)
- [Marlin - G35 Tramming Assistant](https://marlinfw.org/docs/gcode/G035.html)

## Collegamenti

- [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch]]
- [[Stampante 3D/Marlin/Pagine/Tipi di bed leveling e configurazione della mesh]]
- [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing]]
- [[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping]]
- [[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti]]
