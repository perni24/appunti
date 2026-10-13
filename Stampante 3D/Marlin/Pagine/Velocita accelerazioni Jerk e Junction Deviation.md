---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note
publish: true
difficulty: avanzato
tags:
  - marlin
  - movimento
  - velocita
  - accelerazione
  - jerk
  - junction-deviation
aliases:
  - Limiti di movimento Marlin
  - Accelerazioni Marlin
  - Junction Deviation Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro]]"
  - "[[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping]]"
related: []
marlin-version: 2.1.2.8
title: Velocita, accelerazioni, Jerk e Junction Deviation
status: non revisionato
---

# Velocita, accelerazioni, Jerk e Junction Deviation

## Sintesi

Marlin non invia ai motori la velocita richiesta dal G-code senza controlli. Il planner limita ogni movimento in base alla velocita massima degli assi, alle accelerazioni ammesse e alla velocita con cui puo attraversare una giunzione tra due segmenti.

Queste impostazioni rispondono a domande diverse:

- **feedrate:** a quale velocita deve procedere la traiettoria;
- **velocita massima per asse:** quale componente del movimento puo sostenere ciascun asse;
- **accelerazione:** quanto rapidamente puo cambiare la velocita;
- **Classic Jerk o Junction Deviation:** quanto deve rallentare in prossimita di un cambio di direzione;
- **S-curve:** con quale forma viene applicata l'accelerazione.

Valori elevati non rendono automaticamente la stampa piu veloce. Su segmenti brevi la macchina puo non raggiungere mai il feedrate richiesto.

## Quando usarlo

Questa configurazione va rivista:

- dopo aver verificato steps/mm, driver e corrente;
- durante la prima taratura del movimento;
- quando compaiono perdita di passi o spostamenti di layer;
- quando gli angoli mostrano ringing o ghosting;
- quando la macchina vibra nei cambi di direzione;
- quando i travel sono inutilmente lenti;
- quando il tempo reale differisce molto da quello stimato;
- quando slicer e firmware applicano limiti differenti.

## Modello del movimento

Per un tratto sufficientemente lungo, un profilo trapezoidale comprende:

1. accelerazione dalla velocita iniziale;
2. eventuale tratto a velocita costante;
3. decelerazione verso la velocita richiesta dalla giunzione o dall'arresto.

Se il tratto e corto, accelerazione e decelerazione si incontrano prima del raggiungimento del feedrate. Il profilo diventa triangolare.

La distanza necessaria per passare da una velocita iniziale `v0` a una velocita `v1` con accelerazione costante `a` e:

```text
d = (v1^2 - v0^2) / (2 * a)
```

Per esempio, partendo da fermo e usando 1000 mm/s^2:

```text
da 0 a 100 mm/s servono 5 mm
```

Serve poi spazio analogo per fermarsi. Su un segmento lungo 4 mm quella velocita non puo essere raggiunta.

## Feedrate del G-code

Nei normali movimenti lineari:

```gcode
G1 X100 Y100 F6000
```

`F6000` e espresso in mm/min e corrisponde a:

```text
6000 / 60 = 100 mm/s
```

Il feedrate descrive la velocita lungo la traiettoria, non assegna 100 mm/s separatamente a X e Y. In una diagonale, il planner calcola le componenti degli assi mantenendo il percorso coordinato.

Il valore `F` resta modale: continua ad applicarsi ai movimenti successivi finche non viene sostituito. Questa persistenza puo rendere ingannevoli i test manuali.

## Velocita massima degli assi

In `Configuration.h`:

```cpp
#define DEFAULT_MAX_FEEDRATE { 300, 300, 5, 25 }
```

L'ordine segue X, Y, Z, eventuali assi aggiuntivi ed estrusori. Le unita sono:

- mm/s per assi lineari;
- gradi/s per assi rotativi;
- mm/s di filamento per l'estrusore.

Questi sono limiti, non velocita usate in ogni movimento. Se una componente supera il limite di un asse, Marlin riduce il movimento coordinato per conservare la traiettoria.

I valori si leggono con:

```gcode
M203
```

Si imposta temporaneamente il limite X:

```gcode
M203 X200
```

Il limite deve considerare:

