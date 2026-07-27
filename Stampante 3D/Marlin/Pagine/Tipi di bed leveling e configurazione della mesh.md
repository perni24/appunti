---
date: 2026-07-26
area: Stampante 3D
topic: Marlin
type: technical-note

publish: true
difficulty: avanzato
tags: [marlin, bed-leveling, mesh, g29, m420, ubl]
aliases: [Bed leveling Marlin, Mesh Marlin, UBL Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch]]"
  - "[[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Z Safe Homing e allineamento degli assi Z]]"
  - "[[Stampante 3D/Marlin/Pagine/Babystepping e regolazioni dinamiche]]"
marlin-version: "2.1.2.8"
---

# Tipi di bed leveling e configurazione della mesh

## Sintesi

Il bed leveling di Marlin misura o descrive la distanza tra ugello e piano e modifica i movimenti Z per compensare inclinazione e irregolarita. Non muove le viti del piatto, non raddrizza il telaio e non elimina giochi o flessioni.

Occorre distinguere:

| Operazione | Risultato |
|---|---|
| tramming meccanico | rende il piano il piu possibile parallelo al sistema XY |
| allineamento dei motori Z | corregge la differenza tra lati del gantry o supporti del piano |
| probing | misura la superficie in punti definiti |
| mesh o piano matematico | rappresenta le correzioni da applicare |
| offset Z | stabilisce la distanza tra trigger della probe e punta dell'ugello |
| compensazione attiva | modifica i movimenti durante la stampa |

Una mesh non deve essere usata per nascondere un piatto fortemente inclinato o una struttura che cambia posizione tra una stampa e l'altra.

## Quando usarlo

- Per compensare una superficie non perfettamente piana.
- Per correggere una piccola inclinazione residua dopo il tramming.
- Per rendere uniforme il primo layer su un'area ampia.
- Per misurare manualmente un piano quando non e disponibile una probe.
- Per conservare una mappa stabile e riutilizzarla tra piu stampe.

## Metodi disponibili

In `Configuration.h` va abilitato un solo metodo:

```cpp
//#define AUTO_BED_LEVELING_3POINT
//#define AUTO_BED_LEVELING_LINEAR
//#define AUTO_BED_LEVELING_BILINEAR
//#define AUTO_BED_LEVELING_UBL
//#define MESH_BED_LEVELING
```

Il significato di `G29` cambia in base al metodo compilato. Una procedura scritta per Bilinear non puo essere applicata automaticamente a UBL.

| Metodo | Misura | Modello risultante | Uso tipico |
|---|---|---|---|
| 3-Point | tre punti non allineati | un piano inclinato | piano molto piatto |
| Linear | griglia di punti | un piano inclinato stimato dalla griglia | piano piatto con misura ridondante |
| Bilinear | griglia di punti | mesh interpolata localmente | piano ampio o irregolare |
| UBL | griglia automatica e modificabile | mesh persistente con strumenti di editing | configurazioni avanzate |
| MBL | griglia regolata manualmente | mesh manuale | macchina senza probe |

## 3-Point Leveling

```cpp
#define AUTO_BED_LEVELING_3POINT
```

Tre punti non collineari definiscono un piano. Marlin compensa l'inclinazione globale, ma non puo rappresentare avvallamenti o rigonfiamenti locali.

I punti possono essere definiti in `Configuration_adv.h`:

```cpp
//#define PROBE_PT_1_X 15
//#define PROBE_PT_1_Y 180
//#define PROBE_PT_2_X 15
//#define PROBE_PT_2_Y 20
//#define PROBE_PT_3_X 170
//#define PROBE_PT_3_Y 20
```

I punti devono:

- essere raggiungibili dalla probe;
- essere abbastanza distanti da descrivere il piano;
- non trovarsi sulla stessa linea;
- evitare clip, viti e bordi non sensibili.

Questo metodo e leggero, ma una misura errata influenza l'intero piano.

## Linear Bed Leveling

