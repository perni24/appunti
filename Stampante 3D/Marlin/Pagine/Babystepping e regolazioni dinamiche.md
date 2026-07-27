---
date: 2026-07-25
area: Stampante 3D
topic: Marlin
type: operational-note

publish: true
difficulty: intermedio
tags: [marlin, babystepping, primo-layer, feedrate, flow]
aliases: [Babystepping Marlin, Regolazioni durante la stampa Marlin]
prerequisites:
  - "[[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing]]"
  - "[[Stampante 3D/Marlin/Pagine/Velocita accelerazioni Jerk e Junction Deviation]]"
related: []
marlin-version: "2.1.2.8"
---

# Babystepping e regolazioni dinamiche

## Sintesi

Il Babystepping aggiunge piccoli impulsi agli assi senza modificare le coordinate correnti conosciute dal planner. Viene usato soprattutto per correggere in tempo reale l'altezza Z del primo layer.

Marlin permette inoltre regolazioni temporanee durante la stampa:

- percentuale globale della velocita con `M220`;
- percentuale del flusso con `M221`;
- Babystepping con `M290`;
- parametri di funzioni abilitate, come `M900` o `M593`.

Queste correzioni sono strumenti di messa a punto. Una modifica temporanea non sostituisce la correzione definitiva di offset, profilo slicer o configurazione firmware.

## Quando usarlo

Il Babystepping e utile:

- durante il primo layer;
- per determinare un offset Z corretto;
- dopo una sostituzione di ugello o superficie;
- per confrontare piccoli cambi di altezza;
- per correggere temporaneamente una stampa senza rifare subito l'homing.

Le regolazioni dinamiche sono utili per:

- ridurre la velocita quando compaiono vibrazioni;
- provare un flow differente;
- tarare Linear Advance o Input Shaping;
- recuperare prudentemente una condizione non ottimale.

Non vanno usate per proseguire una stampa con collisioni, perdita di passi, temperatura incontrollata o parti meccaniche allentate.

## Come funziona il Babystepping

Il commento di Marlin 2.1.2.8 specifica che il Babystepping:

- muove gli assi di incrementi molto piccoli;
- non cambia i valori della posizione corrente;
- e destinato principalmente alla regolazione Z del primo layer;
- non rispetta gli endstop.

Quest'ultimo punto e critico. Un babystep negativo puo spingere l'ugello contro il piatto anche quando la coordinata logica sembra valida.

Il planner continua a considerare, per esempio, `Z=0.20`, mentre gli impulsi aggiuntivi hanno spostato fisicamente l'asse rispetto a quella posizione.

## Abilitazione

In `Configuration_adv.h`:

```cpp
//#define BABYSTEPPING
```

La configurazione base riguarda Z. Per aggiungere X e Y:

```cpp
//#define BABYSTEP_XY
```

Il sorgente specifica che `BABYSTEP_XY` non e supportato sulle Delta.

```cpp
#define BABYSTEP_INVERT_Z false
```

inverte il significato della direzione Z soltanto per il Babystepping. Va cambiato se l'interfaccia mostra un aumento ma l'ugello si muove nel verso operativo opposto.

## Requisiti di movimento e homing

Per impostazione normale, il Babystepping e disponibile durante un movimento e dopo che la macchina ha un riferimento valido.

```cpp
//#define BABYSTEP_WITHOUT_HOMING
```

consente di usarlo senza homing. Aumenta il rischio perche il firmware non conosce la posizione rispetto ai limiti.

```cpp
//#define BABYSTEP_ALWAYS_AVAILABLE
```

lo rende disponibile anche quando la macchina non sta eseguendo un movimento.

Queste opzioni vanno abilitate soltanto se l'utente comprende che il Babystepping ignora gli endstop e puo alterare la posizione fisica senza aggiornare le coordinate.

## Dimensione di ogni incremento

```cpp
#define BABYSTEP_MULTIPLICATOR_Z  1
#define BABYSTEP_MULTIPLICATOR_XY 1
```