- velocita lineare della meccanica;
- frequenza di step richiesta;
- coppia residua del motore ad alta velocita;
- tensione di alimentazione;
- driver e modalita del chopper;
- massa mobile;
- portata massima dell'hotend per i movimenti estrusi.

Per un asse:

```text
frequenza step = velocita * steps/mm
```

Con 200 mm/s e 80 steps/mm:

```text
frequenza = 16 000 step/s
```

La frequenza e solo uno dei limiti: il motore puo perdere coppia prima di raggiungere il limite elettronico.

Le opzioni:

```cpp
//#define LIMITED_MAX_FR_EDITING
#define MAX_FEEDRATE_EDIT_VALUES { 600, 600, 10, 50 }
```

limitano le modifiche effettuate tramite `M203` o LCD. Il commento ufficiale indica che, senza valori personalizzati, il limite e collegato a un multiplo del valore predefinito.

## Accelerazione massima per asse

```cpp
#define DEFAULT_MAX_ACCELERATION { 3000, 3000, 100, 10000 }
```

Questi valori pongono un tetto per ogni asse:

- mm/s^2 per assi lineari;
- gradi/s^2 per assi rotativi;
- mm/s^2 di filamento per E.

Leggere i valori:

```gcode
M201
```

Impostare X e Y:

```gcode
M201 X1500 Y1500
```

Il limite di un asse si applica anche quando esso e soltanto una componente di un movimento multi-asse. Su CoreXY, il carico e la velocita dei due motori derivano dalla trasformazione cinematica; non basta considerare un asse cartesiano isolato.

Le opzioni:

```cpp
//#define LIMITED_MAX_ACCEL_EDITING
#define MAX_ACCEL_EDIT_VALUES { 6000, 6000, 200, 20000 }
```

limitano le modifiche tramite `M201` o LCD.

## Accelerazione per tipo di movimento

La release definisce:

```cpp
#define DEFAULT_ACCELERATION          3000
#define DEFAULT_RETRACT_ACCELERATION  3000
#define DEFAULT_TRAVEL_ACCELERATION   3000
```

I ruoli sono:

- `DEFAULT_ACCELERATION`: movimenti di stampa con X/Y/Z ed estrusione;
- `DEFAULT_RETRACT_ACCELERATION`: retrazioni del solo estrusore;
- `DEFAULT_TRAVEL_ACCELERATION`: spostamenti senza estrusione.

Questi valori scelgono l'accelerazione iniziale del tipo di movimento, ma restano soggetti ai limiti per asse di `DEFAULT_MAX_ACCELERATION`.

Leggere le accelerazioni attive:

```gcode
M204
```

Impostare stampa, retrazione e travel:

```gcode
M204 P1000 R2000 T1500
```

Alcuni slicer emettono `M201`, `M203`, `M204` o `M205` nel G-code iniziale. In quel caso i valori compilati o salvati in EEPROM possono essere sovrascritti a ogni stampa.

## Effetti pratici dell'accelerazione

Un'accelerazione troppo alta puo causare:

- perdita di passi;
- ringing dopo gli angoli;
- vibrazioni del telaio;
- slittamento delle cinghie;
- oggetti che si staccano dal piatto;
- picchi di corrente e rumore;
- maggiore usura meccanica.

Un'accelerazione troppo bassa:

- aumenta il tempo sui percorsi brevi;
- rallenta travel e riempimenti;
- puo aumentare stringing per la durata dei travel;
- impedisce di sfruttare una velocita massima altrimenti sostenibile.

La massa mobile e determinante. Un piatto che si muove in Y richiede spesso valori piu prudenti rispetto a una testina leggera.

## Classic Jerk

```cpp
//#define CLASSIC_JERK
```

Quando e abilitato, Marlin usa:

```cpp
#define DEFAULT_XJERK 10.0
#define DEFAULT_YJERK 10.0
#define DEFAULT_ZJERK  0.3
#define DEFAULT_EJERK  5.0
```

Il **Classic Jerk di Marlin non e il jerk fisico**, cioe la derivata dell'accelerazione nel tempo. E una soglia di variazione della velocita che puo essere applicata istantaneamente senza una rampa di accelerazione.

In una giunzione:

- un valore alto permette cambi di velocita piu bruschi;
- un valore basso forza maggiore rallentamento;
- il risultato dipende dalle componenti dei singoli assi.

