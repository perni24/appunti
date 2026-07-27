---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: theory-note

publish: true
difficulty: intermedio
tags: [marlin, cinematica, corexy, delta, scara]
aliases: [Cinematica Marlin, Tipi di stampante Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita]]"
  - "[[Stampante 3D/Pagine/Introduzione Stamapante 3D]]"
related:
  - "[[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti]]"
marlin-version: "2.1.2.8"
---

# Tipo di stampante e cinematica

## Sintesi

La cinematica descrive come i movimenti richiesti nelle coordinate della macchina vengono trasformati nei movimenti dei motori. In una cartesiana tradizionale ogni asse lineare e normalmente associato a un motore o a un gruppo di motori. In CoreXY, Delta, SCARA e altre architetture, piu attuatori collaborano per produrre un singolo movimento cartesiano.

Scegliere la cinematica sbagliata puo far muovere gli assi nella direzione o nella combinazione errata anche quando pin, driver e passi per millimetro sono corretti.

## Problema che risolve

Un comando come:

```gcode
G1 X100 Y50
```

esprime una destinazione nello spazio di lavoro. Il firmware deve convertirla nei passi richiesti da ogni motore.

La trasformazione dipende dalla struttura meccanica:

- una cartesiana usa relazioni dirette tra assi e motori;
- una CoreXY combina i due motori del piano per ottenere X e Y;
- una Delta calcola la posizione di tre carrelli verticali;
- una SCARA converte X e Y negli angoli dei bracci;
- una Polargraph calcola le lunghezze dei cavi;
- una belt printer tratta il piano di stampa continuo come asse coordinato.

## Concetto chiave

La cinematica viene scelta a compile-time in `Configuration.h`. Le opzioni del blocco `@section kinematics` sono alternative: si abilita soltanto quella corrispondente alla macchina.

Per una cartesiana classica non si abilita una macro cinematica speciale. Le direttive `CORE*`, `DELTA`, `SCARA` e simili attivano trasformazioni specifiche.

La cinematica non definisce da sola:

- pin dei motori;
- direzione elettrica dei motori;
- passi per millimetro;
- dimensioni e limiti;
- posizione dei finecorsa;
- velocita e accelerazioni sicure.

Questi parametri devono essere coerenti con la trasformazione scelta.

## Cinematica cartesiana

In una cartesiana tradizionale:

- X rappresenta normalmente il movimento orizzontale sinistra-destra;
- Y rappresenta il movimento avanti-indietro;
- Z rappresenta la distanza verticale dal piano;
- E rappresenta il movimento dell'estrusore.

Non esiste una direttiva `CARTESIAN` da abilitare nel blocco principale. La configurazione standard senza una cinematica speciale usa il modello cartesiano.

Una macchina puo restare cartesiana anche quando:

- un asse usa due motori;
- il piatto si muove invece dell'ugello;
- piu motori Z sollevano lo stesso portale.

Il criterio e la relazione geometrica tra coordinate e attuatori, non la posizione visiva dei componenti.

## Cinematiche Core

Marlin 2.1.2.8 espone:

```cpp
//#define COREXY
//#define COREXZ
//#define COREYZ
//#define COREYX
//#define COREZX
//#define COREZY
```

Le lettere indicano il piano in cui due motori vengono combinati:

- `COREXY`: accoppiamento nel piano X-Y;
- `COREXZ`: accoppiamento nel piano X-Z;
- `COREYZ`: accoppiamento nel piano Y-Z;
- `COREYX`, `COREZX`, `COREZY`: varianti con ordine invertito.

Nelle cinematiche Core un movimento lungo un asse logico puo richiedere entrambi i motori. Un errore di cinghiatura, direzione o variante scelta produce spesso movimenti diagonali, assi scambiati o motori che si contrastano.

### Verifica concettuale

Prima di cambiare `INVERT_X_DIR` o `INVERT_Y_DIR` a tentativi:

1. verificare il percorso delle cinghie;
2. identificare quale motore corrisponde a ogni uscita;
3. controllare se la meccanica richiede la variante normale o invertita;
4. eseguire movimenti minimi con possibilita di arresto;
5. verificare separatamente movimenti logici X e Y.

Invertire connettori o direttive senza un modello chiaro puo correggere un asse e rompere l'altro.

## Cinematica MarkForged

Le opzioni:

```cpp
//#define MARKFORGED_XY
//#define MARKFORGED_YX
```

selezionano la cinematica a cinghie di tipo MarkForged nelle due varianti previste. Non sono sinonimi di CoreXY: bisogna scegliere in base al percorso reale delle cinghie.

## Belt printer

```cpp
//#define BELTPRINTER
```

abilita il supporto per stampanti con movimento continuo dell'asse Z ottenuto tramite un piano a nastro.

Una belt printer richiede una configurazione coordinata di:

- orientamento degli assi;
- origine;
- limiti;
- slicer compatibile;
- procedure di homing;
- gestione della stampa continua.