Senza altre opzioni, il valore e espresso in step o microstep gestiti dalla funzione.

Con:

```cpp
//#define BABYSTEP_MILLIMETER_UNITS
```

i moltiplicatori sono espressi in millimetri.

Per comprendere la risoluzione teorica di Z:

```text
distanza per step = 1 / steps_per_mm
```

Con Z a 400 steps/mm:

```text
1 step = 0.0025 mm
```

Una risoluzione numerica molto piccola non garantisce che la meccanica produca uno spostamento identico. Gioco, elasticita e microstepping riducono la ripetibilita reale.

Un moltiplicatore troppo grande rende difficile trovare il punto corretto; uno troppo piccolo richiede molte azioni sull'encoder e puo confondere l'utente.

## Babystepping integrato

```cpp
//#define INTEGRATED_BABYSTEPPING
```

integra sperimentalmente il Babystepping nell'interrupt degli stepper. Essendo marcato sperimentale nella release, va usato soltanto dopo aver verificato piattaforma, timing e comportamento del movimento.

Non serve normalmente per una configurazione di base.

## Comando `M290`

Forzare esplicitamente le unita in millimetri:

```gcode
G21
```

Applicare +0.05 mm a Z:

```gcode
M290 Z0.05
```

Applicare -0.02 mm a Z:

```gcode
M290 Z-0.02
```

La release limita ogni valore ricevuto da `M290` all'intervallo da -2 a +2 unita asse. Il limite per comando non rende sicuro ripetere molte correzioni consecutive.

`S` e un alias di Z:

```gcode
M290 S0.05
```

Con `BABYSTEP_XY`:

```gcode
M290 X0.02
```

Richiedere un report senza applicare movimento:

```gcode
M290
```

I valori usano le unita correnti. Inviare `G21` prima di una procedura manuale evita che una precedente modalita in pollici trasformi una correzione piccola in un movimento pericoloso.

## Interazione con l'offset del probe

```cpp
//#define BABYSTEP_ZPROBE_OFFSET
```

combina Babystepping e offset Z del probe. Quando e attivo, `M290` modifica anche il Probe Z Offset, ma il nuovo offset non cambia immediatamente il movimento gia in corso: si applica alle successive operazioni di probing.

Per applicare un Babystepping senza cambiare l'offset:

```gcode
M290 P0 Z0.05
```

Se la correzione aggiorna intenzionalmente l'offset, controllare il nuovo valore e salvarlo:

```gcode
M500
```

La convenzione del segno dell'offset deve essere verificata sulla macchina. Non dedurla soltanto dal fatto che l'ugello sembra salire o scendere nel menu.

```cpp
//#define BABYSTEP_HOTEND_Z_OFFSET
```

estende la regolazione agli offset Z relativi dei diversi hotend.

```cpp
//#define BABYSTEP_ZPROBE_GFX_OVERLAY
```

aggiunge un overlay grafico nell'editor dell'offset, se l'interfaccia lo supporta.

## Visualizzazione e accesso rapido

```cpp
//#define BABYSTEP_DISPLAY_TOTAL
```

mostra il totale dei babystep dall'ultimo `G28`. Il totale e utile per trasferire una correzione temporanea nell'offset corretto, ma va azzerato o reinterpretato dopo un nuovo homing.

```cpp
//#define DOUBLECLICK_FOR_Z_BABYSTEPPING
```

permette di aprire la regolazione Z con un doppio clic dalla schermata di stato.

```cpp
#define DOUBLECLICK_MAX_INTERVAL 1250
```

definisce l'intervallo massimo in millisecondi.

Con:

```cpp
//#define MOVE_Z_WHEN_IDLE
```

il doppio clic a macchina ferma apre invece il normale menu di movimento Z. Questo movimento aggiorna la posizione pianificata e non va confuso con il Babystepping.

## Regolazione della velocita con `M220`

Leggere la percentuale:

```gcode
M220
```