`DEFAULT_EJERK` puo essere usato anche da Linear Advance.

Leggere le impostazioni avanzate:

```gcode
M205
```

Con Classic Jerk, impostare X e Y:

```gcode
M205 X8 Y8
```

```cpp
//#define TRAVEL_EXTRA_XYJERK 0.0
```

aggiunge una tolleranza Jerk per i travel. Aumentarla puo velocizzare movimenti non estrusi, ma anche produrre urti e perdita di passi.

```cpp
//#define LIMITED_JERK_EDITING
```

limita le modifiche runtime o da LCD.

## Junction Deviation

Se `CLASSIC_JERK` e disabilitato:

```cpp
#define JUNCTION_DEVIATION_MM 0.013
#define JD_HANDLE_SMALL_SEGMENTS
```

Junction Deviation calcola la velocita della giunzione considerando:

- angolo tra i segmenti;
- accelerazione disponibile;
- deviazione geometrica ammessa rispetto all'angolo ideale.

Il valore e espresso in millimetri:

- un valore maggiore permette generalmente curve percorse piu velocemente e una deviazione maggiore;
- un valore minore segue piu strettamente l'angolo e rallenta maggiormente.

Non e una distanza che la testina aggiunge intenzionalmente al modello. E un parametro del calcolo della velocita compatibile con una tolleranza del percorso.

La configurazione predefinita della release usa Junction Deviation perche `CLASSIC_JERK` e commentato.

Con questa modalita, impostare il valore tramite `M205 J`:

```gcode
M205 J0.013
```

`JD_HANDLE_SMALL_SEGMENTS` usa una stima della curvatura per segmenti inferiori a 1 mm con grandi angoli di giunzione superiori a 135 gradi, invece di considerare soltanto l'angolo. E rilevante per curve discretizzate in molti tratti brevi.

## Classic Jerk o Junction Deviation

Le due modalita non vanno tarate contemporaneamente.

| Aspetto | Classic Jerk | Junction Deviation |
|---|---|---|
| Parametro | variazione di velocita per asse | deviazione geometrica in mm |
| Comportamento | dipende direttamente dalle componenti asse | considera angolo e accelerazione |
| Compatibilita | utile per configurazioni storiche | predefinita nella release 2.1.2.8 |
| G-code principale | `M205 X Y Z E` | `M205 J` |

Quando si migra una configurazione non va copiato numericamente un valore Jerk dentro Junction Deviation. Grandezza e scala sono differenti.

## Accelerazione S-curve

```cpp
//#define S_CURVE_ACCELERATION
```

Questa funzione modifica la forma della rampa usando una curva di Bezier per rendere piu graduali i cambi di accelerazione. Non sostituisce:

- limite di velocita;
- limite di accelerazione;
- Junction Deviation o Classic Jerk;
- Input Shaping.

Puo ridurre vibrazioni eccitate da transizioni brusche, ma usa risorse e modifica la risposta dinamica. Va valutata con la build e la piattaforma effettive.

## Impostazioni minime avanzate

In `Configuration_adv.h`:

```cpp
#define DEFAULT_MINIMUMFEEDRATE   0.0
#define DEFAULT_MINTRAVELFEEDRATE 0.0
#define MINIMUM_PLANNER_SPEED     0.05
```

- `DEFAULT_MINIMUMFEEDRATE` e il minimo per i movimenti di stampa;
- `DEFAULT_MINTRAVELFEEDRATE` e il minimo per i travel;
- `MINIMUM_PLANNER_SPEED` e la velocita minima pianificata alla fine del buffer e durante gli arresti.

I primi due si possono modificare con `M205 S` e `M205 T`. Il sorgente raccomanda di non aumentare molto `MINIMUM_PLANNER_SPEED` e di modificarlo solo per comportamenti indesiderati a velocita molto basse.

```cpp
//#define XY_FREQUENCY_LIMIT 10
#define XY_FREQUENCY_MIN_PERCENT 5
```

puo ridurre la velocita di piccoli zig-zag X/Y per limitare risonanze. Si regola con `M201 F` e `M201 S`. Non sostituisce una taratura generale di accelerazione o Input Shaping.

## EEPROM e valori effettivi