Abilitare la direttiva su una cartesiana normale non trasforma automaticamente il piano in un asse continuo.

## Polargraph

```cpp
//#define POLARGRAPH
```

abilita la cinematica basata su due cinghie o cavi sospesi.

Le impostazioni associate sono:

```cpp
#define POLARGRAPH_MAX_BELT_LEN 1035.0
#define DEFAULT_SEGMENTS_PER_SECOND 5
```

`POLARGRAPH_MAX_BELT_LEN` e la lunghezza massima della cinghia a estensione completa, espressa in millimetri. Il commento della release indica che puo essere modificata con `M665 H`.

`DEFAULT_SEGMENTS_PER_SECOND` controlla la segmentazione temporale dei movimenti.

## Delta

```cpp
//#define DELTA
```

abilita la cinematica Delta. Tre carrelli sulle torri controllano insieme la posizione dell'effector. La trasformazione e molto sensibile alle dimensioni geometriche.

### Segmentazione

```cpp
#define DEFAULT_SEGMENTS_PER_SECOND 200
```

Marlin approssima le curve cinematiche con segmenti lineari:

- troppo pochi segmenti possono rendere visibili gli spigoli;
- troppi segmenti aumentano il carico del processore.

Il valore non e una misura della velocita della stampante.

### Homing in zona sicura

```cpp
//#define DELTA_HOME_TO_SAFE_ZONE
```

dopo l'homing sposta l'effector a un'altezza in cui il movimento XY non e vincolato dalla zona superiore della macchina.

### Calibrazione

```cpp
//#define DELTA_CALIBRATION_MENU
```

aggiunge al menu MarlinUI la calibrazione Delta a tre punti.

```cpp
//#define DELTA_AUTO_CALIBRATION
```

abilita `G33`. Per conservare i risultati tra i riavvii serve la EEPROM.

```cpp
#define DELTA_CALIBRATION_DEFAULT_POINTS 4
```

imposta il numero predefinito di punti per la procedura automatica secondo lo schema previsto da `G33`.

```cpp
#define PROBE_MANUALLY_STEP 0.05
```

definisce il passo in millimetri usato durante la calibrazione manuale.

### Area raggiungibile

```cpp
#define DELTA_PRINTABLE_RADIUS 140.0
```

e il raggio stampabile, ridotto per evitare zone non raggiungibili o collisioni con le torri.

```cpp
#define DELTA_MAX_RADIUS 140.0
```

e il raggio massimo raggiungibile. Non dovrebbe essere confuso con il raggio effettivamente sicuro per la stampa.

### Geometria Delta

```cpp
#define DELTA_DIAGONAL_ROD 250.0
```

distanza tra i centri dei fori delle aste diagonali.

```cpp
#define DELTA_HEIGHT 250.00
```

distanza tra piano e posizione di home Z dell'ugello.

```cpp
#define DELTA_ENDSTOP_ADJ { 0.0, 0.0, 0.0 }
```

correzioni dei tre finecorsa.

```cpp
#define DELTA_RADIUS 124.0
```

distanza orizzontale coperta dalle aste quando l'effector e al centro.

```cpp
#define DELTA_TOWER_ANGLE_TRIM { 0.0, 0.0, 0.0 }
```

correzioni angolari delle torri, espresse in gradi in senso antiorario osservando la macchina dall'alto. Il commento sorgente riporta erroneamente `(mm)` sulla riga del valore: la descrizione immediatamente precedente specifica i gradi.

```cpp
//#define DELTA_RADIUS_TRIM_TOWER { 0.0, 0.0, 0.0 }
```

```cpp
//#define DELTA_DIAGONAL_ROD_TRIM_TOWER { 0.0, 0.0, 0.0 }
```

permettono correzioni individuali di raggio e lunghezza delle aste.

`M665` puo modificare diversi parametri Delta a runtime. `G33` puo calibrare altezza, finecorsa, raggio e angoli delle torri.

## SCARA

Marlin include:

```cpp
//#define MORGAN_SCARA
```

```cpp
//#define MP_SCARA
```

Entrambe usano due bracci articolati per raggiungere X e Y.

### Parametri condivisi

```cpp
#define DEFAULT_SEGMENTS_PER_SECOND 200
#define SCARA_LINKAGE_1 150
#define SCARA_LINKAGE_2 150
#define SCARA_OFFSET_X 100
#define SCARA_OFFSET_Y -56
```

- `SCARA_LINKAGE_1` e `SCARA_LINKAGE_2`: lunghezza dei due bracci in millimetri;
- `SCARA_OFFSET_X` e `SCARA_OFFSET_Y`: posizione della torre rispetto allo zero del piano;
- `DEFAULT_SEGMENTS_PER_SECOND`: densita della segmentazione.

Misure errate deformano lo spazio raggiungibile e la posizione calcolata.

### Morgan SCARA