Impostare l'80%:

```gcode
M220 S80
```

Ripristinare il 100%:

```gcode
M220 S100
```

`M220` applica un moltiplicatore globale al feedrate dei movimenti G-code X, Y, Z ed E. Non aumenta i limiti massimi del firmware: planner, accelerazioni, `M203` e frequenza di step continuano a porre i propri tetti.

Il comando puo anche conservare e ripristinare un fattore:

```gcode
M220 B
```

Ripristinare il valore conservato:

```gcode
M220 R
```

Il sorgente descrive `B` e `R` principalmente per la gestione MMU2 e MMU2S. Non costituiscono un salvataggio persistente in EEPROM.

La percentuale di velocita cambia anche la durata con cui viene eseguita l'estrusione coordinata, ma non modifica direttamente la quantita relativa di materiale come fa `M221`.

## Regolazione del flow con `M221`

Leggere il flow dell'estrusore attivo:

```gcode
M221
```

Impostare il 95%:

```gcode
M221 S95
```

Ripristinare il 100%:

```gcode
M221 S100
```

Per un estrusore specifico:

```gcode
M221 T1 S98
```

`M221` scala i movimenti E aggiunti al planner. Modifica la quantita di filamento comandata, non la scala geometrica di X/Y/Z.

Un flow temporaneo e utile per una prova, ma il valore definitivo dovrebbe essere riportato nel profilo materiale dello slicer. Non va usato per correggere E-step errati.

## Differenza tra velocita e flow

| Regolazione | Effetto principale | Non corregge |
|---|---|---|
| `M220` | tempo e feedrate globale | quantita relativa di materiale |
| `M221` | quantita comandata all'estrusore | steps/mm o diametro reale |
| `M290` | posizione fisica fine dell'asse | coordinate logiche |

Ridurre `M220` puo cambiare indirettamente la qualita di estrusione perche l'hotend lavora a una portata inferiore. Non significa che il flow sia stato ricalibrato.

## Regolazioni delle compensazioni

Con le funzioni abilitate, durante un test si possono modificare:

Linear Advance:

```gcode
M900 K0.18
```

Input Shaping:

```gcode
M593 X F38.5
```

Junction Deviation:

```gcode
M205 J0.013
```

Accelerazione di stampa:

```gcode
M204 P1000
```

Questi comandi modificano il comportamento dei movimenti successivi. I blocchi gia pianificati possono non riflettere immediatamente la modifica, quindi bisogna lasciare una zona di transizione prima di valutare il risultato.

## Interfaccia con encoder

```cpp
#define ULTIPANEL_FEEDMULTIPLY
```

permette all'encoder di cambiare il moltiplicatore di feedrate dalla schermata di stato.

```cpp
#define ENCODER_RATE_MULTIPLIER
```

accelera la modifica dei valori quando l'encoder viene ruotato rapidamente:

```cpp
#define ENCODER_10X_STEPS_PER_SEC  30
#define ENCODER_100X_STEPS_PER_SEC 80
```

Questa funzione migliora la navigazione, ma rende piu facile oltrepassare un valore desiderato. Durante la regolazione Z conviene ruotare lentamente e controllare il risultato fisico.

```cpp
//#define BEEP_ON_FEEDRATE_CHANGE
```

fornisce un feedback acustico quando il feedrate viene modificato dalla schermata di stato.

## Procedura sicura per il primo layer

1. Verificare che il piatto sia pulito e stabile.
2. Eseguire homing e livellamento previsti.
3. Impostare temporaneamente un primo layer lento.
4. Osservare la linea senza avvicinare mani agli assi.
5. Applicare un singolo incremento Z piccolo.
6. Attendere alcuni centimetri di estrusione.
7. Valutare adesione, larghezza e schiacciamento.
8. Ripetere senza superare i limiti fisici.
9. Annotare il totale.
10. A fine prova trasferire la correzione nell'offset appropriato.
11. Salvare soltanto dopo una nuova verifica.
12. Ripristinare velocita e flow al 100% se erano temporanei.

