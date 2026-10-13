---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: technical-note
publish: true
difficulty: avanzato
tags:
  - marlin
  - planner
  - segmentazione
  - archi
  - precisione
aliases:
  - Segmentazione movimenti Marlin
  - Planner Marlin
  - Archi Marlin
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Velocita accelerazioni Jerk e Junction Deviation]]"
related: []
marlin-version: 2.1.2.8
title: Segmentazione, curve e precisione dei movimenti
status: non revisionato
---

# Segmentazione, curve e precisione dei movimenti

## Sintesi

Marlin riceve comandi geometrici e li trasforma in blocchi pianificati, segmenti e infine impulsi per i motori. La precisione del percorso dipende quindi sia dal G-code sia dalla discretizzazione eseguita dal firmware.

Segmenti piu corti possono seguire meglio curve, mesh e cinematiche non lineari, ma aumentano:

- calcoli del processore;
- uso del planner;
- traffico seriale;
- frequenza delle giunzioni;
- rischio di svuotare il buffer;
- sensibilita a impostazioni di Jerk o Junction Deviation.

La segmentazione va scelta come compromesso misurabile, non impostata al valore minimo possibile.

## Quando usarlo

Queste opzioni sono rilevanti:

- quando curve e cerchi risultano sfaccettati;
- quando il movimento rallenta su G-code molto frammentato;
- quando la superficie mostra esitazioni periodiche;
- con cinematica Delta, SCARA o segmentata;
- quando il bed leveling deve seguire una mesh;
- quando si usano `G2`, `G3` o `G5`;
- quando compaiono errori solo ad alto numero di segmenti;
- quando una scheda a risorse limitate non mantiene il flusso.

## Dalla riga G-code agli step

Il flusso semplificato e:

```text
parser G-code
  -> coordinate e feedrate
  -> trasformazioni cinematiche e leveling
  -> segmenti lineari
  -> planner con look-ahead
  -> blocchi di accelerazione
  -> stepper interrupt
  -> impulsi STEP/DIR
```

I motori stepper eseguono sempre impulsi discreti. Anche una curva matematica deve essere convertita in piccoli movimenti coordinati.

## Segmenti prodotti dallo slicer

Un file puo descrivere una curva in due modi:

- molte righe `G1` corte;
- un arco `G2` o `G3` che Marlin segmenta internamente.

Molti `G1` minuscoli impongono gia la geometria al firmware. Marlin puo pianificarli e in alcuni casi unirli, ma non ricostruisce automaticamente la curva originale.

Una frammentazione eccessiva puo:

- riempire e svuotare rapidamente il planner;
- richiedere molta banda seriale;
- applicare il calcolo delle giunzioni a ogni tratto;
- impedire il raggiungimento della velocita;
- produrre variazioni di portata sull'estrusore;
- aumentare l'effetto di arrotondamenti numerici.

Prima di modificare Marlin va controllata la risoluzione di esportazione dello slicer.

## Planner e look-ahead

Il planner non esegue un segmento isolatamente appena arriva. Conserva piu blocchi, osserva le giunzioni future e calcola velocita di ingresso, uscita e accelerazione compatibili.

In `Configuration_adv.h`:

```cpp
#if BOTH(SDSUPPORT, DIRECT_STEPPING)
  #define BLOCK_BUFFER_SIZE 8
#elif ENABLED(SDSUPPORT)
  #define BLOCK_BUFFER_SIZE 16
#else
  #define BLOCK_BUFFER_SIZE 16
#endif
```

Il valore indica quanti movimenti lineari possono essere presenti contemporaneamente nel planner e deve essere una potenza di due, per esempio 8, 16 o 32.

La configurazione predefinita usa 16 nei casi ordinari e 8 quando sono attivi contemporaneamente supporto SD e Direct Stepping.

Un buffer piu grande:

- offre piu look-ahead;
- tollera meglio piccoli ritardi nella ricezione;
- usa piu RAM;
- puo aumentare la latenza con cui un comando gia accodato viene modificato o fermato.

Un buffer piu piccolo:

- consuma meno RAM;
- riduce il numero di segmenti osservabili;
- e piu esposto a svuotamenti su flussi irregolari.

Non va aumentato senza controllare memoria disponibile e compatibilita della piattaforma.

## Rallentamento quando il buffer si svuota

```cpp
#define DEFAULT_MINSEGMENTTIME 20000
#define SLOWDOWN
#define SLOWDOWN_DIVISOR 2
```

`DEFAULT_MINSEGMENTTIME` e espresso in microsecondi e puo essere regolato con `M205 B`.

`SLOWDOWN` riduce la velocita quando il buffer look-ahead si sta svuotando. Lo scopo e evitare alternanze brusche tra movimento e attesa causate da un flusso di comandi insufficiente.

Se la macchina procede bene da scheda SD ma mostra pause via seriale, controllare prima:

- baud rate;
- prestazioni dell'host;
- cavo USB;
- dimensione e numero delle righe G-code;
- plugin dell'host;
- ritrasmissioni per errori seriali.

Aumentare il buffer non corregge una connessione instabile.

## Segmenti con pochi step

```cpp
#define MIN_STEPS_PER_SEGMENT 6
```

I movimenti o segmenti con meno step vengono uniti al movimento successivo. Questo evita di spendere troppo lavoro per tratti che producono pochissimi impulsi.

Il criterio e espresso in step, non in millimetri. La stessa distanza puo quindi essere trattata diversamente su assi con steps/mm differenti.

Un valore troppo alto puo perdere dettagli molto piccoli. Un valore troppo basso aumenta il numero di blocchi quasi privi di movimento. La modifica richiede test su:

- piccoli dettagli;
- assi con elevati steps/mm;
- estrusione coordinata;
- curve fitte;
- piattaforma di destinazione.

## Frequenza e temporizzazione degli step

La frequenza richiesta da un asse lineare e approssimativamente:

```text
step/s = velocita in mm/s * steps/mm
```

Su una cinematica Core o non cartesiana vanno considerate le velocita trasformate dei motori, non soltanto le coordinate cartesiane.

`Configuration_adv.h` consente override:

```cpp
//#define MINIMUM_STEPPER_POST_DIR_DELAY 650
//#define MINIMUM_STEPPER_PRE_DIR_DELAY  650
//#define MINIMUM_STEPPER_PULSE 2
//#define MAXIMUM_STEPPER_RATE 250000
```

I due delay, espressi in nanosecondi, garantiscono il tempo richiesto dal driver prima e dopo un cambio del segnale `DIR`. Il sorgente riporta come riferimenti:

| Driver | Delay DIR indicato |
|---|---:|
| TMC2xxx | 20 ns |
| A4988 | 200 ns |
| A5984 | 400 ns |
| LV8729 | 500 ns |
| DRV8825 | 650 ns |
| TB6600 | 1500 ns |
| TB6560 | 15000 ns |

`MINIMUM_STEPPER_PULSE` e la durata minima dell'impulso in microsecondi richiesta dal driver. Il sorgente riporta esempi:

| Driver | Impulso minimo indicato |
|---|---:|
| TMC2xxx | 0 us |
| A4988 | 1 us |
| DRV8825 | 2 us |
| TB6600 | 3 us |
| TB6560 | 30 us |

`MAXIMUM_STEPPER_RATE` limita la frequenza permessa dal driver. Se non definita, la release usa come default:

```text
1 MHz / (2 * MINIMUM_STEPPER_PULSE)
```

Il sorgente indica valori massimi di riferimento diversi per famiglia. Questi numeri sono limiti del segnale, non garanzie che motore, MCU e meccanica possano funzionare stabilmente a quella frequenza.

Il tipo di driver in `Configuration.h` seleziona normalmente timing appropriati. Gli override manuali servono quando datasheet o hardware richiedono valori differenti.

## Supporto per archi `G2` e `G3`

```cpp
#define ARC_SUPPORT
```

abilita archi orari e antiorari. La release indica un costo di circa 3226 byte di programma.

Marlin non pilota un arco continuo: lo approssima con segmenti lineari controllati da:

```cpp
#define MIN_ARC_SEGMENT_MM   0.1
#define MAX_ARC_SEGMENT_MM   1.0
#define MIN_CIRCLE_SEGMENTS 72
#define N_ARC_CORRECTION    25
```

- `MIN_ARC_SEGMENT_MM`: evita segmenti eccessivamente corti;
- `MAX_ARC_SEGMENT_MM`: limita la lunghezza e quindi la sfaccettatura;
- `MIN_CIRCLE_SEGMENTS`: impone un numero minimo per un cerchio completo;
- `N_ARC_CORRECTION`: stabilisce ogni quanti segmenti correggere l'approssimazione incrementale.

Con:

```cpp
//#define ARC_SEGMENTS_PER_SEC 50
```

la lunghezza dei segmenti viene scelta in funzione del feedrate per ottenere un numero obiettivo di segmenti al secondo.

Ridurre `MAX_ARC_SEGMENT_MM` aumenta la fedelta geometrica solo fino al limite utile della macchina. Oltre quel punto produce piu calcoli senza un miglioramento misurabile.

## Esempi di archi

Arco orario nel piano XY usando offset dal punto iniziale al centro:

```gcode
G2 X20 Y10 I10 J0 F1200
```

Arco antiorario:

```gcode
G3 X20 Y10 I10 J0 F1200
```

Il significato di I e J dipende dal piano e dalla modalita supportata. Endpoint, centro e raggio devono descrivere una geometria coerente; differenze dovute ad arrotondamenti dello slicer possono causare errori.

```cpp
//#define ARC_P_CIRCLES
```

abilita il parametro `P` per specificare cerchi completi.

```cpp
//#define SF_ARC_FIX
```

e una compatibilita specifica per la procedura "Arc Point" di SkeinForge, non una correzione generale degli archi.

## Piani di lavoro CNC

```cpp
//#define CNC_WORKSPACE_PLANES
```

consente a `G2`, `G3` e `G5` di operare nei piani:

- XY;
- ZX;
- YZ.

Senza questa funzione, l'uso tipico nella stampa 3D e il piano XY. Software sorgente e firmware devono concordare sul piano attivo.

## Curve di Bezier `G5`

```cpp
//#define BEZIER_CURVE_SUPPORT
```

abilita curve cubiche di Bezier con destinazione XYZE e offset I, J, P, Q. La release indica un costo di circa 2666 byte.

Esempio generale:

```gcode
G5 X100 Y50 I20 J0 P-20 Q0
```

La semantica esatta degli offset va rispettata dal generatore G-code. Attivare il supporto non converte i comuni `G1` in curve.

## Direct Stepping `G6`

```cpp
//#define DIRECT_STEPPING
```

Direct Stepping usa `G6` per eseguire dati di movimento precalcolati. Il commento della release lo descrive come un metodo paragonabile all'approccio di Klipper: sposta parte del calcolo fuori dal firmware, puo aumentare la velocita massima e ridurre lo step aliasing.

Non e una modalita che accelera automaticamente un normale file `G1`. Il G-code deve essere preparato con uno strumento compatibile, indicato dal sorgente nel progetto `step-daemon`. Il formato dipende dalla configurazione esatta della macchina; un flusso precalcolato per steps/mm, cinematica o timing differenti non e riutilizzabile in sicurezza.

Quando `SDSUPPORT` e `DIRECT_STEPPING` sono entrambi attivi, la configurazione predefinita riduce `BLOCK_BUFFER_SIZE` a 8. Questa funzione va quindi valutata insieme a memoria, supporto SD e generatore del movimento.

## Correzione periodica degli archi

L'interpolazione incrementale evita calcoli trigonometrici completi per ogni segmento, ma introduce un piccolo errore numerico cumulativo. `N_ARC_CORRECTION` forza periodicamente un ricalcolo piu accurato.

Un valore piu basso:

- corregge piu spesso;
- richiede piu calcolo;
- limita maggiormente l'accumulo numerico.

Un valore piu alto:

- riduce il costo;
- lascia piu segmenti tra le correzioni.