```cpp
//#define DEBUG_SCARA_KINEMATICS
#define SCARA_FEEDRATE_SCALING
#define MIDDLE_DEAD_ZONE_R 0
#define THETA_HOMING_OFFSET 0
#define PSI_HOMING_OFFSET 0
```

- `DEBUG_SCARA_KINEMATICS`: aggiunge diagnostica;
- `SCARA_FEEDRATE_SCALING`: converte il feedrate XY da millimetri al secondo a gradi al secondo;
- `MIDDLE_DEAD_ZONE_R`: raggio della zona centrale non raggiungibile;
- `THETA_HOMING_OFFSET` e `PSI_HOMING_OFFSET`: offset angolari di homing.

### Mostly Printed SCARA

```cpp
#define SCARA_OFFSET_THETA1 12
#define SCARA_OFFSET_THETA2 131
```

definiscono gli offset angolari, espressi in gradi, per i due giunti.

## AXEL TPARA

```cpp
//#define AXEL_TPARA
```

abilita la cinematica TPARA.

```cpp
#define DEBUG_TPARA_KINEMATICS
#define DEFAULT_SEGMENTS_PER_SECOND 200
#define TPARA_LINKAGE_1 120
#define TPARA_LINKAGE_2 120
#define TPARA_OFFSET_X 0
#define TPARA_OFFSET_Y 0
#define TPARA_OFFSET_Z 0
#define SCARA_FEEDRATE_SCALING
#define MIDDLE_DEAD_ZONE_R 0
```

Le lunghezze descrivono i bracci; gli offset posizionano la torre rispetto al volume di lavoro; la zona morta centrale rappresenta l'area non raggiungibile.

`DEBUG_TPARA_KINEMATICS` e definita per impostazione predefinita all'interno del blocco nella configurazione `2.1.2.8`. Prima di una build destinata all'uso normale va valutato se la diagnostica sia necessaria.

## Assi mappati direttamente

### Braccio articolato

```cpp
//#define ARTICULATED_ROBOT_ARM
```

indica un robot articolato in cui i giunti sono mappati direttamente agli assi, senza una trasformazione cinematica cartesiana.

### Taglierina a filo caldo

```cpp
//#define FOAMCUTTER_XYUV
```

supporta una taglierina con assi paralleli X/I e Y/J. Anche in questo caso i giunti sono mappati direttamente, senza cinematica inversa.

## Effetto sulle altre impostazioni

La cinematica influenza:

- direzioni e combinazioni dei motori;
- homing e posizione iniziale;
- area raggiungibile;
- segmentazione del movimento;
- limiti e coordinate valide;
- accelerazioni realistiche;
- comportamento di livellamento e probe;
- calcolo delle posizioni riportate.

Per questo la cinematica va scelta prima di tarare passi, velocita o livellamento.

## Errori comuni

- **Abilitare piu cinematiche:** la configurazione e incoerente e dovrebbe fallire i controlli di build.
- **Confondere CoreXY e CoreYX:** i movimenti risultano scambiati o combinati male.
- **Correggere una cinematica errata invertendo singoli motori:** si maschera il problema senza correggere la trasformazione.
- **Usare misure Delta nominali:** piccoli errori producono deformazioni sul piano.
- **Aumentare molto la segmentazione:** il processore puo non mantenere il flusso dei movimenti.
- **Usare il diametro del piatto come `DELTA_RADIUS`:** sono grandezze geometriche differenti.
- **Ignorare la zona morta SCARA:** il firmware puo ricevere coordinate fisicamente irraggiungibili.
- **Considerare `BELTPRINTER` una semplice rotazione degli assi:** richiede una macchina e un flusso di slicing dedicati.
- **Tarare velocita prima della geometria:** i risultati non sono attendibili.

## Checklist

- La cinematica corrisponde al percorso reale di cinghie, bracci o torri.
- E abilitata una sola famiglia cinematica.
- Le varianti con ordine invertito sono state confrontate con la meccanica.
- Lunghezze e offset sono misurati tra i punti indicati dal sorgente.
- I limiti descrivono soltanto zone raggiungibili.
- La segmentazione e compatibile con la potenza del processore.
- Homing e direzioni vengono provati con movimenti minimi.
- Le protezioni termiche restano attive durante i test.
- Dopo ogni modifica geometrica vengono ripetute calibrazione e verifica dimensionale.

## Fonti

- [Configuration.h 2.1.2.8 - Mechanical Settings](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [G33 - Delta Auto Calibration](https://marlinfw.org/docs/gcode/G033.html)
- [M665 - Delta Configuration](https://marlinfw.org/docs/gcode/M665.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Introduzione a Marlin 2.1.2.8 e compatibilita]]
- [[Stampante 3D/Marlin/Pagine/Struttura dei file di configurazione Marlin]]
- [[Stampante 3D/Marlin/Pagine/Dimensioni del piatto area di lavoro e limiti]]