Segnali di ugello troppo basso:

- linea molto trasparente o assente;
- estrusore che scatta;
- ugello che graffia il piatto;
- materiale spinto lateralmente;
- superficie fortemente ruvida.

Segnali di ugello troppo alto:

- linea rotonda;
- scarsa adesione;
- spazi tra linee adiacenti;
- filamento trascinato dall'ugello.

## Persistenza delle regolazioni

| Regolazione | Normalmente temporanea | Salvabile con EEPROM |
|---|---:|---:|
| Babystep puro | si | no, non come posizione |
| Probe Z Offset combinato | no | si con `M500` |
| `M220` feedrate percent | si | non usarlo come taratura permanente |
| `M221` flow percent | si | preferire il profilo slicer |
| `M900` K | dipende dal flusso | si, se supportato dalla build |
| `M593` shaping | dipende dal flusso | si, se supportato dalla build |

Per controllare cio che Marlin considera impostazione:

```gcode
M503
```

La presenza nel report dipende dalle funzioni compilate. Non presumere che un valore sia salvato solo perche continua a funzionare durante la stampa corrente.

## Errori comuni

- **Usare Babystepping vicino a un limite:** la funzione non rispetta gli endstop.
- **Correggere Z senza homing:** la posizione fisica non e nota.
- **Usare incrementi troppo grandi:** l'ugello puo colpire il piatto.
- **Confondere Babystepping e normale movimento Z:** solo il secondo aggiorna la posizione pianificata.
- **Dimenticare `BABYSTEP_ZPROBE_OFFSET`:** `M290` puo modificare anche l'offset del probe.
- **Salvare un offset dopo una sola linea:** sporco e temperatura possono falsare il risultato.
- **Usare `M220` per superare i limiti firmware:** i limiti restano attivi.
- **Usare `M221` per correggere E-step:** si maschera una calibrazione meccanica errata.
- **Cambiare piu parametri durante lo stesso tratto:** il risultato non e attribuibile a una causa.
- **Dimenticare percentuali diverse da 100:** le stampe successive partono con un comportamento inatteso nella stessa sessione.
- **Ruotare rapidamente l'encoder su Z:** il moltiplicatore puo applicare molti incrementi.
- **Valutare subito una modifica:** alcuni movimenti erano gia nel planner.

## Checklist

- Homing completato prima del Babystepping.
- Direzione positiva e negativa verificata con spazio libero.
- Incremento abbastanza piccolo per la meccanica.
- Unita impostate esplicitamente con `G21`.
- Distanza fisica dagli endstop sufficiente.
- Effetto di `BABYSTEP_ZPROBE_OFFSET` conosciuto.
- Totale dei babystep annotato prima di `G28`.
- Feedrate e flow non sono confusi.
- Percentuali temporanee ripristinate al 100%.
- Una sola regolazione modificata per ogni tratto di prova.
- Offset permanente verificato con una seconda stampa.
- EEPROM salvata soltanto per valori intenzionalmente definitivi.

## Fonti

- [Configuration_adv.h 2.1.2.8 - Babystepping](https://github.com/MarlinFirmware/Marlin/blob/2.1.2.8/Marlin/Configuration_adv.h)
- [M290 - Babystep](https://marlinfw.org/docs/gcode/M290.html)
- [M220 - Set Feedrate Percentage](https://marlinfw.org/docs/gcode/M220.html)
- [M221 - Set Flow Percentage](https://marlinfw.org/docs/gcode/M221.html)

## Collegamenti

- [[Stampante 3D/Marlin/Indice Marlin]]
- [[Stampante 3D/Marlin/Pagine/Endstop homing e Sensorless Homing]]
- [[Stampante 3D/Marlin/Pagine/Velocita accelerazioni Jerk e Junction Deviation]]
- [[Stampante 3D/Marlin/Pagine/Linear Advance Input Shaping e compensazioni geometriche]]