Non va confuso con la precisione geometrica determinata dalla lunghezza dei segmenti.

## Segmentazione del bed leveling

Per macchine cartesiane con leveling:

```cpp
#define SEGMENT_LEVELED_MOVES
#define LEVELED_SEGMENT_LENGTH 5.0
```

Marlin divide i movimenti in segmenti corti per seguire il profilo del piatto piu da vicino rispetto a una singola linea corretta soltanto ai confini della mesh.

Segmenti piu corti:

- seguono meglio variazioni locali della mesh;
- aumentano carico del planner e frequenza di step;
- possono interagire con Junction Deviation sui tratti piccoli;
- non correggono una mesh rumorosa o un piatto meccanicamente instabile.

La lunghezza va scelta in relazione alla spaziatura della mesh e alla reale variazione della superficie.

## Cinematiche non lineari

Delta, SCARA e altre cinematiche trasformano il percorso cartesiano in movimenti dei giunti. Una linea cartesiana puo richiedere una traiettoria non lineare dei motori, quindi viene segmentata.

I parametri specifici della cinematica, come frequenza o lunghezza dei segmenti, sono descritti nella nota dedicata. Aumentare indiscriminatamente la segmentazione puo saturare una scheda a 8 bit.

Per valutare il risultato bisogna distinguere:

- errore della cinematica e delle misure geometriche;
- errore di discretizzazione;
- errore meccanico;
- limiti di accelerazione;
- insufficienza del processore.

## `JD_HANDLE_SMALL_SEGMENTS`

Con Junction Deviation:

```cpp
#define JD_HANDLE_SMALL_SEGMENTS
```

usa una stima di curvatura per segmenti inferiori a 1 mm con angoli di giunzione superiori a 135 gradi. Serve a evitare che una curva rappresentata da molti segmenti piccoli venga trattata come una sequenza di angoli indipendenti in modo troppo semplicistico.

La funzione migliora il calcolo della velocita; non cambia la geometria del G-code e non ricrea dettagli assenti.

## Adaptive Step Smoothing

```cpp
//#define ADAPTIVE_STEP_SMOOTHING
```

secondo il sorgente aumenta la risoluzione dei movimenti multi-asse soprattutto a frequenze inferiori a:

- circa 1 kHz su AVR;
- circa 10 kHz su ARM.

In quella zona, aliasing tra assi puo produrre vibrazioni udibili e artefatti superficiali. L'algoritmo adatta lo smoothing alle basse frequenze.

Questa opzione riguarda la distribuzione temporale degli step multi-asse. Non sostituisce:

- steps/mm corretti;
- accelerazioni sostenibili;
- microstepping;
- Input Shaping;
- manutenzione meccanica.

## `GCODE_MOTION_MODES`

```cpp
//#define GCODE_MOTION_MODES
```

supporta un comportamento in stile CNC in cui la modalita di movimento `G0`, `G1`, `G2`, `G3`, `G5` o `G38.x` resta attiva e puo essere applicata a righe successive contenenti coordinate.

Nella stampa 3D comune i file riportano esplicitamente `G0` o `G1`. Abilitare una modalita persistente cambia l'interpretazione di G-code che omette il comando e va fatto soltanto quando la catena CAD/CAM lo richiede.

`G0_FEEDRATE` puo assegnare un feedrate predefinito ai rapidi, ma il sorgente avverte che velocita elevate possono causare ringing e danneggiare la qualita di stampa.

## Come diagnosticare una segmentazione eccessiva

Segnali tipici:

- pause brevi regolari;
- velocita inferiore solo sulle curve;
- differenza tra stampa da SD e USB;
- planner che non mantiene il flusso;
- suono irregolare dei motori;
- superfici con variazioni periodiche;
- problema che peggiora riducendo la tolleranza dello slicer.

Procedura:

1. confrontare un G-code con archi e uno con soli segmenti;
2. contare dimensione e numero di righe;
3. provare da SD per escludere la seriale;
4. ridurre la risoluzione dello slicer entro una tolleranza misurabile;
5. controllare `BLOCK_BUFFER_SIZE` e `SLOWDOWN`;
6. verificare carico della MCU e funzioni costose abilitate;
7. modificare un solo parametro di segmentazione;
8. confrontare tempo, superficie e fedelta dimensionale.

## Procedura di configurazione

1. Lasciare i valori predefiniti della release come riferimento.
2. Verificare che il G-code non sia gia eccessivamente frammentato.
3. Calcolare la frequenza di step nelle condizioni massime.
4. Confermare timing e limite del driver.
5. Provare linee e diagonali lunghe.
6. Provare curve di raggio grande e piccolo.
7. Se si usano archi, verificare endpoint e direzione di `G2`/`G3`.
8. Ridurre gradualmente `MAX_ARC_SEGMENT_MM` solo se la sfaccettatura e misurabile.
9. Con leveling, confrontare segmenti e spaziatura della mesh.
10. Provare la stessa traiettoria da SD e via host.
11. Controllare RAM e dimensione firmware dopo modifiche ai buffer.
12. Conservare il valore meno oneroso che soddisfa la precisione richiesta.

## Errori comuni

- **Pensare che segmenti piu corti siano sempre migliori:** possono saturare planner e seriale.
- **Correggere una curva dello slicer soltanto nel firmware:** i `G1` gia discretizzati conservano la geometria ricevuta.
- **Aumentare `BLOCK_BUFFER_SIZE` senza controllare RAM:** la build o l'esecuzione possono diventare instabili.
- **Confondere lunghezza del segmento e frequenza di correzione:** `N_ARC_CORRECTION` tratta l'errore numerico, non la sfaccettatura principale.
- **Usare il massimo rate del driver come velocita sicura:** motore e meccanica possono fallire prima.
- **Dimenticare la trasformazione Core o Delta nel calcolo degli step:** i motori possono richiedere frequenze maggiori delle coordinate.
- **Ridurre troppo `LEVELED_SEGMENT_LENGTH`:** il planner riceve molti tratti senza un beneficio reale.
- **Abilitare G-code modale senza verificarne il generatore:** righe incomplete possono essere interpretate come movimenti.
- **Attribuire ogni pausa al processore:** spesso il flusso seriale o l'host e la causa.
- **Usare archi senza verificare il dialetto:** interpretazione di centro, raggio e piani deve coincidere.

## Checklist

- Risoluzione dello slicer nota e proporzionata alla precisione meccanica.
- Planner e banda seriale non si svuotano durante percorsi complessi.
- `BLOCK_BUFFER_SIZE` e una potenza di due e rispetta la RAM.
- `MIN_STEPS_PER_SEGMENT` non elimina dettagli necessari.
- Frequenza di step massima calcolata per i motori reali.
- Timing STEP/DIR coerente con i datasheet.
- Parametri degli archi mantengono una tolleranza misurabile.
- `N_ARC_CORRECTION` non e confuso con la lunghezza del segmento.
- Segmentazione del leveling e coerente con la mesh.
- Cinematica non lineare verificata separatamente.
- Test eseguiti sia da supporto locale sia via seriale.
- Ogni modifica e stata confrontata con i valori predefiniti.

## Fonti

- [Configuration.h 2.1.2.8 - Leveling and Kinematics](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration.h)
- [Configuration_adv.h 2.1.2.8 - Motion and Arc Support](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [G0/G1 - Linear Move](https://marlinfw.org/docs/gcode/G000-G001.html)
- [G2/G3 - Arc or Circle Move](https://marlinfw.org/docs/gcode/G002-G003.html)
- [G5 - Bezier Cubic Spline](https://marlinfw.org/docs/gcode/G005.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin|Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Velocita accelerazioni Jerk e Junction Deviation|Velocita accelerazioni Jerk e Junction Deviation]]
- [[Stampante 3D/Marlin/Pagine/Tipo di stampante e cinematica|Tipo di stampante e cinematica]]
- [[Stampante 3D/Marlin/Pagine/Driver stepper corrente e microstepping|Driver stepper corrente e microstepping]]