```cpp
#define AUTO_BED_LEVELING_LINEAR
```

Linear misura una griglia, ma riduce i dati a un unico piano inclinato. Piu punti rendono la stima del piano meno dipendente da una singola lettura, senza permettere correzioni locali.

```cpp
#define GRID_MAX_POINTS_X 3
#define GRID_MAX_POINTS_Y GRID_MAX_POINTS_X
```

E adatto quando il piano e fisicamente piatto ma puo essere leggermente inclinato. Non e la scelta corretta per compensare una superficie deformata.

## Bilinear Bed Leveling

```cpp
#define AUTO_BED_LEVELING_BILINEAR
```

Bilinear conserva le altezze della griglia. Durante il movimento calcola la correzione interpolando i quattro punti della cella che contiene la posizione XY corrente.

Vantaggi:

- rappresenta deformazioni locali;
- configurazione piu semplice di UBL;
- una normale esecuzione di `G29` ricrea la mesh completa.

Limiti:

- una griglia piu fitta aumenta tempi di probing, memoria e sensibilita a misure rumorose;
- al di fuori della griglia viene normalmente mantenuta la correzione del bordo piu vicino;
- una mesh obsoleta continua a essere coerente matematicamente, ma non con la macchina reale.

Per continuare la pendenza implicita fuori dalla griglia:

```cpp
//#define EXTRAPOLATE_BEYOND_GRID
```

Va usato solo quando il comportamento oltre il bordo e realmente prevedibile. L'estrapolazione puo amplificare un errore.

La suddivisione Catmull-Rom:

```cpp
//#define ABL_BILINEAR_SUBDIVISION
#define BILINEAR_SUBDIVISIONS 3
```

crea punti intermedi matematici. Non aggiunge misure reali e non recupera dettagli che la griglia non ha campionato.

## Unified Bed Leveling

```cpp
#define AUTO_BED_LEVELING_UBL
```

UBL aggiunge alla mesh:

- fasi separate di misura, riempimento e modifica;
- slot di salvataggio;
- visualizzazione della topologia;
- correzione manuale dei punti;
- strumenti di validazione.

Configurazione di base:

```cpp
#define MESH_INSET 1
#define GRID_MAX_POINTS_X 10
#define GRID_MAX_POINTS_Y GRID_MAX_POINTS_X
```

Nella release 2.1.2.8 UBL e limitato a un massimo implementativo di 15 punti per asse. Una griglia `10 x 10` contiene 100 punti: non e automaticamente piu accurata di una griglia piu piccola se probe e meccanica non sono ripetibili.

Per ridurre il percorso tra i punti:

```cpp
//#define UBL_HILBERT_CURVE
```

Per salvare automaticamente la mesh attiva durante `M500`:

```cpp
#define UBL_SAVE_ACTIVE_ON_M500
```

Con EEPROM abilitata, UBL puo usare:

```cpp
//#define OPTIMIZED_MESH_STORAGE
```

Questa opzione riduce la precisione memorizzata per risparmiare spazio. Va valutata in base alla memoria disponibile e alla risoluzione realmente utile.

## Mesh Bed Leveling manuale

```cpp
#define MESH_BED_LEVELING
```

MBL consente di costruire una mesh senza probe. L'ugello viene portato sui punti della griglia e l'utente regola manualmente Z con carta o spessimetro.

```cpp
#define MESH_INSET 10
#define GRID_MAX_POINTS_X 3
#define GRID_MAX_POINTS_Y GRID_MAX_POINTS_X
```

La release limita MBL a un massimo implementativo di 7 punti per asse. Il metodo e semplice, ma la precisione dipende dalla coerenza con cui viene percepito lo stesso attrito in ogni punto.

Per una procedura guidata:

```cpp
//#define LCD_BED_LEVELING
```

La regolazione minima del menu:

```cpp
#define MESH_EDIT_Z_STEP 0.025
```

Senza display, la procedura MBL usa stati espliciti.