I valori compilati possono essere sovrascritti da:

1. EEPROM caricata all'avvio;
2. menu LCD;
3. G-code di avvio dello slicer;
4. comandi inviati dall'host;
5. comandi inseriti nel file di stampa.

Dopo una ricompilazione, controllare:

```gcode
M503
```

Per provare nuovi valori e salvarli:

```gcode
M500
```

Per ripristinare i valori compilati:

```gcode
M502
```

Per renderli persistenti:

```gcode
M500
```

Durante la taratura conviene cambiare una sola famiglia di parametri alla volta e annotare i valori iniziali.

## Procedura di taratura

1. Verificare meccanica, tensione delle cinghie, steps/mm e corrente.
2. Disabilitare temporaneamente override dello slicer non necessari.
3. Impostare velocita e accelerazioni prudenti.
4. Trovare per ogni asse una velocita sostenibile su una corsa lunga.
5. Ridurre il valore massimo lasciando margine rispetto al primo errore.
6. Tarare l'accelerazione con percorsi che includono partenze e arresti.
7. Separare valori di stampa, travel e retrazione.
8. Scegliere Classic Jerk oppure Junction Deviation.
9. Aumentare gradualmente la velocita in curva osservando ringing e perdita di passi.
10. Provare segmenti lunghi, corti, diagonali e piccoli zig-zag.
11. Ripetere con macchina calda e nelle condizioni reali di stampa.
12. Verificare con `M503` e salvare soltanto il profilo stabile.
13. Allineare infine i limiti dello slicer con quelli del firmware.

## Errori comuni

- **Usare mm/min nei valori di `M203`:** il comando usa mm/s per gli assi lineari.
- **Confondere feedrate G-code e limite firmware:** il primo richiede una velocita, il secondo pone un tetto.
- **Aumentare la velocita senza considerare la frequenza di step:** firmware o driver possono saturare.
- **Tarare velocita e accelerazione insieme:** non si identifica la causa dell'errore.
- **Usare valori uguali per tutti gli assi:** masse e trasmissioni sono diverse.
- **Confondere Classic Jerk con jerk fisico:** il parametro non limita direttamente la derivata dell'accelerazione.
- **Copiare Jerk in Junction Deviation:** unita e modello matematico non coincidono.
- **Aumentare Junction Deviation per ridurre il tempo:** gli angoli diventano piu aggressivi e aumenta il ringing.
- **Ignorare i comandi dello slicer:** la stampante usa valori diversi da quelli attesi.
- **Valutare la velocita solo su segmenti corti:** la macchina puo non raggiungerla.
- **Usare S-curve come correzione di problemi meccanici:** giochi e flessioni restano.

## Checklist

- Steps/mm e corrente dei driver sono gia verificati.
- `DEFAULT_MAX_FEEDRATE` rispetta meccanica e frequenza di step.
- `DEFAULT_MAX_ACCELERATION` e definita per ogni asse.
- Accelerazioni di stampa, travel e retrazione sono distinte.
- Unita dei G-code verificate.
- E attiva una sola modalita tra Classic Jerk e Junction Deviation.
- I parametri sono stati testati su segmenti lunghi e corti.
- Nessuna perdita di passi dopo una sequenza prolungata.
- Ringing e vibrazioni restano entro limiti accettabili.
- Valori EEPROM controllati con `M503`.
- Lo slicer non sovrascrive involontariamente i limiti.
- Rimane margine rispetto ai primi sintomi di instabilita.

## Fonti

- [Configuration.h 2.1.2.8 - Movement Settings](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8 - Motion Settings](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [M201 - Print and Travel Move Limits](https://marlinfw.org/docs/gcode/M201.html)
- [M203 - Set Max Feedrate](https://marlinfw.org/docs/gcode/M203.html)
- [M204 - Set Starting Acceleration](https://marlinfw.org/docs/gcode/M204.html)
- [M205 - Set Advanced Settings](https://marlinfw.org/docs/gcode/M205.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Motori direzione e passi per millimetro|Motori direzione e passi per millimetro]]
- [[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping|Driver stepper corrente e microstepping]]
- [[Stampante 3D/Marlin/Pagine/Segmentazione curve e precisione dei movimenti|Segmentazione curve e precisione dei movimenti]]