Mostrare lo stato e la mesh esistente:

```gcode
G29 S0
```

Iniziare dal primo punto:

```gcode
G29 S1
```

Dopo avere regolato Z con carta o spessimetro, memorizzare il valore e passare al punto successivo:

```gcode
G29 S2
```

`G29 S2` va ripetuto fino al completamento, quindi la mesh va salvata con `M500`.

### `PROBE_MANUALLY` con i metodi ABL

`PROBE_MANUALLY` e un meccanismo differente da MBL. Permette di usare 3-Point, Linear o Bilinear senza una sonda elettronica:

```cpp
//#define PROBE_MANUALLY
```

In questo caso il semplice `G29` avvia la procedura e ogni nuovo `G29` registra il punto regolato e passa al successivo. `G29 Q` mostra lo stato e `G29 A` interrompe la procedura.

## Area della mesh

La griglia deve essere calcolata rispetto alla zona raggiungibile dalla **probe**, non solo dall'ugello.

Per Bilinear e Linear:

```cpp
#define GRID_MAX_POINTS_X 3
#define GRID_MAX_POINTS_Y GRID_MAX_POINTS_X
```

Per MBL e UBL:

```cpp
#define MESH_INSET 10
```

In `Configuration_adv.h`, MBL e UBL possono sovrascrivere i confini:

```cpp
//#define MESH_MIN_X MESH_INSET
//#define MESH_MIN_Y MESH_INSET
//#define MESH_MAX_X X_BED_SIZE - (MESH_INSET)
//#define MESH_MAX_Y Y_BED_SIZE - (MESH_INSET)
```

I confini devono essere coerenti con:

- `X_BED_SIZE` e `Y_BED_SIZE`;
- limiti reali di corsa;
- offset XY della probe;
- `PROBING_MARGIN`;
- forma del piano;
- clip e ostacoli.

Una griglia rettangolare puo usare densita X e Y differenti. La distanza tra i punti, non soltanto il loro numero, determina quali irregolarita possono essere rappresentate.

## Scegliere la densita

Una griglia piu fitta e utile quando:

- il piano ha deformazioni ripetibili su scala ridotta;
- la probe e sufficientemente precisa;
- la meccanica non cambia tra le letture;
- memoria e tempo di probing sono adeguati.

Una griglia piu fitta e controproducente quando:

- la dispersione della probe e simile alle variazioni che si vogliono misurare;
- il supporto del piano si muove;
- la superficie cambia con temperatura o montaggio;
- il probing e talmente lungo da introdurre deriva termica.

Prima di aumentare i punti, eseguire `M48` e confrontare la deviazione delle letture con l'entita delle correzioni osservate.

## Condizioni termiche

La mesh va creata nelle condizioni in cui verra utilizzata. Piatto, supporti, magneti e superfici rimovibili possono deformarsi durante il riscaldamento.

Per imporre il preriscaldamento:

```cpp
//#define PREHEAT_BEFORE_LEVELING
```

```cpp
#define LEVELING_NOZZLE_TEMP 120
#define LEVELING_BED_TEMP 50
```

I valori sono esempi del file base, non temperature universali. La punta dell'ugello deve essere pulita, soprattutto nel probing manuale o con nozzle probe.

## Creare una mesh Bilinear o un piano ABL

Prima eseguire l'homing:

```gcode
G28
```

Avviare il metodo compilato con i parametri predefiniti:

```gcode
G29
```

Mostrare matrice o mesh, se supportato:

```gcode
M420 V
```

Salvare i dati in EEPROM:

```gcode
M500
```

`G29` abilita normalmente la compensazione dopo una misura riuscita. Il primo test va sorvegliato e deve partire da un piano gia regolato meccanicamente.

## Procedura UBL essenziale

Eseguire l'homing:

```gcode
G28
```

Misurare automaticamente i punti raggiungibili:

```gcode
G29 P1
```

Riempire per estrapolazione i punti non raggiunti:

```gcode
G29 P3
```

`G29 P3` puo dover essere ripetuto per completare una mesh ampia.

Mostrare la topologia:

```gcode
G29 T
```

Salvare la mesh nello slot 0:

```gcode
G29 S0
```

Impostare il fade UBL a 10 mm:

```gcode
G29 F10
```

Attivare UBL:

```gcode
G29 A
```

Salvare le impostazioni generali:

```gcode
M500
```

`G29 P2` consente di misurare manualmente punti non raggiungibili con una MarlinUI e un encoder compatibili. `G29 P4` rifinisce punti esistenti. Senza un'interfaccia adatta e preferibile usare `G29 P3` e, per modifiche puntuali, `M421`.

## Attivazione e stato con `M420`

Disabilitare la compensazione:

```gcode
M420 S0
```

Abilitare una mesh valida:

```gcode
M420 S1
```

Visualizzare i dati:

```gcode
M420 V
```

Con UBL, caricare lo slot 0:

```gcode
M420 L0
```

Senza una mesh valida `M420 S1` non puo attivare il leveling.

Per impostazione predefinita `G28` disabilita il leveling. Le alternative compile-time sono:

```cpp
//#define RESTORE_LEVELING_AFTER_G28
//#define ENABLE_LEVELING_AFTER_G28
```

- `RESTORE_LEVELING_AFTER_G28` ripristina lo stato precedente;
- `ENABLE_LEVELING_AFTER_G28` lo abilita sempre dopo l'homing.

Il comportamento deve essere scelto intenzionalmente. Non e prudente affidarsi allo stato implicito senza verificarlo nello start G-code.

## Due strategie per lo start G-code

### Misurare prima di ogni stampa

```gcode
G28
```

```gcode
G29
```

Questa strategia usa dati freschi, ma aumenta tempi e usura. La semantica e adatta a 3-Point, Linear e Bilinear; UBL usa un flusso differente.

### Riutilizzare una mesh salvata

```gcode
G28
```

```gcode
M420 S1
```

Con UBL caricare esplicitamente lo slot desiderato prima dell'attivazione:

```gcode
M420 L0
```

```gcode
M420 S1
```

La mesh salvata va rigenerata dopo modifiche a probe, piano, supporto, ugello, offset, gantry o temperature di lavoro.

## Fade della compensazione

Per MBL, Bilinear e UBL:

```cpp
#define ENABLE_LEVELING_FADE_HEIGHT
#define DEFAULT_LEVELING_FADE_HEIGHT 10.0
```

Modifica runtime:

```gcode
M420 Z10
```

La correzione viene ridotta progressivamente fino alla quota indicata; sopra tale quota i movimenti seguono il piano meccanico della macchina. Con `Z0` il fade e disabilitato e la compensazione resta completa.

Il fade evita di trasferire per tutta l'altezza la forma del piatto, ma non corregge una struttura fuori squadra. Un fade troppo basso concentra la transizione nei primi layer.

## Segmentazione dei movimenti

Per le mesh:

```cpp
#define SEGMENT_LEVELED_MOVES
#define LEVELED_SEGMENT_LENGTH 5.0
```

Sulle cartesiane Marlin divide i movimenti lunghi in segmenti per seguire meglio il profilo interpolato. Segmenti piu corti aumentano il carico del planner; segmenti troppo lunghi possono approssimare male variazioni locali.

## Validazione della mesh

Per aggiungere `G26`:

```cpp
//#define G26_MESH_VALIDATION
```

`G26` stampa un pattern sui punti della mesh. E piu utile di una sola lettura numerica per individuare:

- offset Z globale errato;
- aree localmente troppo alte o basse;
- punti anomali;
- mesh non attiva;
- differenze tra misura a freddo e stampa a caldo.

Prima di `G26` verificare parametri di ugello, filamento e temperature. La procedura estrude materiale e non e un semplice comando diagnostico senza movimento.

## Diagnostica

Per compilare log dettagliati:

```cpp
//#define DEBUG_LEVELING_FEATURE
```

Attivare il debug leveling:

```gcode
M111 S32
```

La funzione consuma memoria flash e va usata soprattutto durante configurazione e troubleshooting.

Per ripetere automaticamente un `G29` fallito:

```cpp
//#define G29_RETRY_AND_RECOVER
```

```cpp
#define G29_MAX_RETRIES 3
#define G29_HALT_ON_FAILURE
```

Gli script di recupero del file di esempio includono movimenti e pulizia dell'ugello specifici. Non devono essere abilitati senza adattarli e verificarli sulla macchina reale.

## Errori comuni

### Confondere leveling e tramming

Una mesh puo compensare una pendenza, ma riduce la corsa utile Z e impone movimenti continui. Prima si corregge la meccanica, poi si misura la deviazione residua.

### Eseguire `G28` dopo `G29`

Per default `G28` disabilita il leveling. La sequenza ordinaria e homing prima, misura o attivazione dopo.

### Salvare ma non attivare

`M500` conserva i dati; non garantisce da solo che la compensazione sia attiva dopo ogni `G28`. Verificare con `M420`.

### Usare una mesh con offset modificato

Cambiare `M851 X/Y/Z` modifica il rapporto tra probe e ugello. La vecchia mesh non rappresenta piu lo stesso sistema geometrico.

### Aumentare la griglia per correggere rumore

Piu punti possono produrre una mappa piu dettagliata del rumore, non del piatto. Prima va misurata la ripetibilita.

### Resettare la EEPROM senza backup

`M502` ripristina tutti i default compilati, non soltanto la mesh. Prima di usarlo registrare i valori runtime necessari e salvare consapevolmente con `M500`.

## Checklist

- [ ] Il piatto e il gantry sono stati regolati meccanicamente.
- [ ] E abilitato un solo metodo di leveling.
- [ ] Il metodo scelto corrisponde alla forma del piano e al flusso desiderato.
- [ ] Probe, offset e ripetibilita sono gia stati verificati.
- [ ] Tutti i punti sono raggiungibili senza collisioni.
- [ ] Griglia e margini descrivono l'area realmente stampabile.
- [ ] La mesh viene misurata in condizioni termiche ripetibili.
- [ ] `G28` precede `G29` o `M420 S1`.
- [ ] Lo start G-code misura una nuova mesh oppure carica quella salvata.
- [ ] Lo stato attivo e stato verificato con `M420`.
- [ ] La mesh e stata salvata nello slot o nella EEPROM corretti.
- [ ] Una stampa di validazione conferma i valori numerici.
- [ ] La mesh viene ricreata dopo modifiche geometriche.

## Riferimenti

- [Marlin 2.1.2.8 - Configuration.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Marlin 2.1.2.8 - Configuration_adv.h](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [Marlin - Automatic Bed Leveling](https://marlinfw.org/docs/features/auto_bed_leveling.html)
- [Marlin - Unified Bed Leveling](https://marlinfw.org/docs/features/unified_bed_leveling.html)
- [Marlin - G29 Mesh Bed Leveling](https://marlinfw.org/docs/gcode/G029-mbl.html)
- [Marlin - G29 Bilinear](https://marlinfw.org/docs/gcode/G029-abl-bilinear.html)
- [Marlin - G29 UBL](https://marlinfw.org/docs/gcode/G029-ubl.html)
- [Marlin - M420 Bed Leveling State](https://marlinfw.org/docs/gcode/M420.html)
- [Marlin - G26 Mesh Validation](https://marlinfw.org/docs/gcode/G026.html)

## Collegamenti

- [[Stampante 3D/Marlin/Pagine/Probe Z offset e BLTouch]]
- [[Stampante 3D/Marlin/Pagine/Z Safe Homing e allineamento degli assi Z]]
- [[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti]]
- [[Stampante 3D/Marlin/Pagine/Babystepping e regolazioni dinamiche]]
